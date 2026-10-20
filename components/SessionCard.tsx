import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StudySession } from '../src/api/sessions';

interface SessionCardProps {
  session: StudySession;
  onDelete: (id: string) => Promise<void>;
  onPress?: (id: string) => void;
  isDeleting?: boolean;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onDelete,
  onPress,
  isDeleting = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
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
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={() => onPress?.(session.id)}
        activeOpacity={0.82}
      >
        <View style={styles.cardHeader}>
          {session.subject ? (
            <View style={styles.subjectBadge}>
              <Text style={styles.subjectText}>{session.subject}</Text>
            </View>
          ) : (
            <View style={styles.subjectBadgeGhost} />
          )}

          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleDeletePress}
            activeOpacity={0.8}
            disabled={isCurrentlyDeleting}
          >
            {isCurrentlyDeleting ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Ionicons name="trash-outline" size={18} color="#94a3b8" />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {session.title}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#64748b" />
            <Text style={styles.metaText}>
              {formatDate(session.created_at)}
            </Text>
          </View>

          <View style={styles.dotSeparator} />

          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color="#64748b" />
            <Text style={styles.metaText}>
              {formatTime(session.created_at)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.warningIconContainer}>
              <Ionicons name="alert-circle" size={32} color="#ef4444" />
            </View>
            <Text style={styles.modalTitle}>Delete Session?</Text>
            <Text style={styles.modalMessage}>
              This action cannot be undone. All session data will be permanently
              removed.
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
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectBadge: {
    maxWidth: '78%',
    backgroundColor: 'rgba(127, 19, 236, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subjectBadgeGhost: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Lexend',
    marginBottom: 12,
  },
  subjectText: {
    color: '#7f13ec',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Lexend',
    textTransform: 'uppercase',
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Lexend',
    fontWeight: '400',
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  warningIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'Lexend',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Lexend',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    color: '#64748b',
    fontWeight: '700',
    fontFamily: 'Lexend',
    fontSize: 14,
  },
  deleteModalButton: {
    backgroundColor: '#ef4444',
  },
  deleteModalButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontFamily: 'Lexend',
    fontSize: 14,
  },
});
