import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type CategoryType = 'SME' | 'CG' | 'DIRECT';

interface CategorySelectorProps {
  selectedCategory: CategoryType;
  onSelectCategory: (category: CategoryType) => void;
}

const CATEGORIES: Array<{ id: CategoryType; label: string; desc: string }> = [
  { id: 'SME', label: 'SME Data', desc: 'Cheapest rate' },
  { id: 'CG', label: 'Corporate Gifting', desc: 'Fast delivery' },
  { id: 'DIRECT', label: 'Direct Gifting', desc: 'Official bundle' },
];

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Plan Category</Text>
      <View style={styles.row}>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.pill, isSelected && styles.pillActive]}
              onPress={() => onSelectCategory(cat.id)}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: '#10B981',
  },
  pillText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
