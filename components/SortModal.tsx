import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView } from 'react-native';

export type SortField = 'Published' | 'Recorded';
export type SortOrder = 'Newest' | 'Oldest';

export interface SortOptions {
  field: SortField;
  order: SortOrder;
}

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  sortOptions: SortOptions;
  onApply: (options: SortOptions) => void;
}

export default function SortModal({ visible, onClose, sortOptions, onApply }: SortModalProps) {
  const [localSort, setLocalSort] = useState<SortOptions>(sortOptions);

  const handleApply = () => {
    onApply(localSort);
    onClose();
  };

  return (
    <Modal visible={visible} presentationStyle="pageSheet" animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Sort Options</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Sort By</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.option, localSort.field === 'Published' && styles.optionSelected]}
              onPress={() => setLocalSort(prev => ({ ...prev, field: 'Published' }))}
            >
              <Text style={[styles.optionText, localSort.field === 'Published' && styles.optionTextSelected]}>Publication Date</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.option, localSort.field === 'Recorded' && styles.optionSelected]}
              onPress={() => setLocalSort(prev => ({ ...prev, field: 'Recorded' }))}
            >
              <Text style={[styles.optionText, localSort.field === 'Recorded' && styles.optionTextSelected]}>Recording Date</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.desc}>
            {localSort.field === 'Recorded' ? '* Videos without a recording date fall back to their publication date' : ''}
          </Text>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Order</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.option, localSort.order === 'Newest' && styles.optionSelected]}
              onPress={() => setLocalSort(prev => ({ ...prev, order: 'Newest' }))}
            >
              <Text style={[styles.optionText, localSort.order === 'Newest' && styles.optionTextSelected]}>Newest First</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.option, localSort.order === 'Oldest' && styles.optionSelected]}
              onPress={() => setLocalSort(prev => ({ ...prev, order: 'Oldest' }))}
            >
              <Text style={[styles.optionText, localSort.order === 'Oldest' && styles.optionTextSelected]}>Oldest First</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.preview}>
            <Text style={styles.previewTitle}>Current Selection</Text>
            <Text style={styles.previewText}>{localSort.field} Date ({localSort.order})</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyBtnText}>Apply Sort</Text>
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
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    fontSize: 16,
    color: '#4285F4',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  optionText: {
    color: '#333',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#fff',
  },
  desc: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  preview: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#e8f0fe',
    borderRadius: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a73e8',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    color: '#333',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  applyBtn: {
    backgroundColor: '#4285F4',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
