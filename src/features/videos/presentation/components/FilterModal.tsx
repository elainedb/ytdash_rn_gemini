import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useVideosStore } from '../stores/videos-store';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose }) => {
  const { filters, availableChannels, availableCountries, filterByChannel, filterByCountry, clearFilters } = useVideosStore();

  const [localChannel, setLocalChannel] = useState<string | null>(null);
  const [localCountry, setLocalCountry] = useState<string | null>(null);

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

  const handleClearAll = () => {
    setLocalChannel(null);
    setLocalCountry(null);
    clearFilters();
    onClose();
  };

  const renderOption = (label: string, value: string | null, currentSelection: string | null, onSelect: (val: string | null) => void) => {
    const isSelected = currentSelection === value;
    return (
      <TouchableOpacity
        key={value ?? 'all'}
        style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
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
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.container}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>Filters</ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>Source Channel</Text>
            <View style={styles.optionsContainer}>
              {renderOption('All', null, localChannel, setLocalChannel)}
              {availableChannels.map(channel =>
                renderOption(channel, channel, localChannel, setLocalChannel)
              )}
            </View>

            <Text style={styles.sectionTitle}>Country</Text>
            <View style={styles.optionsContainer}>
              {renderOption('All', null, localCountry, setLocalCountry)}
              {availableCountries.map(country =>
                renderOption(country, country, localCountry, setLocalCountry)
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
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
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#4285F4',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  optionButtonSelected: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  optionText: {
    color: '#333',
    fontSize: 14,
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    justifyContent: 'space-between',
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#4285F4',
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
