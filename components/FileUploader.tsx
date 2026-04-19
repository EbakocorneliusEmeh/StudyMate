import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { linkFileToSession } from '../src/api/sessions';
import {
  ApiError,
  deleteFile,
  UploadedFile,
  uploadFile,
  validateFile,
} from '../src/api/upload';

interface Session {
  id: string;
  title: string;
  subject?: string | null;
  created_at: string;
}

interface FileUploaderProps {
  visible: boolean;
  onClose: () => void;
  sessions: Session[];
  initialSessionId?: string;
  onUploadComplete?: (file: UploadedFile, sessionId: string) => void;
  onUploadSuccess?: (message: string) => void;
  onUploadError?: (message: string) => void;
}

type UploadStatus = 'idle' | 'selecting' | 'uploading' | 'success' | 'error';

export const FileUploader: React.FC<FileUploaderProps> = ({
  visible,
  onClose,
  sessions,
  initialSessionId,
  onUploadComplete,
  onUploadSuccess,
  onUploadError,
}) => {
  const [selectedFile, setSelectedFile] = useState<{
    uri: string | File;
    name: string;
    type: string;
    size: number;
  } | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSessionPicker, setShowSessionPicker] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<
    { file: UploadedFile; sessionId: string }[]
  >([]);

  React.useEffect(() => {
    if (visible) {
      resetState();
      if (initialSessionId) {
        setSelectedSessionId(initialSessionId);
      } else if (sessions && sessions.length > 0) {
        setSelectedSessionId(sessions[0].id);
      }
    }
  }, [initialSessionId, sessions, visible]);

  const resetState = () => {
    setSelectedFile(null);
    setSelectedSessionId('');
    setStatus('idle');
    setProgress(0);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const setValidatedFile = (fileInfo: {
    uri: string | File;
    name: string;
    type: string;
    size: number;
  }) => {
    const validationError = validateFile({
      type: fileInfo.type,
      size: fileInfo.size,
    });
    if (validationError) {
      setErrorMessage(validationError);
      setStatus('error');
      return;
    }

    setSelectedFile(fileInfo);
    setStatus('idle');
  };

  const handleSelectImage = async () => {
    try {
      setStatus('selecting');
      setErrorMessage(null);

      const { status: permissionStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionStatus !== 'granted') {
        setErrorMessage('Permission to access media library is required');
        setStatus('error');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: false,
        legacy: Platform.OS === 'android',
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setStatus('idle');
        return;
      }

      const asset = result.assets[0];
      const fileInfo = await getImageFileInfo(asset);
      setValidatedFile(fileInfo);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to select file. Please try again.';
      setErrorMessage(message);
      setStatus('error');
    }
  };

  const handleSelectDocument = async () => {
    try {
      setStatus('selecting');
      setErrorMessage(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'text/plain',
          'text/markdown',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setStatus('idle');
        return;
      }

      const fileInfo = getDocumentFileInfo(result.assets[0]);
      setValidatedFile(fileInfo);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to select document. Please try again.';
      setErrorMessage(message);
      setStatus('error');
    }
  };

  const handleSelectFile = () => {
    console.log('[FileUploader] handleSelectFile, Platform.OS:', Platform.OS);

    // Detect actual platform - use native mobile pickers on Android/iOS
    const isNativeMobile = Platform.OS === 'android' || Platform.OS === 'ios';
    const isWebPlatform = Platform.OS === 'web';

    // On native mobile (Android/iOS), always use native pickers
    if (isNativeMobile) {
      console.log('[FileUploader] Using native mobile picker');
      Alert.alert('Select File Type', 'Choose what you want to upload', [
        {
          text: 'Image',
          onPress: () => {
            void handleSelectImage();
          },
        },
        {
          text: 'PDF or Note',
          onPress: () => {
            void handleSelectDocument();
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }

    // For web platform (desktop browser), use file input
    if (isWebPlatform) {
      console.log('[FileUploader] Using web file input');
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,.pdf,.txt,.md,.doc,.docx';
      input.onchange = async (event: Event) => {
        const target = event.target as HTMLInputElement | null;
        const file = target?.files?.[0];
        if (file) {
          const fileInfo = {
            uri: file,
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size,
          };
          setValidatedFile(fileInfo);
        }
      };
      input.click();
      return;
    }

    // Fallback for unknown platform - try native pickers anyway
    console.log('[FileUploader] Unknown platform, using fallback');
    Alert.alert('Select File Type', 'Choose what you want to upload', [
      {
        text: 'Image',
        onPress: () => {
          void handleSelectImage();
        },
      },
      {
        text: 'PDF or Note',
        onPress: () => {
          void handleSelectDocument();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const getImageFileInfo = async (asset: ImagePicker.ImagePickerAsset) => {
    const uri = asset.uri;
    const name = asset.fileName || uri.split('/').pop() || 'file';

    let type = asset.mimeType || 'application/octet-stream';
    const extension = name.split('.').pop()?.toLowerCase();

    const typeMap: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
      txt: 'text/plain',
      md: 'text/markdown',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    if (extension && typeMap[extension]) {
      type = typeMap[extension];
    }

    return {
      uri,
      name,
      type,
      size: asset.fileSize || 0,
    };
  };

  const getDocumentFileInfo = (asset: DocumentPicker.DocumentPickerAsset) => {
    let type = asset.mimeType || 'application/octet-stream';
    const extension = asset.name.split('.').pop()?.toLowerCase();

    const typeMap: Record<string, string> = {
      pdf: 'application/pdf',
      txt: 'text/plain',
      md: 'text/markdown',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    if (extension && typeMap[extension]) {
      type = typeMap[extension];
    }

    return {
      uri: asset.uri,
      name: asset.name,
      type,
      size: asset.size || 0,
    };
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a file first');
      return;
    }

    if (!selectedSessionId) {
      setErrorMessage('Please select a session to link the file to');
      return;
    }

    let progressInterval: ReturnType<typeof setInterval> | null = null;

    try {
      setStatus('uploading');
      setProgress(0);
      setErrorMessage(null);
      setSuccessMessage(null);

      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            if (progressInterval) {
              clearInterval(progressInterval);
            }
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Step 1: Upload the file to /api/upload
      const uploadResult = await uploadFile(
        {
          uri: selectedFile.uri as string,
          name: selectedFile.name,
          type: selectedFile.type,
        },
        selectedSessionId,
        `session-${selectedSessionId}`,
      );

      if (!uploadResult.linked_to_session) {
        await linkFileToSession(
          selectedSessionId,
          uploadResult.file_url,
          uploadResult.file_name,
          uploadResult.file_type,
          uploadResult.file_size,
        );
      }

      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setProgress(100);
      setStatus('success');
      const successText = 'File uploaded and linked to session successfully!';
      setSuccessMessage(successText);

      setUploadedFiles((prev) => [
        ...prev,
        { file: uploadResult, sessionId: selectedSessionId },
      ]);

      if (onUploadComplete) {
        onUploadComplete(uploadResult, selectedSessionId);
      }
      onUploadSuccess?.(successText);

      setTimeout(() => {
        setSelectedFile(null);
        setStatus('idle');
        setProgress(0);
        setSuccessMessage(null);
      }, 2000);
    } catch (error) {
      setProgress(0);
      setStatus('error');

      let message = 'Failed to upload file. Please try again.';
      if (error instanceof ApiError) {
        message = error.message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      setErrorMessage(message);
      onUploadError?.(message);
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    }
  };

  const handleDeleteFile = async (fileUrl: string, index: number) => {
    Alert.alert('Delete File', 'Are you sure you want to delete this file?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFile(fileUrl);
            setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
            Alert.alert('Success', 'File deleted successfully');
          } catch {
            Alert.alert('Error', 'Failed to delete file');
          }
        },
      },
    ]);
  };

  const getSelectedSessionTitle = () => {
    if (!selectedSessionId) return 'Select a session';
    const session = sessions.find((s) => s.id === selectedSessionId);
    return session?.title || 'Unknown session';
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

  const _getStatusColor = () => {
    switch (status) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'uploading':
        return '#7f13ec';
      default:
        return '#6b7280';
    }
  };

  if (!visible) {
    return null;
  }

  // Debug logging
  console.log(
    '[FileUploader] Render: sessions=',
    sessions?.length,
    'status=',
    status,
    'selectedFile=',
    selectedFile ? 'yes' : 'no',
  );

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.overlayBackground} onPress={onClose} />
      <View style={styles.modalContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upload File</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Debug: Show if sessions is empty/missing */}
          {(!sessions || sessions.length === 0) && (
            <View
              style={{
                padding: 10,
                backgroundColor: '#fef3c7',
                marginBottom: 10,
              }}
            >
              <Text>
                Debug: No sessions found (add session in Sessions tab)
              </Text>
            </View>
          )}
          <View style={styles.dropZone}>
            {selectedFile ? (
              <View style={styles.selectedFileContainer}>
                <View style={styles.fileIconContainer}>
                  <Ionicons
                    name={
                      getFileIcon(
                        selectedFile.type,
                      ) as keyof typeof Ionicons.glyphMap
                    }
                    size={40}
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
                onPress={handleSelectFile}
                disabled={status === 'selecting' || status === 'uploading'}
              >
                {status === 'selecting' ? (
                  <ActivityIndicator size="large" color="#7f13ec" />
                ) : (
                  <>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={48}
                      color="#7f13ec"
                    />
                    <Text style={styles.selectTitle}>Tap to select a file</Text>
                    <Text style={styles.selectSubtitle}>
                      Images, PDFs, and note files
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.sessionSection}>
            <Text style={styles.sectionLabel}>Link to Session</Text>
            <TouchableOpacity
              style={styles.sessionSelector}
              onPress={() => setShowSessionPicker(true)}
              disabled={status === 'uploading'}
            >
              <Ionicons name="folder-outline" size={20} color="#94a3b8" />
              <Text style={styles.sessionSelectorText}>
                {getSelectedSessionTitle()}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {status === 'uploading' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>Uploading... {progress}%</Text>
            </View>
          )}

          {errorMessage && (
            <View style={styles.messageContainer}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {successMessage && (
            <View style={styles.messageContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          <View style={styles.infoContainer}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#94a3b8"
            />
            <Text style={styles.infoText}>
              Allowed: Images, PDF, Text, Word documents (max 10MB)
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.uploadButton,
              (!selectedFile || !selectedSessionId || status === 'uploading') &&
                styles.uploadButtonDisabled,
            ]}
            onPress={handleUpload}
            disabled={
              !selectedFile || !selectedSessionId || status === 'uploading'
            }
          >
            <LinearGradient
              colors={
                status === 'uploading'
                  ? ['#9ca3af', '#9ca3af']
                  : ['#7f13ec', '#6366f1']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.uploadButtonGradient}
            >
              {status === 'uploading' ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="cloud-done-outline" size={20} color="white" />
                  <Text style={styles.uploadButtonText}>Upload File</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <View style={styles.uploadedFilesSection}>
              <Text style={styles.sectionLabel}>Uploaded Files</Text>
              {uploadedFiles.map((item, index) => {
                const session = sessions.find((s) => s.id === item.sessionId);
                return (
                  <View key={index} style={styles.uploadedFileItem}>
                    <Ionicons
                      name={
                        getFileIcon(
                          item.file.file_type,
                        ) as keyof typeof Ionicons.glyphMap
                      }
                      size={24}
                      color="#7f13ec"
                    />
                    <View style={styles.uploadedFileInfo}>
                      <Text style={styles.uploadedFileName} numberOfLines={1}>
                        {item.file.file_name}
                      </Text>
                      <Text style={styles.uploadedFileSession}>
                        Session: {session?.title || 'Unknown'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        handleDeleteFile(item.file.file_url, index)
                      }
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#ef4444"
                      />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Session Picker Modal */}
        {showSessionPicker && (
          <View style={styles.sessionPickerContainer}>
            <Pressable
              style={styles.sessionPickerOverlay}
              onPress={() => setShowSessionPicker(false)}
            >
              <View style={styles.sessionPickerContent}>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Select a Session</Text>
                  <TouchableOpacity onPress={() => setShowSessionPicker(false)}>
                    <Ionicons name="close" size={24} color="#6b7280" />
                  </TouchableOpacity>
                </View>

                {sessions.length === 0 ? (
                  <View style={styles.emptySessions}>
                    <Ionicons
                      name="folder-open-outline"
                      size={48}
                      color="#cbd5e1"
                    />
                    <Text style={styles.emptyText}>No sessions available</Text>
                    <Text style={styles.emptySubtext}>
                      Create a session first to upload files
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={sessions}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.sessionItem,
                          selectedSessionId === item.id &&
                            styles.sessionItemSelected,
                        ]}
                        onPress={() => {
                          setSelectedSessionId(item.id);
                          setShowSessionPicker(false);
                        }}
                      >
                        <View style={styles.sessionItemIcon}>
                          <Ionicons
                            name="folder"
                            size={20}
                            color={
                              selectedSessionId === item.id
                                ? '#ffffff'
                                : '#7f13ec'
                            }
                          />
                        </View>
                        <View style={styles.sessionItemContent}>
                          <Text
                            style={[
                              styles.sessionItemTitle,
                              selectedSessionId === item.id &&
                                styles.sessionItemTitleSelected,
                            ]}
                          >
                            {item.title}
                          </Text>
                          {item.subject && (
                            <Text style={styles.sessionItemSubject}>
                              {item.subject}
                            </Text>
                          )}
                        </View>
                        {selectedSessionId === item.id && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#ffffff"
                          />
                        )}
                      </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => (
                      <View style={styles.separator} />
                    )}
                  />
                )}
              </View>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  sessionPickerContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    padding: 20,
  },
  sessionPickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionPickerContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  container: {
    flex: 1,
    backgroundColor: '#f7f6f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  dropZone: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e5e7eb',
    padding: 32,
    marginBottom: 20,
  },
  selectButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
  },
  selectSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 14,
    color: '#6b7280',
  },
  removeFileButton: {
    padding: 8,
  },
  sessionSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    marginLeft: 4,
  },
  sessionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  sessionSelectorText: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    marginLeft: 12,
  },
  progressContainer: {
    marginBottom: 20,
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
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
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
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 4,
  },
  uploadButton: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonGradient: {
    flexDirection: 'row',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  uploadedFilesSection: {
    marginTop: 8,
  },
  uploadedFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  uploadedFileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  uploadedFileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  uploadedFileSession: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  emptySessions: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  sessionItemSelected: {
    backgroundColor: '#7f13ec',
  },
  sessionItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionItemContent: {
    flex: 1,
  },
  sessionItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  sessionItemTitleSelected: {
    color: '#ffffff',
  },
  sessionItemSubject: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
});

export default FileUploader;
