import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { validateFile, ALLOWED_FILE_TYPES } from '../src/api/upload';

interface FlashcardFile {
  uri: string | File;
  name: string;
  type: string;
  size: number;
}

interface FlashcardUploaderProps {
  visible: boolean;
  onClose: () => void;
  onFileSelected: (file: FlashcardFile, extractedText?: string) => void;
  onTextSubmit?: (text: string, fileName: string) => void;
}

type UploadStatus = 'idle' | 'selecting' | 'processing' | 'ready' | 'error';

export const FlashcardUploader: React.FC<FlashcardUploaderProps> = ({
  visible,
  onClose,
  onFileSelected,
  onTextSubmit,
}) => {
  const [selectedFile, setSelectedFile] = useState<FlashcardFile | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [manualText, setManualText] = useState('');
  const [textFileName, setTextFileName] = useState('my-notes.txt');

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setExtractedText('');
    setStatus('idle');
    setErrorMessage(null);
    setShowTextInput(false);
    setManualText('');
    setTextFileName('my-notes.txt');
  }, []);

  React.useEffect(() => {
    if (visible) {
      resetState();
    }
  }, [visible, resetState]);

  if (!visible) {
    return null;
  }

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
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setStatus('idle');
        return;
      }

      const asset = result.assets[0];
      const fileInfo: FlashcardFile = {
        uri: asset.uri,
        name: asset.fileName || `image-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
        size: asset.fileSize || 0,
      };

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
      setStatus('ready');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to select image. Please try again.';
      setErrorMessage(message);
      setStatus('error');
    }
  };

  const handleSelectDocument = async () => {
    try {
      setStatus('selecting');
      setErrorMessage(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/plain', 'text/markdown'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setStatus('idle');
        return;
      }

      const asset = result.assets[0];
      const extension = asset.name.split('.').pop()?.toLowerCase() || '';
      const typeMap: Record<string, string> = {
        pdf: 'application/pdf',
        txt: 'text/plain',
        md: 'text/markdown',
      };

      const fileInfo: FlashcardFile = {
        uri: asset.uri,
        name: asset.name,
        type:
          typeMap[extension] || asset.mimeType || 'application/octet-stream',
        size: asset.size || 0,
      };

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
      setStatus('ready');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to select document. Please try again.';
      setErrorMessage(message);
      setStatus('error');
    }
  };

  const handleWebFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ALLOWED_FILE_TYPES.join(',');
    input.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      const file = target?.files?.[0];
      if (file) {
        const fileInfo: FlashcardFile = {
          uri: file,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
        };

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
        setStatus('ready');
      }
    };
    input.click();
  };

  const handleSelectFile = () => {
    const isMobile = Platform.OS === 'android' || Platform.OS === 'ios';

    if (!isMobile) {
      handleWebFileSelect();
      return;
    }

    Alert.alert('Select File Type', 'Choose what you want to upload', [
      {
        text: 'Image',
        onPress: () => handleSelectImage(),
      },
      {
        text: 'PDF',
        onPress: () => handleSelectDocument(),
      },
      {
        text: 'Text Note',
        onPress: () => {
          setShowTextInput(true);
          setStatus('ready');
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSubmitText = () => {
    if (!manualText.trim()) {
      setErrorMessage('Please enter some text to generate flashcards from');
      setStatus('error');
      return;
    }

    onTextSubmit?.(manualText, textFileName || 'text-note.txt');
    onClose();
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onFileSelected(selectedFile, extractedText);
      onClose();
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return 'image-outline';
    if (type === 'application/pdf') return 'document-text-outline';
    if (type.startsWith('text/')) return 'document-text-outline';
    return 'attach-outline';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.overlayBackground} onPress={onClose} />
      <View style={styles.modalContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Generate Flashcards</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Upload a PDF, image, or paste text to generate flashcards using AI
          </Text>

          {showTextInput ? (
            <View style={styles.textInputContainer}>
              <Text style={styles.sectionLabel}>Enter your study notes</Text>
              <TextInput
                style={styles.textInput}
                multiline
                placeholder="Paste your notes or text here..."
                value={manualText}
                onChangeText={setManualText}
                textAlignVertical="top"
              />

              <Text style={styles.sectionLabel}>Filename (optional)</Text>
              <TextInput
                style={styles.fileNameInput}
                placeholder="my-notes.txt"
                value={textFileName}
                onChangeText={setTextFileName}
              />
            </View>
          ) : selectedFile ? (
            <View style={styles.selectedFileCard}>
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
                onPress={() => {
                  setSelectedFile(null);
                  setStatus('idle');
                }}
                style={styles.removeButton}
              >
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.dropZone}
              onPress={handleSelectFile}
              disabled={status === 'selecting'}
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
                  <Text style={styles.dropTitle}>Tap to select a file</Text>
                  <Text style={styles.dropSubtitle}>
                    Images, PDFs, and text files
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.actions}>
            {!showTextInput && !selectedFile && (
              <TouchableOpacity
                style={styles.textButton}
                onPress={() => {
                  setShowTextInput(true);
                  setStatus('ready');
                }}
              >
                <Ionicons name="create-outline" size={20} color="#7f13ec" />
                <Text style={styles.textButtonLabel}>
                  Or paste text directly
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {errorMessage && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#94a3b8"
            />
            <Text style={styles.infoText}>
              Max 10MB. Supported: JPEG, PNG, PDF, TXT, MD
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.generateButton,
              (status === 'idle' || status === 'selecting') &&
                styles.generateButtonDisabled,
            ]}
            onPress={showTextInput ? handleSubmitText : handleSubmit}
            disabled={status === 'idle' || status === 'selecting'}
          >
            <LinearGradient
              colors={
                status === 'selecting'
                  ? ['#9ca3af', '#9ca3af']
                  : ['#7f13ec', '#6366f1']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.generateButtonGradient}
            >
              {status === 'selecting' ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="white" />
                  <Text style={styles.generateButtonText}>
                    {showTextInput
                      ? 'Generate from Text'
                      : 'Generate Flashcards'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 20,
  },
  dropZone: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
  },
  dropSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  selectedFileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
  removeButton: {
    padding: 8,
  },
  textInputContainer: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    fontSize: 16,
    minHeight: 150,
    color: '#1e293b',
  },
  fileNameInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    marginTop: 4,
  },
  actions: {
    marginTop: 16,
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  textButtonLabel: {
    fontSize: 16,
    color: '#7f13ec',
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  generateButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonGradient: {
    flexDirection: 'row',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default FlashcardUploader;
