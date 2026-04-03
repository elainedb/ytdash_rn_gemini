import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';

export interface Filters {
  channel: string | null;
  country: string | null;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: Filters;
  onApply: (filters: Filters) => void;
  channels: string[];
  countries: string[];
}

export default function FilterModal({ visible, onClose, filters, onApply, channels, countries }: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    const cleared = { channel: null, country: null };
    setLocalFilters(cleared);
    onApply(cleared);
    onClose();
  };

  const renderOptions = (title: string, options: string[], selected: string | null, onSelect: (val: string | null) => void) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[styles.option, selected === null && styles.optionSelected]}
          onPress={() => onSelect(null)}
        >
          <Text style={[styles.optionText, selected === null && styles.optionTextSelected]}>All</Text>
        </TouchableOpacity>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[styles.option, selected === opt && styles.optionSelected]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[styles.optionText, selected === opt && styles.optionTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} presentationStyle="pageSheet" animationType="slide">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {renderOptions('Source Channel', channels, localFilters.channel, val => setLocalFilters(prev => ({ ...prev, channel: val })))}
          {renderOptions('Country', countries, localFilters.country, val => setLocalFilters(prev => ({ ...prev, country: val })))}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearBtnText}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyBtnText}>Apply Filters</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
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
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  clearBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d32f2f',
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#d32f2f',
    fontWeight: '600',
  },
  applyBtn: {
    flex: 2,
    backgroundColor: '#4285F4',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
