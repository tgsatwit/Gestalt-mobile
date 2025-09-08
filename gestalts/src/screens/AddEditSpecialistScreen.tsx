import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable
} from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useSpecialistStore } from '../state/useSpecialistStore';
import { useMemoriesStore } from '../state/useStore';
import { DatePickerField } from '../components/DatePickerField';
import specialistService from '../services/specialistService';
import { CreateSpecialistData, UpdateSpecialistData } from '../types/specialist';

interface RouteParams {
  specialistId?: string;
}

export default function AddEditSpecialistScreen() {
  const { tokens } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { specialistId } = (route.params as RouteParams) || {};
  const { getCurrentUserId } = useAuth();
  const { addSpecialist, updateSpecialist, specialists } = useSpecialistStore();
  
  const isEditing = !!specialistId;
  const existingSpecialist = isEditing ? specialists.find(s => s.id === specialistId) : null;
  
  const [formData, setFormData] = useState<CreateSpecialistData>({
    name: existingSpecialist?.name || '',
    title: existingSpecialist?.title || '',
    organization: existingSpecialist?.organization || '',
    email: existingSpecialist?.email || '',
    phone: existingSpecialist?.phone || '',
    notes: existingSpecialist?.notes || '',
  });
  
  // New state for form fields
  const [selectedProfession, setSelectedProfession] = useState(existingSpecialist?.title || '');
  const [showProfessionDropdown, setShowProfessionDropdown] = useState(false);
  const [customProfession, setCustomProfession] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [showChildrenDropdown, setShowChildrenDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Get available children from profiles
  const { profiles } = useMemoriesStore((s) => ({ profiles: s.profiles }));
  const availableChildren = profiles.map(profile => ({
    id: profile.id,
    name: profile.childName
  }));

  // Profession options
  const professionOptions = [
    'Speech-Language Pathologist',
    'Occupational Therapist', 
    'Behavioural Therapist',
    'Psychologist',
    'Paediatrician',
    'Developmental Paediatrician',
    'Psychiatrist',
    'Social Worker',
    'Special Education Teacher',
    'Music Therapist',
    'Art Therapist',
    'Physiotherapist',
    'Other'
  ];

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    const finalProfession = selectedProfession === 'Other' ? customProfession : selectedProfession;
    if (!finalProfession.trim()) {
      newErrors.profession = 'Profession is required';
    }
    
    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getSelectedChildrenText = () => {
    if (selectedChildren.length === 0) {
      return 'Select Children (Optional)';
    }
    if (selectedChildren.length === 1) {
      return selectedChildren[0];
    }
    return `${selectedChildren.length} Children Selected`;
  };

  const toggleChildSelection = (childName: string, childId: string) => {
    if (selectedChildren.includes(childName)) {
      setSelectedChildren(prev => prev.filter(name => name !== childName));
      setSelectedChildIds(prev => prev.filter(id => id !== childId));
    } else {
      setSelectedChildren(prev => [...prev, childName]);
      setSelectedChildIds(prev => [...prev, childId]);
    }
  };
  
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Initialize form when editing
  useEffect(() => {
    if (existingSpecialist) {
      // Set profession dropdown
      if (professionOptions.includes(existingSpecialist.title)) {
        setSelectedProfession(existingSpecialist.title);
      } else {
        setSelectedProfession('Other');
        setCustomProfession(existingSpecialist.title);
      }
    }
  }, [existingSpecialist]);
  
  
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    const userId = getCurrentUserId();
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to save specialists');
      return;
    }
    
    setLoading(true);
    
    try {
      const finalProfession = selectedProfession === 'Other' ? customProfession : selectedProfession;
      const specialistData = {
        ...formData,
        title: finalProfession,
      };

      if (isEditing && specialistId) {
        // Update existing specialist
        const updates: UpdateSpecialistData = { ...specialistData };
        await specialistService.updateSpecialist(specialistId, userId, updates);
        updateSpecialist(specialistId, updates);
        
        Alert.alert('Success', 'Specialist updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        // Create new specialist
        const newSpecialistId = await specialistService.createSpecialist(userId, specialistData);
        
        // Add to store
        const newSpecialist = {
          id: newSpecialistId,
          ...specialistData,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        addSpecialist(newSpecialist);
        
        Alert.alert('Success', 'Specialist created successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Failed to save specialist:', error);
      Alert.alert('Error', 'Failed to save specialist. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder?: string,
    keyboardType?: any,
    multiline?: boolean,
    error?: string
  ) => (
    <View style={{ marginBottom: tokens.spacing.gap.md }}>
      <Text weight="medium" style={{
        fontSize: tokens.font.size.sm,
        color: tokens.color.text.primary,
        marginBottom: tokens.spacing.gap.xs
      }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        style={{
          borderWidth: 1,
          borderColor: error ? '#EF4444' : tokens.color.border.default,
          borderRadius: tokens.radius.lg,
          paddingHorizontal: tokens.spacing.gap.md,
          paddingVertical: tokens.spacing.gap.sm,
          fontSize: tokens.font.size.body,
          color: tokens.color.text.primary,
          backgroundColor: 'white',
          minHeight: multiline ? 80 : 44,
          textAlignVertical: multiline ? 'top' : 'center'
        }}
        placeholderTextColor={tokens.color.text.secondary}
      />
      {error && (
        <Text style={{
          fontSize: tokens.font.size.xs,
          color: '#EF4444',
          marginTop: tokens.spacing.gap.xs
        }}>
          {error}
        </Text>
      )}
    </View>
  );
  
  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#7C3AED', '#EC4899', '#FB923C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={{
          paddingTop: 60,
          paddingHorizontal: tokens.spacing.containerX,
          paddingBottom: tokens.spacing.gap.lg
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.gap.md, flex: 1 }}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <Text style={{ color: 'white', fontSize: tokens.font.size.h3, fontWeight: '600' }}>
                {isEditing ? 'Edit Specialist' : 'Add Specialist'}
              </Text>
            </View>
          </View>
        </View>

        {/* Content Container */}
        <View style={{ 
          flex: 1, 
          backgroundColor: 'white', 
          borderTopLeftRadius: 24, 
          borderTopRightRadius: 24
        }}>
          <ScrollView 
            contentContainerStyle={{ padding: tokens.spacing.containerX, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Basic Information Section */}
            <Text weight="medium" style={{
              fontSize: tokens.font.size.lg,
              color: tokens.color.text.primary,
              marginBottom: tokens.spacing.gap.md,
              marginTop: tokens.spacing.gap.sm
            }}>
              Basic Information
            </Text>
            
            {renderInput(
              'Full Name *',
              formData.name,
              (text) => setFormData(prev => ({ ...prev, name: text })),
              'Enter specialist\'s full name',
              'default',
              false,
              errors.name
            )}
            
            {/* Profession Dropdown */}
            <View style={{ marginBottom: tokens.spacing.gap.md }}>
              <Text weight="medium" style={{
                fontSize: tokens.font.size.sm,
                color: tokens.color.text.primary,
                marginBottom: tokens.spacing.gap.xs
              }}>
                Profession *
              </Text>
              <TouchableOpacity
                onPress={() => setShowProfessionDropdown(!showProfessionDropdown)}
                style={{
                  borderWidth: 1,
                  borderColor: errors.profession ? '#EF4444' : tokens.color.border.default,
                  borderRadius: tokens.radius.lg,
                  paddingHorizontal: tokens.spacing.gap.md,
                  paddingVertical: tokens.spacing.gap.sm,
                  backgroundColor: 'white',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Text style={{
                  fontSize: tokens.font.size.body,
                  color: selectedProfession ? tokens.color.text.primary : tokens.color.text.secondary
                }}>
                  {selectedProfession || 'Select profession'}
                </Text>
                <Ionicons 
                  name={showProfessionDropdown ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color={tokens.color.text.secondary} 
                />
              </TouchableOpacity>
              {errors.profession && (
                <Text style={{
                  fontSize: tokens.font.size.xs,
                  color: '#EF4444',
                  marginTop: tokens.spacing.gap.xs
                }}>
                  {errors.profession}
                </Text>
              )}
            </View>

            {/* Custom Profession Input (when Other is selected) */}
            {selectedProfession === 'Other' && (
              <View style={{ marginBottom: tokens.spacing.gap.md }}>
                <Text weight="medium" style={{
                  fontSize: tokens.font.size.sm,
                  color: tokens.color.text.primary,
                  marginBottom: tokens.spacing.gap.xs
                }}>
                  Specify Profession *
                </Text>
                <TextInput
                  value={customProfession}
                  onChangeText={setCustomProfession}
                  placeholder="Enter profession"
                  style={{
                    borderWidth: 1,
                    borderColor: tokens.color.border.default,
                    borderRadius: tokens.radius.lg,
                    paddingHorizontal: tokens.spacing.gap.md,
                    paddingVertical: tokens.spacing.gap.sm,
                    fontSize: tokens.font.size.body,
                    color: tokens.color.text.primary,
                    backgroundColor: 'white',
                    minHeight: 44
                  }}
                  placeholderTextColor={tokens.color.text.secondary}
                />
              </View>
            )}
            
            {renderInput(
              'Organization',
              formData.organization || '',
              (text) => setFormData(prev => ({ ...prev, organization: text })),
              'Hospital, clinic, or practice name'
            )}

            {/* Date Field */}
            <View style={{ marginBottom: tokens.spacing.gap.md }}>
              <DatePickerField
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                label="First Appointment Date (Optional)"
              />
            </View>

            {/* Contact Information Section */}
            <Text weight="medium" style={{
              fontSize: tokens.font.size.lg,
              color: tokens.color.text.primary,
              marginBottom: tokens.spacing.gap.md,
              marginTop: tokens.spacing.gap.lg
            }}>
              Contact Information
            </Text>
            
            {renderInput(
              'Email',
              formData.email || '',
              (text) => setFormData(prev => ({ ...prev, email: text })),
              'specialist@email.com',
              'email-address',
              false,
              errors.email
            )}
            
            {renderInput(
              'Phone',
              formData.phone || '',
              (text) => setFormData(prev => ({ ...prev, phone: text })),
              '0412 345 678',
              'phone-pad'
            )}

            {/* Children Selection */}
            <View style={{ marginBottom: tokens.spacing.gap.md, position: 'relative' }}>
              <Text weight="medium" style={{
                fontSize: tokens.font.size.sm,
                color: tokens.color.text.primary,
                marginBottom: tokens.spacing.gap.xs
              }}>
                Children
              </Text>
              <TouchableOpacity
                onPress={() => setShowChildrenDropdown(!showChildrenDropdown)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'white',
                  paddingHorizontal: tokens.spacing.gap.md,
                  paddingVertical: tokens.spacing.gap.sm,
                  borderRadius: tokens.radius.lg,
                  borderWidth: 1,
                  borderColor: tokens.color.border.default
                }}
              >
                <Text style={{
                  fontSize: tokens.font.size.body,
                  color: selectedChildren.length > 0 ? tokens.color.text.primary : tokens.color.text.secondary,
                  flex: 1
                }}>
                  {getSelectedChildrenText()}
                </Text>
                <Ionicons 
                  name={showChildrenDropdown ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color={tokens.color.text.secondary} 
                />
              </TouchableOpacity>
              {/* Children Dropdown */}
              {showChildrenDropdown && (
                <View style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 4,
                  backgroundColor: 'white',
                  borderRadius: tokens.radius.lg,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  elevation: 6,
                  zIndex: 9999,
                  maxHeight: 150
                }}>
                  <ScrollView style={{ maxHeight: 150 }}>
                    {availableChildren.map((child, index) => (
                      <TouchableOpacity
                        key={child.id}
                        onPress={() => toggleChildSelection(child.name, child.id)}
                        activeOpacity={0.7}
                        style={{
                          paddingVertical: tokens.spacing.gap.xs,
                          paddingHorizontal: tokens.spacing.gap.sm,
                          borderBottomWidth: index !== availableChildren.length - 1 ? 0.5 : 0,
                          borderBottomColor: 'rgba(0,0,0,0.08)',
                          backgroundColor: selectedChildren.includes(child.name) ? tokens.color.bg.muted : 'transparent',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Text style={{
                          fontSize: tokens.font.size.sm,
                          color: selectedChildren.includes(child.name) ? tokens.color.brand.gradient.start : tokens.color.text.secondary,
                          fontWeight: '400'
                        }}>
                          {child.name}
                        </Text>
                        {selectedChildren.includes(child.name) && (
                          <Ionicons name="checkmark" size={12} color={tokens.color.brand.gradient.start} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>


            {/* Notes Section */}
            <Text weight="medium" style={{
              fontSize: tokens.font.size.lg,
              color: tokens.color.text.primary,
              marginBottom: tokens.spacing.gap.md,
              marginTop: tokens.spacing.gap.sm
            }}>
              Additional Notes
            </Text>
            
            {renderInput(
              'Notes',
              formData.notes || '',
              (text) => setFormData(prev => ({ ...prev, notes: text })),
              'Any additional information about this specialist...',
              'default',
              true
            )}
          </ScrollView>

          {/* Save Button */}
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            paddingHorizontal: tokens.spacing.containerX,
            paddingVertical: tokens.spacing.gap.lg,
            borderTopWidth: 1,
            borderTopColor: tokens.color.border.default
          }}>
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              style={{
                backgroundColor: loading ? tokens.color.bg.muted : tokens.color.brand.gradient.start,
                borderRadius: tokens.radius.lg,
                paddingVertical: tokens.spacing.gap.md,
                alignItems: 'center'
              }}
            >
              <Text style={{
                color: loading ? tokens.color.text.secondary : 'white',
                fontSize: tokens.font.size.body,
                fontWeight: '600'
              }}>
                {loading ? 'Saving...' : (isEditing ? 'Update Specialist' : 'Add Specialist')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profession Dropdown Modal */}
        <Modal
          transparent
          visible={showProfessionDropdown}
          animationType="fade"
          onRequestClose={() => setShowProfessionDropdown(false)}
        >
          <Pressable 
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} 
            onPress={() => setShowProfessionDropdown(false)}
          >
            <View style={{
              position: 'absolute',
              top: '30%',
              left: 20,
              right: 20,
              backgroundColor: 'white',
              borderRadius: tokens.radius.lg,
              maxHeight: 300,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 5,
            }}>
              <ScrollView style={{ maxHeight: 300 }}>
                {professionOptions.map((profession, index) => (
                  <TouchableOpacity
                    key={profession}
                    onPress={() => {
                      setSelectedProfession(profession);
                      setShowProfessionDropdown(false);
                      if (profession !== 'Other') {
                        setCustomProfession('');
                      }
                    }}
                    style={{
                      paddingVertical: tokens.spacing.gap.md,
                      paddingHorizontal: tokens.spacing.gap.lg,
                      borderBottomWidth: index !== professionOptions.length - 1 ? 0.5 : 0,
                      borderBottomColor: 'rgba(0,0,0,0.08)',
                      backgroundColor: selectedProfession === profession ? tokens.color.bg.muted : 'transparent'
                    }}
                  >
                    <Text style={{
                      fontSize: tokens.font.size.body,
                      color: selectedProfession === profession ? tokens.color.brand.gradient.start : tokens.color.text.primary,
                      fontWeight: selectedProfession === profession ? '500' : '400'
                    }}>
                      {profession}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}