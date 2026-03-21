import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView } from 'react-native';

export type SortBy = 'publishedAt' | 'recordingDate';
export type SortOrder = 'desc' | 'asc';

export interface SortOptions {
  sortBy: SortBy;
  sortOrder: SortOrder;
}

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  currentSort: SortOptions;
  onApply: (sort: SortOptions) => void;
}

export default function SortModal({
  visible,
  onClose,
  currentSort,
  onApply,
}: SortModalProps) {
  const [localSortBy, setLocalSortBy] = useState<SortBy>('publishedAt');
  const [localSortOrder, setLocalSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    if (visible) {
      setLocalSortBy(currentSort.sortBy);
      setLocalSortOrder(currentSort.sortOrder);
    }
  }, [visible, currentSort]);

  const handleApply = () => {
    onApply({
      sortBy: localSortBy,
      sortOrder: localSortOrder,
    });
  };

  const renderOption = (
    label: string,
    description: string,
    isSelected: boolean,
    onSelect: () => void
  ) => {
    return (
      <TouchableOpacity
        style={[styles.option, isSelected && styles.optionSelected]}
        onPress={onSelect}
      >
        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
          {label}
        </Text>
        <Text style={[styles.optionDesc, isSelected && styles.optionDescSelected]}>
          {description}
        </Text>
      </TouchableOpacity>
    );
  };

  const currentSelectionText = `${localSortBy === 'publishedAt' ? 'Publication Date' : 'Recording Date'} - ${localSortOrder === 'desc' ? 'Newest First' : 'Oldest First'}`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Sort Videos</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Sort By</Text>
          {renderOption(
            'Publication Date',
            'When the video was published on YouTube',
            localSortBy === 'publishedAt',
            () => setLocalSortBy('publishedAt')
          )}
          {renderOption(
            'Recording Date',
            'When the video was actually recorded (falls back to publication date)',
            localSortBy === 'recordingDate',
            () => setLocalSortBy('recordingDate')
          )}

          <Text style={styles.sectionTitle}>Order</Text>
          {renderOption(
            'Newest First',
            'Most recent videos at the top',
            localSortOrder === 'desc',
            () => setLocalSortOrder('desc')
          )}
          {renderOption(
            'Oldest First',
            'Oldest videos at the top',
            localSortOrder === 'asc',
            () => setLocalSortOrder('asc')
          )}

          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Current Selection:</Text>
            <Text style={styles.previewText}>{currentSelectionText}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Sort</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeText: {
    fontSize: 16,
    color: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
  },
  option: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  optionSelected: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  optionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  optionTextSelected: {
    color: '#fff',
  },
  optionDesc: {
    fontSize: 12,
    color: '#666',
  },
  optionDescSelected: {
    color: '#e0e0e0',
  },
  previewContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  previewText: {
    fontSize: 14,
    color: '#4285F4',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  applyButton: {
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
