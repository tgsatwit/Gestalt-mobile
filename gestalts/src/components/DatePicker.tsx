import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface DatePickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  isVisible: boolean;
  onClose: () => void;
  initialMonth?: Date;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onDateSelect,
  isVisible,
  onClose,
  initialMonth = new Date()
}) => {
  const { tokens } = useTheme();
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(initialMonth);
  const [showYearSelector, setShowYearSelector] = useState(false);
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Update calendar month when initialMonth changes
  useEffect(() => {
    setCurrentCalendarMonth(initialMonth);
  }, [initialMonth]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentCalendarMonth);
    const firstDay = getFirstDayOfMonth(currentCalendarMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), day));
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentCalendarMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentCalendarMonth(newMonth);
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentCalendarMonth);
    if (direction === 'prev') {
      newMonth.setFullYear(newMonth.getFullYear() - 1);
    } else {
      newMonth.setFullYear(newMonth.getFullYear() + 1);
    }
    setCurrentCalendarMonth(newMonth);
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 50;
    const endYear = currentYear + 10;
    const years = [];
    
    for (let year = endYear; year >= startYear; year--) {
      years.push(year);
    }
    
    return years;
  };

  const selectYear = (year: number) => {
    const newMonth = new Date(currentCalendarMonth);
    newMonth.setFullYear(year);
    setCurrentCalendarMonth(newMonth);
    setShowYearSelector(false);
  };

  const handleDateSelect = (date: Date) => {
    onDateSelect(date);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <View style={{
      backgroundColor: tokens.color.surface,
      borderRadius: tokens.radius.lg,
      padding: tokens.spacing.gap.md,
      borderWidth: 1,
      borderColor: tokens.color.border.default,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      marginTop: tokens.spacing.gap.xs
    }}>
      {!showYearSelector ? (
        <>
          {/* Calendar Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: tokens.spacing.gap.md
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => navigateYear('prev')}
                style={{
                  padding: tokens.spacing.gap.xs,
                  borderRadius: tokens.radius.lg / 2,
                  marginRight: tokens.spacing.gap.xs
                }}
              >
                <Ionicons name="chevron-back-outline" size={18} color={tokens.color.text.secondary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => navigateMonth('prev')}
                style={{
                  padding: tokens.spacing.gap.xs,
                  borderRadius: tokens.radius.lg / 2
                }}
              >
                <Ionicons name="chevron-back" size={20} color={tokens.color.text.primary} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              onPress={() => setShowYearSelector(true)}
              style={{
                paddingHorizontal: tokens.spacing.gap.sm,
                paddingVertical: tokens.spacing.gap.xs,
                borderRadius: tokens.radius.md
              }}
            >
              <Text style={{
                fontSize: tokens.font.size.body,
                fontWeight: '600',
                color: tokens.color.text.primary,
                textAlign: 'center'
              }}>
                {currentCalendarMonth.toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Text>
            </TouchableOpacity>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => navigateMonth('next')}
                style={{
                  padding: tokens.spacing.gap.xs,
                  borderRadius: tokens.radius.lg / 2
                }}
              >
                <Ionicons name="chevron-forward" size={20} color={tokens.color.text.primary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => navigateYear('next')}
                style={{
                  padding: tokens.spacing.gap.xs,
                  borderRadius: tokens.radius.lg / 2,
                  marginLeft: tokens.spacing.gap.xs
                }}
              >
                <Ionicons name="chevron-forward-outline" size={18} color={tokens.color.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Day Names Header */}
          <View style={{
            flexDirection: 'row',
            marginBottom: tokens.spacing.gap.xs
          }}>
            {dayNames.map((dayName) => (
              <View key={dayName} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{
                  fontSize: tokens.font.size.xs,
                  fontWeight: '600',
                  color: tokens.color.text.secondary
                }}>
                  {dayName}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap'
          }}>
            {generateCalendarDays().map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={{ width: '14.28%', height: 40 }} />;
              }

              const isSelected = date.toDateString() === selectedDate.toDateString();
              const isToday = date.toDateString() === new Date().toDateString();
              const isPastMonth = date.getMonth() !== currentCalendarMonth.getMonth();

              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  onPress={() => handleDateSelect(date)}
                  style={{
                    width: '14.28%',
                    height: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: tokens.radius.md,
                    backgroundColor: isSelected 
                      ? tokens.color.brand.gradient.start 
                      : isToday 
                        ? tokens.color.brand.gradient.start + '20'
                        : 'transparent'
                  }}
                >
                  <Text style={{
                    fontSize: tokens.font.size.sm,
                    color: isSelected
                      ? '#FFFFFF'
                      : isPastMonth
                        ? tokens.color.text.secondary + '50'
                        : isToday
                          ? tokens.color.brand.gradient.start
                          : tokens.color.text.primary,
                    fontWeight: isSelected || isToday ? '600' : '400'
                  }}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : (
        <>
          {/* Year Selector Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: tokens.spacing.gap.md
          }}>
            <TouchableOpacity
              onPress={() => setShowYearSelector(false)}
              style={{
                padding: tokens.spacing.gap.xs,
                borderRadius: tokens.radius.lg / 2
              }}
            >
              <Ionicons name="chevron-back" size={20} color={tokens.color.text.primary} />
            </TouchableOpacity>
            
            <Text style={{
              fontSize: tokens.font.size.body,
              fontWeight: '600',
              color: tokens.color.text.primary
            }}>
              Select Year
            </Text>
            
            <View style={{ width: 32 }} />
          </View>

          {/* Year Grid */}
          <ScrollView
            style={{ maxHeight: 300 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              paddingBottom: tokens.spacing.gap.md
            }}
          >
            {generateYearOptions().map((year) => {
              const isCurrentYear = year === new Date().getFullYear();
              const isSelectedYear = year === currentCalendarMonth.getFullYear();

              return (
                <TouchableOpacity
                  key={year}
                  onPress={() => selectYear(year)}
                  style={{
                    width: '33.33%',
                    height: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: tokens.radius.md,
                    marginBottom: tokens.spacing.gap.xs,
                    backgroundColor: isSelectedYear 
                      ? tokens.color.brand.gradient.start 
                      : isCurrentYear 
                        ? tokens.color.brand.gradient.start + '20'
                        : 'transparent'
                  }}
                >
                  <Text style={{
                    fontSize: tokens.font.size.body,
                    color: isSelectedYear
                      ? '#FFFFFF'
                      : isCurrentYear
                        ? tokens.color.brand.gradient.start
                        : tokens.color.text.primary,
                    fontWeight: isSelectedYear || isCurrentYear ? '600' : '400'
                  }}>
                    {year}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}
    </View>
  );
};