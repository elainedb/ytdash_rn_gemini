import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';

export interface FilterState {
  channel: string | null;
  country: string | null;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  channels: string[];
  countries: string[];
  initialFilters: FilterState;
  onApply: (filters: FilterState) => void;
}

export default function FilterModal({ visible, onClose, channels, countries, initialFilters, onApply }: FilterModalProps) {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(initialFilters.channel);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(initialFilters.country);

  // Sync state when opened
  React.useEffect(() => {
    if (visible) {
      setSelectedChannel(initialFilters.channel);
      setSelectedCountry(initialFilters.country);
    }
  }, [visible, initialFilters]);

  const handleApply = () => {
    onApply({ channel: selectedChannel, country: selectedCountry });
    onClose();
  };

  const handleClear = () => {
    setSelectedChannel(null);
    setSelectedCountry(null);
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
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.closeBtn}>Close</Text></TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Source Channel</Text>
          <View style={styles.optionsContainer}>
            {renderOption('All', selectedChannel === null, () => setSelectedChannel(null))}
            {channels.map(c => renderOption(c, selectedChannel === c, () => setSelectedChannel(c)))}
          </View>

          <Text style={styles.sectionTitle}>Country</Text>
          <View style={styles.optionsContainer}>
            {renderOption('All', selectedCountry === null, () => setSelectedCountry(null))}
            {countries.map(c => renderOption(c, selectedCountry === c, () => setSelectedCountry(c)))}
          </View>
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 18, fontWeight: 'bold' },
  closeBtn: { fontSize: 16, color: '#4285F4' },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8, color: '#333' },
  optionsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  option: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#e0e0e0', margin: 4 },
  optionSelected: { backgroundColor: '#4285F4' },
  optionText: { color: '#333' },
  optionTextSelected: { color: '#fff', fontWeight: 'bold' },
  footer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
  clearBtn: { flex: 1, padding: 12, alignItems: 'center', marginRight: 8, borderRadius: 8, backgroundColor: '#eee' },
  clearBtnText: { color: '#333', fontWeight: 'bold' },
  applyBtn: { flex: 1, padding: 12, alignItems: 'center', marginLeft: 8, borderRadius: 8, backgroundColor: '#4285F4' },
  applyBtnText: { color: '#fff', fontWeight: 'bold' },
});
