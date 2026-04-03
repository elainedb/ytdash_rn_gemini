import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (channel: string | null, country: string | null) => void;
  channels: string[];
  countries: string[];
  initialChannel: string | null;
  initialCountry: string | null;
}

export function FilterModal({
  visible,
  onClose,
  onApply,
  channels,
  countries,
  initialChannel,
  initialCountry
}: FilterModalProps) {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(initialChannel);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(initialCountry);

  useEffect(() => {
    if (visible) {
      setSelectedChannel(initialChannel);
      setSelectedCountry(initialCountry);
    }
  }, [visible, initialChannel, initialCountry]);

  const handleApply = () => {
    onApply(selectedChannel, selectedCountry);
  };

  const handleClear = () => {
    setSelectedChannel(null);
    setSelectedCountry(null);
  };

  const OptionButton = ({ 
    label, 
    isSelected, 
    onPress 
  }: { 
    label: string; 
    isSelected: boolean; 
    onPress: () => void 
  }) => (
    <TouchableOpacity 
      style={[styles.optionButton, isSelected && styles.optionButtonSelected]} 
      onPress={onPress}
    >
      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Source Channel</Text>
          <View style={styles.optionsContainer}>
            <OptionButton 
              label="All" 
              isSelected={selectedChannel === null} 
              onPress={() => setSelectedChannel(null)} 
            />
            {channels.map(c => (
              <OptionButton 
                key={c} 
                label={c} 
                isSelected={selectedChannel === c} 
                onPress={() => setSelectedChannel(c)} 
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Country</Text>
          <View style={styles.optionsContainer}>
            <OptionButton 
              label="All" 
              isSelected={selectedCountry === null} 
              onPress={() => setSelectedCountry(null)} 
            />
            {countries.map(c => (
              <OptionButton 
                key={c} 
                label={c} 
                isSelected={selectedCountry === c} 
                onPress={() => setSelectedCountry(c)} 
              />
            ))}
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
    marginTop: 8,
    color: '#333',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#4285F4',
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
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  clearButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  clearButtonText: {
    color: '#4285F4',
    fontWeight: 'bold',
    fontSize: 16,
  },
  applyButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#4285F4',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
