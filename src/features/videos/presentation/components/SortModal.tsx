import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SortOptions {
  sortBy: 'publishedDate' | 'recordingDate';
  sortOrder: 'ascending' | 'descending';
}

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  currentSortOptions: SortOptions;
  onApplySort: (options: SortOptions) => void;
}

export const SortModal: React.FC<SortModalProps> = ({
  visible,
  onClose,
  currentSortOptions,
  onApplySort,
}) => {
  const [sortBy, setSortBy] = useState<'publishedDate' | 'recordingDate'>(currentSortOptions.sortBy);
  const [sortOrder, setSortOrder] = useState<'ascending' | 'descending'>(currentSortOptions.sortOrder);

  useEffect(() => {
    setSortBy(currentSortOptions.sortBy);
    setSortOrder(currentSortOptions.sortOrder);
  }, [visible, currentSortOptions]);

  const handleApply = () => {
    onApplySort({ sortBy, sortOrder });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sort Videos</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Sort By</Text>
          <View style={styles.optionsList}>
            <TouchableOpacity
              style={[styles.optionButton, sortBy === 'publishedDate' && styles.optionButtonSelected]}
              onPress={() => setSortBy('publishedDate')}
            >
              <View>
                <Text style={[styles.optionText, sortBy === 'publishedDate' && styles.optionTextSelected]}>Publication Date</Text>
                <Text style={[styles.optionDescription, sortBy === 'publishedDate' && styles.optionDescriptionSelected]}>Sort by when the video was published on YouTube</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.optionButton, sortBy === 'recordingDate' && styles.optionButtonSelected]}
              onPress={() => setSortBy('recordingDate')}
            >
              <View>
                <Text style={[styles.optionText, sortBy === 'recordingDate' && styles.optionTextSelected]}>Recording Date</Text>
                <Text style={[styles.optionDescription, sortBy === 'recordingDate' && styles.optionDescriptionSelected]}>Sort by when the video was recorded (falls back to pub date)</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Order</Text>
          <View style={styles.optionsList}>
            <TouchableOpacity
              style={[styles.optionButton, sortOrder === 'descending' && styles.optionButtonSelected]}
              onPress={() => setSortOrder('descending')}
            >
              <View>
                <Text style={[styles.optionText, sortOrder === 'descending' && styles.optionTextSelected]}>Newest First</Text>
                <Text style={[styles.optionDescription, sortOrder === 'descending' && styles.optionDescriptionSelected]}>Descending order</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, sortOrder === 'ascending' && styles.optionButtonSelected]}
              onPress={() => setSortOrder('ascending')}
            >
              <View>
                <Text style={[styles.optionText, sortOrder === 'ascending' && styles.optionTextSelected]}>Oldest First</Text>
                <Text style={[styles.optionDescription, sortOrder === 'ascending' && styles.optionDescriptionSelected]}>Ascending order</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Current Selection</Text>
            <Text style={styles.summaryText}>
              {sortBy === 'publishedDate' ? 'Published Date' : 'Recording Date'} - {sortOrder === 'descending' ? 'Newest First' : 'Oldest First'}
            </Text>
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
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  optionsList: {
    gap: 8,
    marginBottom: 24,
  },
  optionButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionButtonSelected: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionTextSelected: {
    color: '#fff',
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
  },
  optionDescriptionSelected: {
    color: '#e0e0e0',
  },
  summaryContainer: {
    marginTop: 'auto',
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b6d4fe',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#004085',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#004085',
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
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});