import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useVideoState, SortOptionType } from '../hooks/useVideoState';

export const SortPanel: React.FC = () => {
  const { 
    sortOption, 
    setSortOption, 
    setIsSortPanelOpen 
  } = useVideoState();

  const [selectedOption, setSelectedOption] = useState<SortOptionType>(
    sortOption === 'default' ? 'date_desc' : sortOption
  );

  const handleApply = () => {
    setSortOption(selectedOption);
    setIsSortPanelOpen(false);
  };

  const options: { key: SortOptionType; label: string }[] = [
    { key: 'date_desc', label: 'Date — newest' },
    { key: 'date_asc', label: 'Date — oldest' },
    { key: 'title_asc', label: 'Title — A-Z' },
    { key: 'title_desc', label: 'Title — Z-A' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Sort Videos</Text>
      
      <ScrollView contentContainerStyle={styles.optionsList}>
        {options.map((opt) => {
          const isSelected = selectedOption === opt.key;
          return (
            <Pressable
              key={opt.key}
              style={[
                styles.optionRow,
                isSelected && styles.optionRowSelected
              ]}
              onPress={() => setSelectedOption(opt.key)}
            >
              <Text style={[
                styles.optionText,
                isSelected && styles.optionTextSelected
              ]}>
                {opt.label}
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
          onPress={() => setIsSortPanelOpen(false)}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>

        <Pressable 
          testID="sort_apply_button" 
          style={styles.applyButton} 
          onPress={handleApply}
        >
          <Text style={styles.applyButtonText}>Apply Sort</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
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
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  optionRowSelected: {
    backgroundColor: '#1E1B4B',
    borderColor: '#6366F1',
  },
  optionText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '500',
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
    backgroundColor: '#6366F1',
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
