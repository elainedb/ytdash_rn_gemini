import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  availableChannels: string[];
  availableCountries: string[];
  currentChannel: string | null;
  currentCountry: string | null;
  onApplyFilters: (channel: string | null, country: string | null) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  availableChannels,
  availableCountries,
  currentChannel,
  currentCountry,
  onApplyFilters,
}) => {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(currentChannel);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(currentCountry);

  useEffect(() => {
    setSelectedChannel(currentChannel);
    setSelectedCountry(currentCountry);
  }, [visible, currentChannel, currentCountry]);

  const handleApply = () => {
    onApplyFilters(selectedChannel, selectedCountry);
    onClose();
  };

  const handleClear = () => {
    setSelectedChannel(null);
    setSelectedCountry(null);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Filter Videos</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Source Channel</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[styles.optionButton, selectedChannel === null && styles.optionButtonSelected]}
              onPress={() => setSelectedChannel(null)}
            >
              <Text style={[styles.optionText, selectedChannel === null && styles.optionTextSelected]}>All</Text>
            </TouchableOpacity>
            {availableChannels.map(channel => (
              <TouchableOpacity
                key={channel}
                style={[styles.optionButton, selectedChannel === channel && styles.optionButtonSelected]}
                onPress={() => setSelectedChannel(channel)}
              >
                <Text style={[styles.optionText, selectedChannel === channel && styles.optionTextSelected]}>{channel}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Country</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[styles.optionButton, selectedCountry === null && styles.optionButtonSelected]}
              onPress={() => setSelectedCountry(null)}
            >
              <Text style={[styles.optionText, selectedCountry === null && styles.optionTextSelected]}>All</Text>
            </TouchableOpacity>
            {availableCountries.map(country => (
              <TouchableOpacity
                key={country}
                style={[styles.optionButton, selectedCountry === country && styles.optionButtonSelected]}
                onPress={() => setSelectedCountry(country)}
              >
                <Text style={[styles.optionText, selectedCountry === country && styles.optionTextSelected]}>{country}</Text>
              </TouchableOpacity>
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
};

const styles = StyleSheet.create({
  safeArea: {
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
  closeButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionButtonSelected: {
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
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#4285F4',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});