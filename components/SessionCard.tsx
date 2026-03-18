import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StudySession } from '../src/api/sessions';

interface SessionCardProps {
  session: StudySession;
  onDelete: (id: string) => Promise<void>;
  isDeleting?: boolean;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onDelete,
  isDeleting = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDeletePress = () => {
    if (isLoading || isDeleting) {
      return;
    }
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (isLoading || isDeleting) {
      return;
    }

    setIsLoading(true);
    setShowDeleteModal(false);
    try {
      await onDelete(session.id);
    } catch (_error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  const isCurrentlyDeleting = isLoading || isDeleting;

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {session.title}
        </Text>
        {session.subject && (
          <Text style={styles.subject} numberOfLines={1}>
            Subject: {session.subject}
          </Text>
        )}
        <Text style={styles.date}>
          Created: {formatDate(session.created_at)}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.deleteButton,
          isCurrentlyDeleting && styles.deleteButtonDisabled,
        ]}
        onPress={handleDeletePress}
        activeOpacity={0.7}
        disabled={isCurrentlyDeleting}
      >
        {isCurrentlyDeleting ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.deleteButtonText}>Delete</Text>
        )}
      </TouchableOpacity>

      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Session</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this session?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelDelete}
                disabled={isCurrentlyDeleting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteModalButton]}
                onPress={handleConfirmDelete}
                disabled={isCurrentlyDeleting}
              >
                {isCurrentlyDeleting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.deleteModalButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  subject: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#6b7280',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    backgroundColor: '#f87171',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    color: '#4b5563',
    fontWeight: '600',
    fontSize: 16,
  },
  deleteModalButton: {
    backgroundColor: '#ef4444',
  },
  deleteModalButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});
