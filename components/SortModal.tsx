import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

export type SortField = 'Published' | 'Recorded';
export type SortOrder = 'Newest' | 'Oldest';

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  field: SortField;
  order: SortOrder;
  onApply: (field: SortField, order: SortOrder) => void;
}

export default function SortModal({ visible, onClose, field, order, onApply }: SortModalProps) {
  const [tempField, setTempField] = useState<SortField>(field);
  const [tempOrder, setTempOrder] = useState<SortOrder>(order);

  const handleApply = () => {
    onApply(tempField, tempOrder);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sort</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Sort By</Text>
          <TouchableOpacity style={styles.row} onPress={() => setTempField('Published')}>
            <Text style={styles.rowText}>Publication Date (Default)</Text>
            {tempField === 'Published' && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => setTempField('Recorded')}>
            <Text style={styles.rowText}>Recording Date</Text>
            {tempField === 'Recorded' && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Order</Text>
          <TouchableOpacity style={styles.row} onPress={() => setTempOrder('Newest')}>
            <Text style={styles.rowText}>Newest First</Text>
            {tempOrder === 'Newest' && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => setTempOrder('Oldest')}>
            <Text style={styles.rowText}>Oldest First</Text>
            {tempOrder === 'Oldest' && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>
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
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    color: '#4285F4',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowText: {
    fontSize: 16,
  },
  check: {
    color: '#4285F4',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  applyBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 8,
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
