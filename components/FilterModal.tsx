import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  channels: string[];
  countries: string[];
  selectedChannel: string | null;
  selectedCountry: string | null;
  onApply: (channel: string | null, country: string | null) => void;
}

export default function FilterModal({ visible, onClose, channels, countries, selectedChannel, selectedCountry, onApply }: FilterModalProps) {
  const [tempChannel, setTempChannel] = useState(selectedChannel);
  const [tempCountry, setTempCountry] = useState(selectedCountry);

  const handleApply = () => {
    onApply(tempChannel, tempCountry);
    onClose();
  };

  const handleClear = () => {
    setTempChannel(null);
    setTempCountry(null);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Filters</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>Source Channel</Text>
          <View style={styles.chipContainer}>
            <TouchableOpacity
              style={[styles.chip, !tempChannel && styles.chipSelected]}
              onPress={() => setTempChannel(null)}
            >
              <Text style={[styles.chipText, !tempChannel && styles.chipTextSelected]}>All</Text>
            </TouchableOpacity>
            {channels.map(channel => (
              <TouchableOpacity
                key={channel}
                style={[styles.chip, tempChannel === channel && styles.chipSelected]}
                onPress={() => setTempChannel(channel)}
              >
                <Text style={[styles.chipText, tempChannel === channel && styles.chipTextSelected]}>{channel}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Country</Text>
          <View style={styles.chipContainer}>
            <TouchableOpacity
              style={[styles.chip, !tempCountry && styles.chipSelected]}
              onPress={() => setTempCountry(null)}
            >
              <Text style={[styles.chipText, !tempCountry && styles.chipTextSelected]}>All</Text>
            </TouchableOpacity>
            {countries.map(country => (
              <TouchableOpacity
                key={country}
                style={[styles.chip, tempCountry === country && styles.chipSelected]}
                onPress={() => setTempCountry(country)}
              >
                <Text style={[styles.chipText, tempCountry === country && styles.chipTextSelected]}>{country}</Text>
              </TouchableOpacity>
            ))}
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
    marginTop: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#4285F4',
  },
  chipText: {
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  clearBtnText: {
    color: '#333',
    fontWeight: 'bold',
  },
  applyBtn: {
    flex: 2,
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
