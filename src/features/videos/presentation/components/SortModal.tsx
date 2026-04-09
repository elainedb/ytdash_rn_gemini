import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useVideosStore } from '../stores/videos-store';

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SortModal: React.FC<SortModalProps> = ({ visible, onClose }) => {
  const { sortOptions, sortVideos } = useVideosStore();
  
  const [localSortBy, setLocalSortBy] = useState<'publishedDate' | 'recordingDate'>(sortOptions.sortBy);
  const [localSortOrder, setLocalSortOrder] = useState<'ascending' | 'descending'>(sortOptions.sortOrder);

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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Sort Options</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Sort By</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={[styles.option, localSortBy === 'publishedDate' && styles.optionSelected]}
              onPress={() => setLocalSortBy('publishedDate')}
            >
              <Text style={[styles.optionText, localSortBy === 'publishedDate' && styles.optionTextSelected]}>Publication Date</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.option, localSortBy === 'recordingDate' && styles.optionSelected]}
              onPress={() => setLocalSortBy('recordingDate')}
            >
              <Text style={[styles.optionText, localSortBy === 'recordingDate' && styles.optionTextSelected]}>Recording Date</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Order</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={[styles.option, localSortOrder === 'descending' && styles.optionSelected]}
              onPress={() => setLocalSortOrder('descending')}
            >
              <Text style={[styles.optionText, localSortOrder === 'descending' && styles.optionTextSelected]}>Newest First</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.option, localSortOrder === 'ascending' && styles.optionSelected]}
              onPress={() => setLocalSortOrder('ascending')}
            >
              <Text style={[styles.optionText, localSortOrder === 'ascending' && styles.optionTextSelected]}>Oldest First</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.previewBox}>
            <Text style={styles.previewTitle}>Current Selection:</Text>
            <Text style={styles.previewText}>
              {localSortBy === 'publishedDate' ? 'Published' : 'Recorded'} - {localSortOrder === 'descending' ? 'Newest' : 'Oldest'}
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
  container: {
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeText: {
    fontSize: 16,
    color: '#4285F4',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  optionSelected: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  optionText: {
    color: '#333',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  previewBox: {
    marginTop: 40,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  previewTitle: {
    fontSize: 14,
    color: '#666',
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
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 8,
    width: '100%',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
