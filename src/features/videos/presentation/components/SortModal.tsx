import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useVideosStore , SortOptions } from '../stores/videos-store';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SortModal: React.FC<SortModalProps> = ({ visible, onClose }) => {
  const { sortOptions, sortVideos } = useVideosStore();

  const [localSortBy, setLocalSortBy] = useState<SortOptions['sortBy']>('publishedDate');
  const [localSortOrder, setLocalSortOrder] = useState<SortOptions['sortOrder']>('descending');

  useEffect(() => {
    if (visible) {
      setLocalSortBy(sortOptions.sortBy);
      setLocalSortOrder(sortOptions.sortOrder);
    }
  }, [visible, sortOptions]);

  const handleApply = () => {
    sortVideos(localSortBy, localSortOrder);
    onClose();
  };

  const renderSortByOption = (value: SortOptions['sortBy'], label: string, description: string) => {
    const isSelected = localSortBy === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
        onPress={() => setLocalSortBy(value)}
      >
        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{label}</Text>
        <Text style={[styles.optionDesc, isSelected && styles.optionDescSelected]}>{description}</Text>
      </TouchableOpacity>
    );
  };

  const renderSortOrderOption = (value: SortOptions['sortOrder'], label: string, description: string) => {
    const isSelected = localSortOrder === value;
    return (
      <TouchableOpacity
        key={value}
        style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
        onPress={() => setLocalSortOrder(value)}
      >
        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{label}</Text>
        <Text style={[styles.optionDesc, isSelected && styles.optionDescSelected]}>{description}</Text>
      </TouchableOpacity>
    );
  };

  const getSummary = () => {
    const by = localSortBy === 'publishedDate' ? 'Publication Date' : 'Recording Date';
    const order = localSortOrder === 'descending' ? 'Newest First' : 'Oldest First';
    return `${by} (${order})`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>Sort Videos</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            <View style={styles.optionsContainer}>
              {renderSortByOption('publishedDate', 'Publication Date', 'Sort by when the video was published on YouTube.')}
              {renderSortByOption('recordingDate', 'Recording Date', 'Sort by when the video was recorded (falls back to publication date if unknown).')}
            </View>

            <Text style={styles.sectionTitle}>Order</Text>
            <View style={styles.optionsContainer}>
              {renderSortOrderOption('descending', 'Newest First', 'Most recent dates appear first.')}
              {renderSortOrderOption('ascending', 'Oldest First', 'Oldest dates appear first.')}
            </View>

            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Current Selection:</Text>
              <Text style={styles.previewText}>{getSummary()}</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Sort</Text>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#4285F4',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  optionButtonSelected: {
    backgroundColor: '#e8f0fe',
    borderColor: '#4285F4',
  },
  optionText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  optionTextSelected: {
    color: '#1a73e8',
    fontWeight: '600',
  },
  optionDesc: {
    color: '#666',
    fontSize: 12,
  },
  optionDescSelected: {
    color: '#1a73e8',
  },
  previewContainer: {
    padding: 16,
    backgroundColor: '#f1f3f4',
    borderRadius: 8,
    marginTop: 8,
  },
  previewLabel: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  applyButton: {
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#4285F4',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
