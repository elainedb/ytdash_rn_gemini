import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

export type SortField = 'published' | 'recorded';
export type SortOrder = 'desc' | 'asc';

export interface SortState {
  field: SortField;
  order: SortOrder;
}

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  initialSort: SortState;
  onApply: (sort: SortState) => void;
}

export default function SortModal({ visible, onClose, initialSort, onApply }: SortModalProps) {
  const [field, setField] = useState<SortField>(initialSort.field);
  const [order, setOrder] = useState<SortOrder>(initialSort.order);

  React.useEffect(() => {
    if (visible) {
      setField(initialSort.field);
      setOrder(initialSort.order);
    }
  }, [visible, initialSort]);

  const handleApply = () => {
    onApply({ field, order });
    onClose();
  };

  const renderOption = (label: string, isSelected: boolean, onSelect: () => void) => (
    <TouchableOpacity 
      style={[styles.option, isSelected && styles.optionSelected]} 
      onPress={onSelect}
    >
      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Sort</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.closeBtn}>Close</Text></TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Sort By</Text>
          <View style={styles.optionsContainer}>
            {renderOption('Publication Date', field === 'published', () => setField('published'))}
            {renderOption('Recording Date', field === 'recorded', () => setField('recorded'))}
          </View>

          <Text style={styles.sectionTitle}>Order</Text>
          <View style={styles.optionsContainer}>
            {renderOption('Newest First', order === 'desc', () => setOrder('desc'))}
            {renderOption('Oldest First', order === 'asc', () => setOrder('asc'))}
          </View>

          <View style={styles.preview}>
            <Text style={styles.previewTitle}>Current Selection:</Text>
            <Text style={styles.previewText}>
              {field === 'published' ? 'Publication Date' : 'Recording Date'} - {order === 'desc' ? 'Newest First' : 'Oldest First'}
            </Text>
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 18, fontWeight: 'bold' },
  closeBtn: { fontSize: 16, color: '#4285F4' },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8, color: '#333' },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  option: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#e0e0e0', margin: 4, width: '45%', alignItems: 'center' },
  optionSelected: { backgroundColor: '#4285F4' },
  optionText: { color: '#333' },
  optionTextSelected: { color: '#fff', fontWeight: 'bold' },
  preview: { marginTop: 32, padding: 16, backgroundColor: '#fff', borderRadius: 8 },
  previewTitle: { fontSize: 14, color: '#666', marginBottom: 4 },
  previewText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
  applyBtn: { padding: 14, alignItems: 'center', borderRadius: 8, backgroundColor: '#4285F4' },
  applyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
