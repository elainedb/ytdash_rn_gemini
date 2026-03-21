import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  channels: string[];
  countries: string[];
  selectedChannel: string | null;
  selectedCountry: string | null;
  onApply: (channel: string | null, country: string | null) => void;
}

export default function FilterModal({
  visible,
  onClose,
  channels,
  countries,
  selectedChannel,
  selectedCountry,
  onApply,
}: FilterModalProps) {
  const [localChannel, setLocalChannel] = useState<string | null>(null);
  const [localCountry, setLocalCountry] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setLocalChannel(selectedChannel);
      setLocalCountry(selectedCountry);
    }
  }, [visible, selectedChannel, selectedCountry]);

  const handleApply = () => {
    onApply(localChannel, localCountry);
  };

  const handleClear = () => {
    setLocalChannel(null);
    setLocalCountry(null);
  };

  const renderOption = (
    label: string,
    value: string | null,
    currentValue: string | null,
    onSelect: (val: string | null) => void
  ) => {
    const isSelected = value === currentValue;
    return (
      <TouchableOpacity
        key={label}
        style={[styles.option, isSelected && styles.optionSelected]}
        onPress={() => onSelect(value)}
      >
        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Source Channel</Text>
          <View style={styles.optionsContainer}>
            {renderOption('All', null, localChannel, setLocalChannel)}
            {channels.map((ch) => renderOption(ch, ch, localChannel, setLocalChannel))}
          </View>

          <Text style={styles.sectionTitle}>Country</Text>
          <View style={styles.optionsContainer}>
            {renderOption('All', null, localCountry, setLocalCountry)}
            {countries.map((co) => renderOption(co, co, localCountry, setLocalCountry))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
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
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  option: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
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
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  clearButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  applyButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
