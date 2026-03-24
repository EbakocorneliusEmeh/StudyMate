import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ApiError, getSession, getSessionFiles, linkFileToSession, StudySession, unlinkFileFromSession } from '../../src/api/sessions';
import { deleteFile, ApiError as UploadApiError, uploadFile, validateFile } from '../../src/api/upload';

interface SessionFile {
  id: string;
  session_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

type UploadStatus = 'idle' | 'selecting' | 'uploading' | 'success' | 'error';

type UploadType = 'notes' | 'pdf' | 'picture' | null;

export default function SessionDetailScreen() {
  const params = useLocalSearchParams();
  const id = params.id as string | undefined;
  const router = useRouter();
  
  const [session, setSession] = useState<StudySession | null>(null);
  const [files, setFiles] = useState<SessionFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; type: string; size: number } | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [uploadType, setUploadType] = useState<UploadType>(null);

  const fetchSession = useCallback(async () => {
    if (!id) {
      console.log('Session ID is undefined');
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Fetching session:', id);
      const data = await getSession(id);
      console.log('Session data received:', data);
      setSession(data);
      
      try {
        const sessionFiles = await getSessionFiles(id);
        setFiles(sessionFiles);
      } catch (fileError) {
        console.log('Error fetching session files:', fileError);
      }
    } catch (err) {
      console.log('Error fetching session:', err);
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to load session';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchSession();
    }, [fetchSession]),
  );

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSelectFile = async (type?: UploadType) => {
    try {
      setUploadStatus('selecting');
      setErrorMessage(null);

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        setErrorMessage('Permission to access media library is required');
        setUploadStatus('error');
        return;
      }

      let mediaTypes = ImagePicker.MediaTypeOptions.All;
      if (type === 'picture') {
        mediaTypes = ImagePicker.MediaTypeOptions.Images;
      } else if (type === 'pdf') {
        mediaTypes = ImagePicker.MediaTypeOptions.Videos; 
      } else if (type === 'notes') {
        mediaTypes = ImagePicker.MediaTypeOptions.All;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: mediaTypes,
        allowsEditing: false,
        quality: 1,
        selectionLimit: 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setUploadStatus('idle');
        return;
      }

      const asset = result.assets[0];
      
      if (type === 'pdf') {
        const fileExt = asset.uri.split('.').pop()?.toLowerCase();
        if (fileExt !== 'pdf') {
          setErrorMessage('Please select a PDF file');
          setUploadStatus('error');
          return;
        }
      }
      
      const fileInfo = await getFileInfo(asset);
      
      const validationError = validateFile({ type: fileInfo.type, size: fileInfo.size });
      if (validationError) {
        setErrorMessage(validationError);
        setUploadStatus('error');
        return;
      }

      setSelectedFile(fileInfo);
      setUploadStatus('idle');
    } catch {
      setErrorMessage('Failed to select file. Please try again.');
      setUploadStatus('error');
    }
  };

  const getFileInfo = async (asset: ImagePicker.ImagePickerAsset) => {
    const uri = asset.uri;
    const name = uri.split('/').pop() || 'file';
    
    const extension = name.split('.').pop()?.toLowerCase();
    let type = '';
    
    const typeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      heic: 'image/heic',
      heif: 'image/heif',
      pdf: 'application/pdf',
      txt: 'text/plain',
      md: 'text/markdown',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    
    // First try to get type from extension
    if (extension && typeMap[extension]) {
      type = typeMap[extension];
    } else if (asset.type && asset.type.includes('/')) {
      type = asset.type;
    } else {
      type = 'image/jpeg';
    }

    return {
      uri,
      name,
      type,
      size: asset.fileSize || 0,
    };
  };

  const handleUploadTypeSelect = (type: UploadType) => {
    setUploadType(type);
    setShowUploadMenu(false);
    handleSelectFile(type);
  };

  const handleUpload = async () => {
    if (!selectedFile || !id) {
      setErrorMessage('Please select a file first');
      return;
    }

    try {
      setUploadStatus('uploading');
      setProgress(0);
      setErrorMessage(null);

      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await uploadFile(
        {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.type,
        },
        `session-${id}`
      );

      clearInterval(progressInterval);
      setProgress(100);
      setUploadStatus('success');

      try {
        const linkedFile = await linkFileToSession(
          id,
          result.file_url,
          result.file_name,
          result.file_type,
          result.file_size
        );
        
        setFiles((prev) => [...prev, linkedFile]);
      } catch (linkError) {
        console.log('Error linking file to session:', linkError);
        const newFile: SessionFile = {
          id: Date.now().toString(),
          session_id: id,
          file_name: result.file_name,
          file_url: result.file_url,
          file_type: result.file_type,
          file_size: result.file_size,
          created_at: new Date().toISOString(),
        };
        setFiles((prev) => [...prev, newFile]);
      }

      setTimeout(() => {
        setSelectedFile(null);
        setUploadStatus('idle');
        setProgress(0);
        router.push('/(tabs)/explore');
      }, 1500);

    } catch (error) {
      setProgress(0);
      setUploadStatus('error');
      
      if (error instanceof UploadApiError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Failed to upload file. Please try again.');
      }
    }
  };

  const handleDeleteFile = async (fileId: string, fileUrl: string, index: number) => {
    Alert.alert(
      'Delete File',
      'Are you sure you want to delete this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
             
              const isValidUuid = fileId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fileId);
              
              if (id && isValidUuid) {
                try {
                  console.log('Unlinking file:', fileId, 'from session:', id);
                  await unlinkFileFromSession(id, fileId);
                  console.log('File unlinked successfully');
                } catch (unlinkError) {
                  console.log('Error unlinking file from session:', unlinkError);
                  // Continue with file deletion even if unlink fails
                }
              }
              
              // Delete the actual file from storage
              if (fileUrl) {
                console.log('Deleting file from storage:', fileUrl);
              await deleteFile(fileUrl);
                console.log('File deleted from storage');
              }
              
              setFiles((prev) => prev.filter((_, i) => i !== index));
              Alert.alert('Success', 'File deleted successfully');
            } catch (error) {
              console.error('Delete file error:', error);
              setFiles((prev) => prev.filter((_, i) => i !== index));
              const errorMessage = error instanceof Error ? error.message : 'Failed to delete file';
              Alert.alert('Warning', errorMessage + ' (File removed from list)');
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return 'image-outline';
    if (type === 'application/pdf') return 'document-text-outline';
    if (type.includes('word')) return 'document-outline';
    if (type.startsWith('text/')) return 'document-text-outline';
    return 'attach-outline';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7f13ec" />
          <Text style={styles.loadingText}>Loading session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Session not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Session Details
        </Text>
      </View>

      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <View style={styles.content}>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionTitle}>{session.title}</Text>
              {session.subject && (
                <View style={styles.subjectContainer}>
                  <Ionicons name="book-outline" size={16} color="#7f13ec" />
                  <Text style={styles.sessionSubject}>{session.subject}</Text>
                </View>
              )}
              <View style={styles.dateContainer}>
                <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                <Text style={styles.sessionDate}>
                  Created: {formatDate(session.created_at)}
                </Text>
              </View>
            </View>

            <View style={styles.uploadSection}>
              <Text style={styles.sectionTitle}>
                <Ionicons name="cloud-upload-outline" size={20} color="#1f2937" /> 
                {' '}Upload Study Materials
              </Text>
              
              <View style={styles.uploadCard}>
                {selectedFile ? (
                  <View style={styles.selectedFileContainer}>
                    <View style={styles.fileIconContainer}>
                      <Ionicons 
                        name={getFileIcon(selectedFile.type) as keyof typeof Ionicons.glyphMap} 
                        size={32} 
                        color="#7f13ec" 
                      />
                    </View>
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {selectedFile.name}
                      </Text>
                      <Text style={styles.fileSize}>
                        {formatFileSize(selectedFile.size)}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => setSelectedFile(null)}
                      style={styles.removeFileButton}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.selectButton}
                    onPress={() => setShowUploadMenu(true)}
                    disabled={uploadStatus === 'selecting' || uploadStatus === 'uploading'}
                  >
                    {uploadStatus === 'selecting' ? (
                      <ActivityIndicator size="large" color="#7f13ec" />
                    ) : (
                      <>
                        <Ionicons name="add-circle-outline" size={48} color="#7f13ec" />
                        <Text style={styles.selectTitle}>Select a file</Text>
                        <Text style={styles.selectSubtitle}>
                          Images, PDF, Text, Word documents
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {uploadStatus === 'uploading' && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>
                      Uploading... {progress}%
                    </Text>
                  </View>
                )}

                {errorMessage && (
                  <View style={styles.messageContainer}>
                    <Ionicons name="alert-circle" size={20} color="#ef4444" />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                {uploadStatus === 'success' && (
                  <View style={styles.messageContainer}>
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text style={styles.successText}>File uploaded successfully!</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.uploadButton,
                    (!selectedFile || uploadStatus === 'uploading') && 
                    styles.uploadButtonDisabled
                  ]}
                  onPress={handleUpload}
                  disabled={!selectedFile || uploadStatus === 'uploading'}
                >
                  {uploadStatus === 'uploading' ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="cloud-done-outline" size={20} color="white" />
                      <Text style={styles.uploadButtonText}>Upload to Session</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.filesSection}>
                <Text style={styles.filesSectionTitle}>
                  <Ionicons name="folder-outline" size={20} color="#1f2937" />
                  {' '}Session Files ({files.length})
                </Text>

                {files.length === 0 ? (
                  <View style={styles.emptyFiles}>
                    <Ionicons name="document-attach-outline" size={40} color="#cbd5e1" />
                    <Text style={styles.emptyFilesText}>
                      No files uploaded yet
                    </Text>
                    <Text style={styles.emptyFilesSubtext}>
                      Upload notes and study materials above
                    </Text>
                  </View>
                ) : (
                  <View style={styles.filesList}>
                    {files.map((file, index) => (
                      <View key={file.id} style={styles.fileItem}>
                        <Ionicons 
                          name={getFileIcon(file.file_type) as keyof typeof Ionicons.glyphMap} 
                          size={24} 
                          color="#7f13ec" 
                        />
                        <View style={styles.fileItemInfo}>
                          <Text style={styles.fileItemName} numberOfLines={1}>
                            {file.file_name}
                          </Text>
                          <Text style={styles.fileItemSize}>
                            {formatFileSize(file.file_size)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteFile(file.id, file.file_url, index)}
                        >
                          <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      <Modal
        visible={showUploadMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUploadMenu(false)}
      >
        <Pressable 
          style={styles.menuOverlay}
          onPress={() => setShowUploadMenu(false)}
        >
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Upload File</Text>
            <Text style={styles.menuSubtitle}>Select the type of file you want to upload</Text>
            
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => handleUploadTypeSelect('notes')}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="document-text-outline" size={24} color="#d97706" />
              </View>
              <View style={styles.menuOptionContent}>
                <Text style={styles.menuOptionTitle}>Notes</Text>
                <Text style={styles.menuOptionSubtitle}>Text, Markdown, Word documents</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => handleUploadTypeSelect('pdf')}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="document-text-outline" size={24} color="#dc2626" />
              </View>
              <View style={styles.menuOptionContent}>
                <Text style={styles.menuOptionTitle}>PDF</Text>
                <Text style={styles.menuOptionSubtitle}>PDF documents</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => handleUploadTypeSelect('picture')}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="image-outline" size={24} color="#2563eb" />
              </View>
              <View style={styles.menuOptionContent}>
                <Text style={styles.menuOptionTitle}>Picture</Text>
                <Text style={styles.menuOptionSubtitle}>Images from your gallery</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCancelButton}
              onPress={() => setShowUploadMenu(false)}
            >
              <Text style={styles.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerBackButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  content: {
    padding: 16,
  },
  sessionInfo: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sessionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  subjectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionSubject: {
    fontSize: 16,
    color: '#7f13ec',
    marginLeft: 8,
    fontWeight: '500',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionDate: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  uploadSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  uploadCard: {
    marginBottom: 20,
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 14,
    color: '#6b7280',
  },
  removeFileButton: {
    padding: 4,
  },
  selectButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 32,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  selectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 12,
  },
  selectSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7f13ec',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginLeft: 8,
    flex: 1,
  },
  successText: {
    fontSize: 14,
    color: '#10b981',
    marginLeft: 8,
    flex: 1,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7f13ec',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  uploadButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  filesSection: {
    marginTop: 8,
  },
  filesSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  emptyFiles: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  emptyFilesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
  },
  emptyFilesSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  filesList: {
    gap: 12,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  fileItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  fileItemSize: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  listContent: {
    flexGrow: 1,
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#7f13ec',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Upload Menu Styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  menuContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuOptionContent: {
    flex: 1,
  },
  menuOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  menuOptionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  menuCancelButton: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  menuCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
});