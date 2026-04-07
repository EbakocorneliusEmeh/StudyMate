import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const FlashcardsScreen = () => {
  const recentUploads = [
    {
      id: 1,
      name: 'Cell_Biology_Lec_04.pdf',
      uploaded: 'Uploaded 2 hours ago',
      type: 'pdf',
      active: false,
    },
    {
      id: 2,
      name: 'History_Modern_Era.docx',
      uploaded: 'Active Note • 42 Cards',
      type: 'docx',
      active: true,
    },
  ];

  const generatedCards = [
    {
      id: 1,
      question: 'What were the primary causes of World War I?',
      answerPreview: 'Tap to reveal the full answer...',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="arrow-back" size={24} color="#8A2BE2" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Generate Flashcards</Text>
        <TouchableOpacity>
          <View style={styles.infoIcon}>
            <Ionicons name="information-circle" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Upload Section */}
        <View style={styles.uploadSection}>
          <View style={styles.uploadIcon}>
            <Ionicons name="cloud-upload" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.uploadTitle}>Upload Files</Text>
          <Text style={styles.uploadSubtitle}>
            PDF, Doc, or images of your notes
          </Text>
          <TouchableOpacity style={styles.selectButton}>
            <Text style={styles.selectButtonText}>Select Files</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Uploads */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Uploads</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>
        {recentUploads.map((upload) => (
          <View
            key={upload.id}
            style={[styles.uploadCard, upload.active && styles.activeCard]}
          >
            <Ionicons
              name={upload.type === 'pdf' ? 'document' : 'document-text'}
              size={24}
              color="#8A2BE2"
            />
            <View style={styles.uploadInfo}>
              <Text style={styles.uploadName}>{upload.name}</Text>
              <Text
                style={[styles.uploadMeta, upload.active && styles.activeMeta]}
              >
                {upload.uploaded}
              </Text>
            </View>
            {upload.active ? (
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark-circle" size={24} color="#8A2BE2" />
              </View>
            ) : (
              <TouchableOpacity>
                <Ionicons name="ellipsis-vertical" size={24} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Generated Flashcards */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Generated Flashcards</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>42 Flashcards</Text>
          </View>
        </View>
        {generatedCards.map((card) => (
          <View key={card.id} style={styles.cardPreview}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>QUESTION</Text>
              <TouchableOpacity>
                <Ionicons name="pencil" size={16} color="#CCC" />
              </TouchableOpacity>
            </View>
            <Text style={styles.question}>{card.question}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.answerLabel}>ANSWER PREVIEW</Text>
              <Text style={styles.answerPreview}>{card.answerPreview}</Text>
            </View>
          </View>
        ))}
        <TouchableOpacity style={styles.manualButton}>
          <Ionicons name="add" size={24} color="#8A2BE2" />
          <Text style={styles.manualText}>Create Manual Card</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.startButton}>
          <View style={styles.playIcon}>
            <Ionicons name="play" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.startText}>Start Flashcard Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  uploadSection: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D8BFD8', // light purple
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8A2BE2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  selectButton: {
    backgroundColor: '#8A2BE2',
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  viewAll: {
    color: '#8A2BE2',
    fontSize: 14,
  },
  uploadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  activeCard: {
    borderWidth: 3,
    borderColor: '#8A2BE2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  uploadInfo: {
    flex: 1,
    marginLeft: 12,
  },
  uploadName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  uploadMeta: {
    fontSize: 14,
    color: '#666',
  },
  activeMeta: {
    color: '#8A2BE2',
  },
  checkIcon: {
    // already has the icon
  },
  badge: {
    backgroundColor: '#F0E6FF', // light purple
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#8A2BE2',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardPreview: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 12,
    color: '#8A2BE2',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  question: {
    fontSize: 16,
    color: '#000',
    marginBottom: 12,
  },
  cardFooter: {
    marginTop: 12,
  },
  answerLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  answerPreview: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D8BFD8',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  manualText: {
    color: '#8A2BE2',
    fontSize: 16,
    marginLeft: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8A2BE2',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  playIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  startText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default FlashcardsScreen;
