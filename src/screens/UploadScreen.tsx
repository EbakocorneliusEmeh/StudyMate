import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { uploadFile } from '../services/api';

export default function UploadScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success'>('idle');

  const pickAndUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'text/plain',
          'text/markdown',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
      });
      
      if (!result.canceled) {
        setStatus('uploading');
        const asset = result.assets[0];
        const response = await uploadFile(
          asset.uri,
          asset.name,
          asset.mimeType || 'application/pdf',
          params.sessionId,
        );
        setStatus('success');
        setTimeout(() => {
          setStatus('idle');
          router.push({
            pathname: '/ai-companion',
            params: {
              documentId: response.documentId,
              sessionId: params.sessionId,
              fileName: response.fileName || asset.name,
            },
          });
        }, 800);
      }
    } catch (_err) {
      alert("Upload failed. Is the backend running?");
      setStatus('idle');
    }
  };

  return (
    <View style={styles.center}>
      <Text style={styles.title}>Upload Study Material</Text>
      <Text style={styles.subtitle}>
        Add PDFs or notes, then continue directly into AI Companion.
      </Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={pickAndUpload}
        disabled={status === 'uploading'}
      >
        {status === 'uploading' ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.btnText}>
            {status === 'success'
              ? 'Opening AI Companion...'
              : 'Select Study File'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  btn: {
    backgroundColor: '#16a34a',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  btnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});
