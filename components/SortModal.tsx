import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

export type SortField = 'published' | 'recorded';
export type SortOrder = 'desc' | 'asc';

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (field: SortField, order: SortOrder) => void;
  initialField: SortField;
  initialOrder: SortOrder;
}

export function SortModal({
  visible,
  onClose,
  onApply,
  initialField,
  initialOrder
}: SortModalProps) {
  const [field, setField] = useState<SortField>(initialField);
  const [order, setOrder] = useState<SortOrder>(initialOrder);

  useEffect(() => {
    if (visible) {
      setField(initialField);
      setOrder(initialOrder);
    }
  }, [visible, initialField, initialOrder]);

  const handleApply = () => {
    onApply(field, order);
  };

  const OptionButton = ({ 
    label, 
    description,
    isSelected, 
    onPress 
  }: { 
    label: string;
    description: string;
    isSelected: boolean; 
    onPress: () => void 
  }) => (
    <TouchableOpacity 
      style={[styles.optionCard, isSelected && styles.optionCardSelected]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.optionTitle, isSelected && styles.optionTitleSelected]}>{label}</Text>
      <Text style={[styles.optionDesc, isSelected && styles.optionDescSelected]}>{description}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Sort Videos</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Sort By</Text>
          <OptionButton
            label="Publication Date"
            description="When the video was published on YouTube"
            isSelected={field === 'published'}
            onPress={() => setField('published')}
          />
          <OptionButton
            label="Recording Date"
            description="When the video was recorded (falls back to publication date)"
            isSelected={field === 'recorded'}
            onPress={() => setField('recorded')}
          />

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Order</Text>
          <View style={styles.orderContainer}>
            <TouchableOpacity 
              style={[styles.orderButton, order === 'desc' && styles.orderButtonSelected]}
              onPress={() => setOrder('desc')}
            >
              <Text style={[styles.orderText, order === 'desc' && styles.orderTextSelected]}>
                Newest First
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.orderButton, order === 'asc' && styles.orderButtonSelected]}
              onPress={() => setOrder('asc')}
            >
              <Text style={[styles.orderText, order === 'asc' && styles.orderTextSelected]}>
                Oldest First
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Current Selection:</Text>
            <Text style={styles.previewText}>
              {field === 'published' ? 'Publication Date' : 'Recording Date'} - {order === 'desc' ? 'Newest to Oldest' : 'Oldest to Newest'}
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
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
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  optionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  optionCardSelected: {
    borderColor: '#4285F4',
    backgroundColor: '#f0f4ff',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: '#4285F4',
  },
  optionDesc: {
    fontSize: 14,
    color: '#666',
  },
  optionDescSelected: {
    color: '#4285F4',
  },
  orderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  orderButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  orderButtonSelected: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  orderText: {
    fontSize: 16,
    color: '#333',
  },
  orderTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  previewContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#e8f0fe',
    borderRadius: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4285F4',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 16,
    color: '#333',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  applyButton: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#4285F4',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
