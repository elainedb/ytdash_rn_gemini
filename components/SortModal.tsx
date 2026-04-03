import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';

export type SortField = 'publishedAt' | 'recordingDate';
export type SortOrder = 'desc' | 'asc';

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  selectedField: SortField;
  selectedOrder: SortOrder;
  onApply: (field: SortField, order: SortOrder) => void;
}

const SortModal: React.FC<SortModalProps> = ({
  visible,
  onClose,
  selectedField,
  selectedOrder,
  onApply,
}) => {
  const [localField, setLocalField] = useState<SortField>(selectedField);
  const [localOrder, setLocalOrder] = useState<SortOrder>(selectedOrder);

  const handleApply = () => {
    onApply(localField, localOrder);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sort Videos</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Sort By</Text>
          <TouchableOpacity
            style={[styles.option, localField === 'publishedAt' && styles.selectedOption]}
            onPress={() => setLocalField('publishedAt')}
          >
            <View>
              <Text style={[styles.optionTitle, localField === 'publishedAt' && styles.selectedOptionText]}>Publication Date</Text>
              <Text style={[styles.optionDesc, localField === 'publishedAt' && styles.selectedOptionText]}>When the video was uploaded to YouTube</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, localField === 'recordingDate' && styles.selectedOption]}
            onPress={() => setLocalField('recordingDate')}
          >
            <View>
              <Text style={[styles.optionTitle, localField === 'recordingDate' && styles.selectedOptionText]}>Recording Date</Text>
              <Text style={[styles.optionDesc, localField === 'recordingDate' && styles.selectedOptionText]}>When the video was actually recorded (if available)</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Order</Text>
          <TouchableOpacity
            style={[styles.option, localOrder === 'desc' && styles.selectedOption]}
            onPress={() => setLocalOrder('desc')}
          >
            <View>
              <Text style={[styles.optionTitle, localOrder === 'desc' && styles.selectedOptionText]}>Newest First</Text>
              <Text style={[styles.optionDesc, localOrder === 'desc' && styles.selectedOptionText]}>Most recent videos at the top</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, localOrder === 'asc' && styles.selectedOption]}
            onPress={() => setLocalOrder('asc')}
          >
            <View>
              <Text style={[styles.optionTitle, localOrder === 'asc' && styles.selectedOptionText]}>Oldest First</Text>
              <Text style={[styles.optionDesc, localOrder === 'asc' && styles.selectedOptionText]}>Earliest videos at the top</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Current Selection</Text>
            <Text style={styles.previewText}>
              Sorting by {localField === 'publishedAt' ? 'Publication Date' : 'Recording Date'} 
              {' '}({localOrder === 'desc' ? 'Newest First' : 'Oldest First'})
            </Text>
          </View>
        </ScrollView>

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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 16,
    color: '#4285F4',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
  },
  option: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  selectedOption: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 14,
    color: '#666',
  },
  selectedOptionText: {
    color: '#fff',
  },
  previewContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
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
    fontWeight: '600',
    color: '#333',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  applyButton: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 8,
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SortModal;
