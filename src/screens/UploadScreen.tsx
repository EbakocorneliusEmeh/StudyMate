import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ApiError, uploadFile } from '../api/upload';

export default function UploadScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success'>(
    'idle',
  );

  const uploadToAi = async (uri: string, name: string, type: string) => {
    try {
      setStatus('uploading');
      const response = await uploadFile(
        { uri, name, type },
        params.sessionId,
        params.sessionId ? `session-${params.sessionId}` : undefined,
      );
      setStatus('success');
      Alert.alert('Upload complete', 'Do you want to open AI Companion now?', [
        { text: 'Not now', style: 'cancel', onPress: () => setStatus('idle') },
        {
          text: 'Open AI now',
          onPress: () => {
            setStatus('idle');
            router.push({
              pathname: '/ai-companion',
              params: {
                documentId: response.document_id,
                sessionId: params.sessionId,
                fileName: response.file_name || name,
              },
            });
          },
        },
      ]);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Upload failed. Please try again.';
      Alert.alert('Upload failed', message);
      setStatus('idle');
    }
  };

  const pickImageAndUpload = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Please allow photo library access to upload images.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    await uploadToAi(
      asset.uri,
      asset.fileName || 'image.jpg',
      asset.mimeType || 'image/jpeg',
    );
  };

  const pickPdfAndUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    console.log('[UploadScreen] Selected file URI:', asset.uri);
    console.log('[UploadScreen] Selected file name:', asset.name);
    await uploadToAi(
      asset.uri,
      asset.name,
      asset.mimeType || 'application/pdf',
    );
  };

  const pickDocumentAndUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'text/plain',
        'text/markdown',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    await uploadToAi(
      asset.uri,
      asset.name,
      asset.mimeType || 'application/octet-stream',
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload Study Material</Text>
        <Text style={styles.subtitle}>
          Choose what you want to upload, then we'll open it in AI Companion.
        </Text>
      </View>

      <View style={styles.cardGrid}>
        <TouchableOpacity
          style={[styles.choiceCard, styles.imageCard]}
          onPress={() => void pickImageAndUpload()}
          disabled={status === 'uploading'}
        >
          <Text style={styles.choiceLabel}>Image</Text>
          <Text style={styles.choiceText}>Photos and screenshots</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.choiceCard, styles.pdfCard]}
          onPress={() => void pickPdfAndUpload()}
          disabled={status === 'uploading'}
        >
          <Text style={styles.choiceLabel}>PDF</Text>
          <Text style={styles.choiceText}>PDF study files</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.choiceCard, styles.docCard]}
          onPress={() => void pickDocumentAndUpload()}
          disabled={status === 'uploading'}
        >
          <Text style={styles.choiceLabel}>Document</Text>
          <Text style={styles.choiceText}>Notes, DOC, DOCX, TXT</Text>
        </TouchableOpacity>
      </View>

      {status === 'uploading' && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#7f13ec" />
          <Text style={styles.loadingText}>Uploading...</Text>
        </View>
      )}

      {status === 'success' && (
        <Text style={styles.successText}>
          Uploaded successfully. Choose whether to open AI.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f6f8',
    paddingHorizontal: 24,
    paddingTop: 64,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 10,
    lineHeight: 22,
  },
  cardGrid: {
    gap: 14,
  },
  choiceCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.08)',
    backgroundColor: '#ffffff',
  },
  imageCard: {
    backgroundColor: '#ecfeff',
  },
  pdfCard: {
    backgroundColor: '#fef3c7',
  },
  docCard: {
    backgroundColor: '#ede9fe',
  },
  choiceLabel: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  choiceText: {
    fontSize: 14,
    color: '#475569',
  },
  loadingRow: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  successText: {
    marginTop: 16,
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
});
