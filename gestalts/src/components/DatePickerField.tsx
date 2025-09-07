import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { DatePicker } from './DatePicker';

interface DatePickerFieldProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  placeholder?: string;
  label?: string;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({
  selectedDate,
  onDateSelect,
  placeholder = "Select date",
  label
}) => {
  const { tokens } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <View>
      {label && (
        <Text style={{
          fontSize: tokens.font.size.sm,
          fontWeight: '600',
          color: tokens.color.text.primary,
          marginBottom: tokens.spacing.gap.xs
        }}>
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        onPress={() => setShowDatePicker(!showDatePicker)}
        style={{
          backgroundColor: tokens.color.surface,
          borderRadius: tokens.radius.lg,
          padding: tokens.spacing.gap.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: showDatePicker ? tokens.color.brand.gradient.start + '30' : tokens.color.border.default
        }}
      >
        <Text style={{
          fontSize: tokens.font.size.body,
          color: tokens.color.text.primary,
          fontWeight: '500'
        }}>
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </Text>
        
        <Ionicons 
          name={showDatePicker ? "chevron-up" : "chevron-down"} 
          size={16} 
          color={tokens.color.text.secondary} 
        />
      </TouchableOpacity>

      {showDatePicker && (
        <DatePicker
          selectedDate={selectedDate}
          onDateSelect={(date) => {
            onDateSelect(date);
            setShowDatePicker(false);
          }}
          isVisible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          initialMonth={selectedDate}
        />
      )}
    </View>
  );
};