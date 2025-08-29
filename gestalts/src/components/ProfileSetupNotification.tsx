import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProfileSetupNotificationProps {
  show: boolean;
}

const NOTIFICATION_DISMISSED_KEY = 'profile_setup_notification_dismissed';

export function ProfileSetupNotification({ show }: ProfileSetupNotificationProps) {
  const { tokens } = useTheme();
  const navigation = useNavigation();
  const [isVisible, setIsVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    checkIfDismissed();
  }, []);

  useEffect(() => {
    if (show && isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [show, isVisible, fadeAnim]);

  const checkIfDismissed = async () => {
    try {
      const dismissed = await AsyncStorage.getItem(NOTIFICATION_DISMISSED_KEY);
      setIsVisible(!dismissed);
    } catch (error) {
      console.error('Error checking notification dismissed status:', error);
      setIsVisible(true);
    }
  };

  const handleDismiss = async () => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_DISMISSED_KEY, 'true');
      setIsVisible(false);
    } catch (error) {
      console.error('Error saving notification dismissed status:', error);
      setIsVisible(false);
    }
  };

  const handleCreateProfile = () => {
    navigation.navigate('ChildProfile');
    handleDismiss();
  };

  if (!show || !isVisible) {
    return null;
  }

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={{
        marginHorizontal: tokens.spacing.containerX,
        marginBottom: tokens.spacing.gap.md,
        borderRadius: tokens.radius.lg,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4
      }}>
        <LinearGradient
          colors={['#EDF2FF', '#F0F9FF', '#FDF2F8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            padding: tokens.spacing.gap.md,
            borderWidth: 1,
            borderColor: tokens.color.brand.gradient.start + '30'
          }}
        >
          {/* Header */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'flex-start', 
            justifyContent: 'space-between',
            marginBottom: tokens.spacing.gap.sm 
          }}>
            <View style={{ flex: 1, marginRight: tokens.spacing.gap.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: tokens.spacing.gap.xs }}>
                <View style={{
                  backgroundColor: tokens.color.brand.gradient.start,
                  borderRadius: 16,
                  width: 32,
                  height: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: tokens.spacing.gap.sm
                }}>
                  <Ionicons name="person-add" size={16} color="white" />
                </View>
                <Text weight="medium" style={{ 
                  color: tokens.color.text.primary,
                  fontSize: tokens.font.size.body
                }}>
                  Complete your setup
                </Text>
              </View>
              <Text style={{ 
                color: tokens.color.text.secondary,
                fontSize: tokens.font.size.sm,
                lineHeight: 20
              }}>
                Create a child profile to unlock personalized features, track progress, and get the most out of Gestalts.
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={handleDismiss}
              style={{
                padding: tokens.spacing.gap.xs,
                marginTop: -tokens.spacing.gap.xs,
                marginRight: -tokens.spacing.gap.xs
              }}
            >
              <Ionicons name="close" size={18} color={tokens.color.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={{ 
            flexDirection: 'row', 
            gap: tokens.spacing.gap.sm,
            marginTop: tokens.spacing.gap.sm 
          }}>
            <TouchableOpacity
              onPress={handleCreateProfile}
              style={{
                backgroundColor: tokens.color.brand.gradient.start,
                borderRadius: tokens.radius.md,
                paddingVertical: tokens.spacing.gap.sm,
                paddingHorizontal: tokens.spacing.gap.md,
                flex: 1
              }}
            >
              <Text style={{
                color: 'white',
                fontSize: tokens.font.size.sm,
                fontWeight: '600',
                textAlign: 'center'
              }}>
                Create Profile
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleDismiss}
              style={{
                backgroundColor: 'rgba(124, 58, 237, 0.1)',
                borderColor: tokens.color.brand.gradient.start + '40',
                borderWidth: 1,
                borderRadius: tokens.radius.md,
                paddingVertical: tokens.spacing.gap.sm,
                paddingHorizontal: tokens.spacing.gap.md,
                flex: 1
              }}
            >
              <Text style={{
                color: tokens.color.brand.gradient.start,
                fontSize: tokens.font.size.sm,
                fontWeight: '500',
                textAlign: 'center'
              }}>
                Maybe Later
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
}