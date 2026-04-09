import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#8A2BE2';
const LIGHT_PURPLE = '#F3E8FF';
const BORDER_PURPLE = '#D8B4FE';
const TEXT_DARK = '#111827';
const TEXT_MUTED = '#6B7280';
const BORDER_LIGHT = '#E5E7EB';
const STATUS_GREEN = '#22C55E';

const recentUploads = [
  {
    id: 'biology-pdf',
    type: 'pdf',
    name: 'Cell_Biology_Lec_04.pdf',
    meta: 'Uploaded 2 hours ago',
    active: false,
  },
  {
    id: 'history-doc',
    type: 'doc',
    name: 'History_Modern_Era.docx',
    meta: 'Active Note',
    cards: '42 Cards',
    active: true,
  },
];

const previewCards = [
  'What were the primary causes that accelerated the start of World War I?',
  'How did industrialization reshape urban life in 19th-century Europe?',
];

export default function FlashcardsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.85}>
            <Ionicons name="arrow-back" size={22} color={TEXT_DARK} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Generate Flashcards</Text>

          <TouchableOpacity style={styles.infoButton} activeOpacity={0.85}>
            <Ionicons name="information" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.uploadCard}>
            <View style={styles.uploadIconWrap}>
              <Ionicons name="cloud-upload" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.uploadTitle}>Upload Files</Text>
            <Text style={styles.uploadSubtitle}>
              PDF, Doc, or images of your notes
            </Text>
            <TouchableOpacity style={styles.selectButton} activeOpacity={0.88}>
              <Text style={styles.selectButtonText}>Select Files</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Uploads</Text>
              <TouchableOpacity activeOpacity={0.85}>
                <Text style={styles.sectionLink}>View all</Text>
              </TouchableOpacity>
            </View>

            {recentUploads.map((file) => (
              <TouchableOpacity
                key={file.id}
                style={[
                  styles.uploadItem,
                  file.active && styles.uploadItemActive,
                ]}
                activeOpacity={0.9}
              >
                <View style={styles.fileLeading}>
                  <View style={styles.fileIconBox}>
                    <Ionicons
                      name={
                        file.type === 'pdf'
                          ? 'document-text'
                          : 'document-outline'
                      }
                      size={22}
                      color={PRIMARY}
                    />
                  </View>

                  <View style={styles.fileTextWrap}>
                    <Text style={styles.fileName}>{file.name}</Text>

                    {file.active ? (
                      <View style={styles.activeMetaRow}>
                        <View style={styles.statusDot} />
                        <Text style={styles.activeMetaText}>
                          {file.meta} • {file.cards}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.fileMeta}>{file.meta}</Text>
                    )}
                  </View>
                </View>

                {file.active ? (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  </View>
                ) : (
                  <TouchableOpacity activeOpacity={0.8} style={styles.menuIcon}>
                    <Ionicons
                      name="ellipsis-vertical"
                      size={18}
                      color={TEXT_MUTED}
                    />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Generated Flashcards</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>42 Flashcards</Text>
              </View>
            </View>

            {previewCards.map((question, index) => (
              <TouchableOpacity
                key={`${question}-${index}`}
                style={styles.previewCard}
                activeOpacity={0.92}
              >
                <View style={styles.previewHeader}>
                  <Text style={styles.previewLabel}>QUESTION</Text>
                  <Ionicons name="pencil" size={16} color="#C4C4C4" />
                </View>

                <Text style={styles.previewQuestion}>{question}</Text>

                <Text style={styles.answerLabel}>ANSWER PREVIEW</Text>
                <Text style={styles.answerHint}>
                  Tap to reveal the full answer...
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.manualCardButton}
              activeOpacity={0.9}
            >
              <Ionicons name="add" size={18} color={PRIMARY} />
              <Text style={styles.manualCardText}>Create Manual Card</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryAction} activeOpacity={0.9}>
            <View style={styles.playIconWrap}>
              <Ionicons name="play" size={14} color={PRIMARY} />
            </View>
            <Text style={styles.primaryActionText}>
              Start Flashcard Session
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_DARK,
    marginHorizontal: 8,
  },
  infoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 140,
  },
  uploadCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: BORDER_PURPLE,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  uploadIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 18,
  },
  selectButton: {
    backgroundColor: PRIMARY,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_DARK,
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY,
  },
  uploadItem: {
    borderWidth: 1,
    borderColor: BORDER_LIGHT,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  uploadItemActive: {
    borderWidth: 2,
    borderColor: PRIMARY,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  fileLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  fileIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: LIGHT_PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileTextWrap: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 6,
  },
  fileMeta: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  activeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: STATUS_GREEN,
    marginRight: 8,
  },
  activeMetaText: {
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY,
  },
  menuIcon: {
    width: 28,
    alignItems: 'center',
  },
  checkBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: LIGHT_PURPLE,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY,
  },
  previewCard: {
    borderWidth: 1,
    borderColor: '#EFEAF7',
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: PRIMARY,
    letterSpacing: 1.2,
  },
  previewQuestion: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: TEXT_DARK,
    marginBottom: 18,
  },
  answerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  answerHint: {
    fontSize: 14,
    color: TEXT_MUTED,
    fontStyle: 'italic',
  },
  manualCardButton: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: BORDER_PURPLE,
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  manualCardText: {
    fontSize: 15,
    fontWeight: '700',
    color: PRIMARY,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.96)',
  },
  primaryAction: {
    borderRadius: 20,
    backgroundColor: PRIMARY,
    minHeight: 64,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  playIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
