import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  getCollaborators,
  getPendingInvites,
  getSharedWithMe,
  inviteCollaborator,
  removeCollaborator,
  respondToInvite,
} from '../../src/api/collaboration';
import { CollaborationInvite, Collaborator } from '../../src/types';

export default function CollaborationScreen() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [invites, setInvites] = useState<CollaborationInvite[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'editor' | 'viewer'>(
    'viewer',
  );
  const [activeTab, setActiveTab] = useState<
    'collaborators' | 'invites' | 'shared'
  >('collaborators');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [collab, pendingInvites, shared] = await Promise.all([
        getCollaborators('').catch(() => []),
        getPendingInvites().catch(() => []),
        getSharedWithMe().catch(() => []),
      ]);
      setCollaborators(collab);
      setInvites(pendingInvites);
      setSharedWithMe(shared);
    } catch (_error) {
      console.error('Error loading collaboration data:', _error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteUserId.trim() || !sessionId.trim()) {
      Alert.alert('Error', 'Please enter user ID and session ID');
      return;
    }
    try {
      await inviteCollaborator(
        sessionId.trim(),
        inviteUserId.trim(),
        selectedRole,
      );
      Alert.alert('Success', 'Invitation sent!');
      setShowInviteModal(false);
      setInviteUserId('');
      setSessionId('');
      loadData();
    } catch (_error) {
      Alert.alert('Error', 'Failed to send invitation');
    }
  };

  const handleRespondToInvite = async (
    inviteSessionId: string,
    status: 'accepted' | 'rejected',
  ) => {
    try {
      await respondToInvite(inviteSessionId, status);
      Alert.alert('Success', `Invite ${status}!`);
      loadData();
    } catch (_error) {
      Alert.alert('Error', `Failed to ${status} invite`);
    }
  };

  const handleRemoveCollaborator = async (collabId: string) => {
    Alert.alert(
      'Remove Collaborator',
      'Are you sure you want to remove this collaborator?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              if (sessionId) {
                await removeCollaborator(sessionId, collabId);
                loadData();
              }
            } catch (_error) {
              Alert.alert('Error', 'Failed to remove collaborator');
            }
          },
        },
      ],
    );
  };

  const renderEmptyState = (
    icon: React.ComponentProps<typeof Ionicons>['name'],
    text: string,
  ) => (
    <View style={styles.emptyContainer}>
      <Ionicons name={icon} size={64} color="#d1d5db" />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7f13ec" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collaboration</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowInviteModal(true)}
        >
          <Ionicons name="person-add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'collaborators' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('collaborators')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'collaborators' && styles.activeTabText,
            ]}
          >
            Team ({collaborators.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'invites' && styles.activeTab]}
          onPress={() => setActiveTab('invites')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'invites' && styles.activeTabText,
            ]}
          >
            Invites ({invites.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shared' && styles.activeTab]}
          onPress={() => setActiveTab('shared')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'shared' && styles.activeTabText,
            ]}
          >
            Shared ({sharedWithMe.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'collaborators' &&
        (collaborators.length === 0 ? (
          renderEmptyState('people-outline', 'No collaborators yet')
        ) : (
          <FlatList
            data={collaborators}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={20} color="#7f13ec" />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>
                    {item.name || item.userId}
                  </Text>
                  <Text style={styles.itemSubtitle}>{item.role}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveCollaborator(item.id)}
                >
                  <Ionicons
                    name="remove-circle-outline"
                    size={20}
                    color="#ef4444"
                  />
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        ))}

      {activeTab === 'invites' &&
        (invites.length === 0 ? (
          renderEmptyState('mail-outline', 'No pending invites')
        ) : (
          <FlatList
            data={invites}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={20} color="#7f13ec" />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{item.sessionId}</Text>
                  <Text style={styles.itemSubtitle}>
                    {item.role} - {item.status}
                  </Text>
                </View>
                {item.status === 'pending' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() =>
                        handleRespondToInvite(item.sessionId, 'accepted')
                      }
                    >
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() =>
                        handleRespondToInvite(item.sessionId, 'rejected')
                      }
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        ))}

      {activeTab === 'shared' &&
        (sharedWithMe.length === 0 ? (
          renderEmptyState('folder-outline', 'No sessions shared with you')
        ) : (
          <FlatList
            data={sharedWithMe}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.listItem}>
                <View style={styles.avatar}>
                  <Ionicons name="folder" size={20} color="#7f13ec" />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>
                    {item.name || item.sessionId || 'Shared Session'}
                  </Text>
                  <Text style={styles.itemSubtitle}>{item.role}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        ))}

      <Modal visible={showInviteModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Collaborator</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="User ID (email or ID)"
              value={inviteUserId}
              onChangeText={setInviteUserId}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Session ID"
              value={sessionId}
              onChangeText={setSessionId}
            />
            <Text style={styles.roleLabel}>Select Role</Text>
            <View style={styles.roleOptions}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  selectedRole === 'viewer' && styles.roleOptionActive,
                ]}
                onPress={() => setSelectedRole('viewer')}
              >
                <Text
                  style={[
                    styles.roleOptionText,
                    selectedRole === 'viewer' && styles.roleOptionTextActive,
                  ]}
                >
                  Viewer
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  selectedRole === 'editor' && styles.roleOptionActive,
                ]}
                onPress={() => setSelectedRole('editor')}
              >
                <Text
                  style={[
                    styles.roleOptionText,
                    selectedRole === 'editor' && styles.roleOptionTextActive,
                  ]}
                >
                  Editor
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleInvite}
            >
              <Text style={styles.submitButtonText}>Send Invitation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7f13ec',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  activeTab: {
    backgroundColor: '#7f13ec',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#22c55e',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  roleOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  roleOptionActive: {
    borderColor: '#7f13ec',
    backgroundColor: '#7f13ec10',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  roleOptionTextActive: {
    color: '#7f13ec',
  },
  submitButton: {
    backgroundColor: '#7f13ec',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
