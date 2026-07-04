import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useVideoState } from '../hooks/useVideoState';
import channelsConfig from '../../config/channels.json';

export const FilterPanel: React.FC = () => {
  const { 
    filterCategory, 
    setFilterCategory, 
    setIsFilterPanelOpen 
  } = useVideoState();

  // Keep a local state for selection until apply is pressed
  const [selectedCategory, setSelectedCategory] = useState<string | null>(filterCategory);

  const handleApply = () => {
    setFilterCategory(selectedCategory);
    setIsFilterPanelOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Filter by Category</Text>
      
      <ScrollView contentContainerStyle={styles.optionsList}>
        {/* All/Reset Option */}
        <Pressable
          style={[
            styles.optionRow,
            selectedCategory === null && styles.optionRowSelected
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[
            styles.optionText,
            selectedCategory === null && styles.optionTextSelected
          ]}>
            All Categories
          </Text>
          <View style={[
            styles.radio,
            selectedCategory === null && styles.radioSelected
          ]} />
        </Pressable>

        {/* Dynamic Channel Label Options */}
        {channelsConfig.map((channel) => {
          const isSelected = selectedCategory === channel.label;
          return (
            <Pressable
              key={channel.id}
              style={[
                styles.optionRow,
                isSelected && styles.optionRowSelected
              ]}
              onPress={() => setSelectedCategory(channel.label)}
            >
              <Text style={[
                styles.optionText,
                isSelected && styles.optionTextSelected
              ]}>
                {channel.label}
              </Text>
              <View style={[
                styles.radio,
                isSelected && styles.radioSelected
              ]} />
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Pressable 
          style={styles.cancelButton} 
          onPress={() => setIsFilterPanelOpen(false)}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>

        <Pressable 
          testID="filter_apply_button" 
          style={styles.applyButton} 
          onPress={handleApply}
        >
          <Text style={styles.applyButtonText}>Apply Filter</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Slate 900
    padding: 24,
    justifyContent: 'space-between',
  },
  heading: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 20,
  },
  optionsList: {
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B', // Slate 800
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  optionRowSelected: {
    backgroundColor: '#1E1B4B', // Indigo 950
    borderColor: '#6366F1', // Indigo 500
  },
  optionText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  optionTextSelected: {
    color: '#F8FAFC',
    fontWeight: 'bold',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#475569',
  },
  radioSelected: {
    borderColor: '#6366F1',
    backgroundColor: '#6366F1',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#334155',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#6366F1', // Indigo 500
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
