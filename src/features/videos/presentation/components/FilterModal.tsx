import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useVideosStore } from '../stores/videos-store';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose }) => {
  const { filters, availableChannels, availableCountries, filterByChannel, filterByCountry, clearFilters } = useVideosStore();
  
  const [localChannel, setLocalChannel] = useState<string | null>(filters.channelName);
  const [localCountry, setLocalCountry] = useState<string | null>(filters.country);

  useEffect(() => {
    if (visible) {
      setLocalChannel(filters.channelName);
      setLocalCountry(filters.country);
    }
  }, [visible, filters]);

  const handleApply = () => {
    filterByChannel(localChannel);
    filterByCountry(localCountry);
    onClose();
  };

  const handleClear = () => {
    setLocalChannel(null);
    setLocalCountry(null);
    clearFilters();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Filters</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Source Channel</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={[styles.option, localChannel === null && styles.optionSelected]}
              onPress={() => setLocalChannel(null)}
            >
              <Text style={[styles.optionText, localChannel === null && styles.optionTextSelected]}>All</Text>
            </TouchableOpacity>
            {availableChannels.map(channel => (
              <TouchableOpacity 
                key={channel}
                style={[styles.option, localChannel === channel && styles.optionSelected]}
                onPress={() => setLocalChannel(channel)}
              >
                <Text style={[styles.optionText, localChannel === channel && styles.optionTextSelected]}>{channel}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Country</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={[styles.option, localCountry === null && styles.optionSelected]}
              onPress={() => setLocalCountry(null)}
            >
              <Text style={[styles.optionText, localCountry === null && styles.optionTextSelected]}>All</Text>
            </TouchableOpacity>
            {availableCountries.map(country => (
              <TouchableOpacity 
                key={country}
                style={[styles.option, localCountry === country && styles.optionSelected]}
                onPress={() => setLocalCountry(country)}
              >
                <Text style={[styles.optionText, localCountry === country && styles.optionTextSelected]}>{country}</Text>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeText: {
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
    marginTop: 16,
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
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
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  clearButton: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginRight: 8,
  },
  clearButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  applyButton: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 8,
    marginLeft: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
