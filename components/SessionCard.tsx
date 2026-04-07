import { Ionicons } from '@expo/vector-icons';
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
    if (isLoading || isDeleting) return;
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    setShowDeleteModal(false);
    try {
      await onDelete(session.id);
    } catch (_error) {
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentlyDeleting = isLoading || isDeleting;

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={() => onPress?.(session.id)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          {session.subject ? (
            <View style={styles.subjectBadge}>
              <Text style={styles.subjectText}>{session.subject}</Text>
            </View>
          ) : (
            <View />
          )}

          <TouchableOpacity
            onPress={handleDeletePress}
            style={styles.iconButton}
            disabled={isCurrentlyDeleting}
          >
            {isCurrentlyDeleting ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Ionicons name="trash-outline" size={18} color="#94a3b8" />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.title} numberOfLines={1}>
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

      {/* AMETHYST PULSE MODAL */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
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
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteModalButton]}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.deleteModalButtonText}>Delete</Text>
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
    borderRadius: 20, // lg radius
    padding: 20,
    marginBottom: 4,
    // Tonal layering shadow (no lines)
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
    backgroundColor: 'rgba(127, 19, 236, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subjectText: {
    color: '#7f13ec',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Lexend',
    textTransform: 'uppercase',
  },
  iconButton: {
    padding: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a', // slate-900
    fontFamily: 'Lexend',
    marginBottom: 12,
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
  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // deep slate overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    width: '100%',
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
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    width: '100%',
    padding: 20,
  },
  cancelButtonText: {
    color: '#64748b',
    fontWeight: '700',
    fontFamily: 'Lexend',
    fontSize: 14,
  },
  deleteModalButton: {
    backgroundColor: '#ef4444',
    width: '100%',
    padding: 20,
  },
  deleteModalButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontFamily: 'Lexend',
    fontSize: 14,
  },
  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // deep slate overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    width: '100%',
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
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    width: '100%',
    padding: 20,
  },
  cancelButtonText: {
    color: '#64748b',
    fontWeight: '700',
    fontFamily: 'Lexend',
    fontSize: 14,
  },
  deleteModalButton: {
    backgroundColor: '#ef4444',
    width: '100%',
    padding: 20,
  },
  deleteModalButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontFamily: 'Lexend',
    fontSize: 14,
  },
});
