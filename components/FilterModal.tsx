import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  channels: string[];
  countries: string[];
  selectedChannel: string;
  selectedCountry: string;
  onApply: (channel: string, country: string) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  channels,
  countries,
  selectedChannel,
  selectedCountry,
  onApply,
}) => {
  const [localChannel, setLocalChannel] = useState(selectedChannel);
  const [localCountry, setLocalCountry] = useState(selectedCountry);

  const handleApply = () => {
    onApply(localChannel, localCountry);
    onClose();
  };

  const handleClear = () => {
    setLocalChannel('All');
    setLocalCountry('All');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
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
              style={[styles.option, localChannel === 'All' && styles.selectedOption]}
              onPress={() => setLocalChannel('All')}
            >
              <Text style={[styles.optionText, localChannel === 'All' && styles.selectedOptionText]}>All</Text>
            </TouchableOpacity>
            {channels.map((channel) => (
              <TouchableOpacity
                key={channel}
                style={[styles.option, localChannel === channel && styles.selectedOption]}
                onPress={() => setLocalChannel(channel)}
              >
                <Text style={[styles.optionText, localChannel === channel && styles.selectedOptionText]}>{channel}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Country</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[styles.option, localCountry === 'All' && styles.selectedOption]}
              onPress={() => setLocalCountry('All')}
            >
              <Text style={[styles.optionText, localCountry === 'All' && styles.selectedOptionText]}>All</Text>
            </TouchableOpacity>
            {countries.map((country) => (
              <TouchableOpacity
                key={country}
                style={[styles.option, localCountry === country && styles.selectedOption]}
                onPress={() => setLocalCountry(country)}
              >
                <Text style={[styles.optionText, localCountry === country && styles.selectedOptionText]}>{country}</Text>
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
  headerTitle: {
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
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  selectedOption: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  optionText: {
    color: '#333',
  },
  selectedOptionText: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
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
    borderColor: '#ccc',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#333',
  },
  applyButton: {
    flex: 2,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 8,
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default FilterModal;
