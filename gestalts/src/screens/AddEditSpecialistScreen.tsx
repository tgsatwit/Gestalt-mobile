import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useSpecialistStore } from '../state/useSpecialistStore';
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
    address: existingSpecialist?.address || '',
    specialties: existingSpecialist?.specialties || [],
    notes: existingSpecialist?.notes || '',
  });
  
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title/profession is required';
    }
    
    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const handleAddSpecialty = () => {
    const specialty = specialtyInput.trim();
    if (specialty && !formData.specialties?.includes(specialty)) {
      setFormData(prev => ({
        ...prev,
        specialties: [...(prev.specialties || []), specialty]
      }));
      setSpecialtyInput('');
    }
  };
  
  const handleRemoveSpecialty = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties?.filter((_, i) => i !== index) || []
    }));
  };
  
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
      if (isEditing && specialistId) {
        // Update existing specialist
        const updates: UpdateSpecialistData = { ...formData };
        await specialistService.updateSpecialist(specialistId, userId, updates);
        updateSpecialist(specialistId, updates);
        
        Alert.alert('Success', 'Specialist updated successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        // Create new specialist
        const newSpecialistId = await specialistService.createSpecialist(userId, formData);
        
        // Add to store
        const newSpecialist = {
          id: newSpecialistId,
          ...formData,
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
            
            {renderInput(
              'Title/Profession *',
              formData.title,
              (text) => setFormData(prev => ({ ...prev, title: text })),
              'e.g., Speech-Language Pathologist, Occupational Therapist',
              'default',
              false,
              errors.title
            )}
            
            {renderInput(
              'Organization',
              formData.organization || '',
              (text) => setFormData(prev => ({ ...prev, organization: text })),
              'Hospital, clinic, or practice name'
            )}

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
              '(555) 123-4567',
              'phone-pad'
            )}
            
            {renderInput(
              'Address',
              formData.address || '',
              (text) => setFormData(prev => ({ ...prev, address: text })),
              'Street address or general location',
              'default',
              true
            )}

            {/* Specialties Section */}
            <Text weight="medium" style={{
              fontSize: tokens.font.size.lg,
              color: tokens.color.text.primary,
              marginBottom: tokens.spacing.gap.md,
              marginTop: tokens.spacing.gap.lg
            }}>
              Areas of Expertise
            </Text>
            
            <View style={{ marginBottom: tokens.spacing.gap.md }}>
              <View style={{ flexDirection: 'row', gap: tokens.spacing.gap.sm }}>
                <TextInput
                  value={specialtyInput}
                  onChangeText={setSpecialtyInput}
                  placeholder="Add area of expertise (e.g., Autism, ADHD)"
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: tokens.color.border.default,
                    borderRadius: tokens.radius.lg,
                    paddingHorizontal: tokens.spacing.gap.md,
                    paddingVertical: tokens.spacing.gap.sm,
                    fontSize: tokens.font.size.body,
                    color: tokens.color.text.primary,
                    backgroundColor: 'white',
                    height: 44
                  }}
                  placeholderTextColor={tokens.color.text.secondary}
                  returnKeyType="done"
                  onSubmitEditing={handleAddSpecialty}
                />
                <TouchableOpacity
                  onPress={handleAddSpecialty}
                  style={{
                    backgroundColor: tokens.color.brand.gradient.start,
                    borderRadius: tokens.radius.lg,
                    paddingHorizontal: tokens.spacing.gap.md,
                    paddingVertical: tokens.spacing.gap.sm,
                    height: 44,
                    justifyContent: 'center'
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '500' }}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Display existing specialties */}
            {formData.specialties && formData.specialties.length > 0 && (
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: tokens.spacing.gap.sm,
                marginBottom: tokens.spacing.gap.lg
              }}>
                {formData.specialties.map((specialty, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: tokens.color.brand.gradient.start + '20',
                      borderColor: tokens.color.brand.gradient.start,
                      borderWidth: 1,
                      borderRadius: tokens.radius.full,
                      paddingHorizontal: tokens.spacing.gap.md,
                      paddingVertical: tokens.spacing.gap.xs,
                      gap: tokens.spacing.gap.xs
                    }}
                  >
                    <Text style={{
                      fontSize: tokens.font.size.sm,
                      color: tokens.color.brand.gradient.start
                    }}>
                      {specialty}
                    </Text>
                    <TouchableOpacity onPress={() => handleRemoveSpecialty(index)}>
                      <Ionicons name="close" size={16} color={tokens.color.brand.gradient.start} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

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
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}