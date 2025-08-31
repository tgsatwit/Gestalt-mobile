import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

interface BottomNavigationProps {
  onAddPress?: () => void;
  onProfilePress?: () => void;
  showAddMenu?: boolean;
  showProfileMenu?: boolean;
  addMenuAnim?: Animated.Value;
  profileMenuAnim?: Animated.Value;
  addMenuOptions?: Array<{
    title: string;
    icon: string;
    navigateTo: string;
  }>;
  profileMenuOptions?: Array<{
    title: string;
    icon: string;
    navigateTo: string;
  }>;
}

export function BottomNavigation({
  onAddPress,
  onProfilePress,
  showAddMenu = false,
  showProfileMenu = false,
  addMenuAnim,
  profileMenuAnim,
  addMenuOptions = [],
  profileMenuOptions = []
}: BottomNavigationProps) {
  const { tokens } = useTheme();
  const navigation = useNavigation();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for mic button
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleMicPress = () => {
    (navigation as any).navigate('Coach', { initialMode: 'Language Coach' });
  };

  return (
    <>
      {/* Enhanced Shadow Base for Strong Elevation */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 120,
        backgroundColor: 'transparent',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -20 },
        shadowOpacity: 0.4,
        shadowRadius: 40,
        elevation: 50
      }} />



      {/* Bottom Navigation with Enhanced Elevation */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.08)',
        paddingTop: tokens.spacing.gap.sm,
        paddingHorizontal: tokens.spacing.gap.md,
        paddingBottom: tokens.spacing.gap.sm + 10,
        height: 85,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 25,
        overflow: 'visible'
      }}>
        {/* Strong separation border */}
        <View style={{
          position: 'absolute',
          top: -2,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: 'rgba(0,0,0,0.1)',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10
        }} />
        
        {/* Enhanced white background with subtle gradient */}
        <LinearGradient
          colors={['rgba(248,250,252,1)', 'rgba(255,255,255,1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '100%',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12
          }}
        />
        
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flex: 1,
          paddingHorizontal: tokens.spacing.gap.xs
        }}>
          {/* Home Button */}
          <TouchableOpacity 
            onPress={() => (navigation as any).navigate('Dashboard')}
            style={{ alignItems: 'center', width: 65 }}
          >
            <Ionicons name="home-outline" size={26} color={tokens.color.text.secondary} />
            <Text style={{ 
              fontSize: 11, 
              color: tokens.color.text.secondary, 
              marginTop: 3,
              fontWeight: '500'
            }}>
              Home
            </Text>
          </TouchableOpacity>
          
          {/* Add Memory Button */}
          <TouchableOpacity onPress={onAddPress} style={{ alignItems: 'center', width: 65 }}>
            <Ionicons name="add-outline" size={26} color={tokens.color.text.secondary} />
            <Text style={{ 
              fontSize: 11, 
              color: tokens.color.text.secondary, 
              marginTop: 3,
              fontWeight: '500'
            }}>
              Add
            </Text>
          </TouchableOpacity>
          
          {/* Spacer for center button */}
          <View style={{ width: 64 }} />
          
          {/* View Memories Button */}
          <TouchableOpacity 
            onPress={() => (navigation as any).navigate('Memories')}
            style={{ alignItems: 'center', width: 65 }}
          >
            <Ionicons name="albums-outline" size={26} color={tokens.color.text.secondary} />
            <Text style={{ 
              fontSize: 11, 
              color: tokens.color.text.secondary, 
              marginTop: 3,
              fontWeight: '500'
            }}>
              Memories
            </Text>
          </TouchableOpacity>
          
          {/* Profile Button */}
          <TouchableOpacity onPress={onProfilePress} style={{ alignItems: 'center', width: 65 }}>
            <Ionicons name="person-outline" size={26} color={tokens.color.text.secondary} />
            <Text style={{ 
              fontSize: 11, 
              color: tokens.color.text.secondary, 
              marginTop: 3,
              fontWeight: '500'
            }}>
              Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Menu Overlay */}
      {showAddMenu && addMenuAnim && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.1)',
            opacity: addMenuAnim
          }}
        >
          <TouchableOpacity 
            style={{ flex: 1 }}
            onPress={onAddPress}
            activeOpacity={1}
          />
        </Animated.View>
      )}

      {/* Profile Menu Overlay */}
      {showProfileMenu && profileMenuAnim && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.1)',
            opacity: profileMenuAnim
          }}
        >
          <TouchableOpacity 
            style={{ flex: 1 }}
            onPress={onProfilePress}
            activeOpacity={1}
          />
        </Animated.View>
      )}

      {/* Animated Add Dropdown Menu */}
      {showAddMenu && addMenuAnim && addMenuOptions.length > 0 && (
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 95,
            left: tokens.spacing.containerX + 65,
            backgroundColor: 'white',
            borderRadius: tokens.radius['2xl'],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 15,
            overflow: 'hidden',
            minWidth: 180,
            transform: [
              {
                translateY: addMenuAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                })
              },
              {
                scale: addMenuAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                })
              }
            ],
            opacity: addMenuAnim
          }}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          
          {addMenuOptions.map((option, index) => (
            <TouchableOpacity
              key={option.title}
              onPress={() => {
                (navigation as any).navigate(option.navigateTo);
                onAddPress?.();
              }}
              activeOpacity={0.7}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: tokens.spacing.gap.lg,
                paddingVertical: tokens.spacing.gap.lg,
                borderBottomWidth: index !== addMenuOptions.length - 1 ? 0.5 : 0,
                borderBottomColor: 'rgba(124,58,237,0.1)',
                backgroundColor: 'transparent'
              }}
            >
              <Text style={{
                fontSize: tokens.font.size.sm,
                color: tokens.color.text.primary,
                fontWeight: '600',
                textAlign: 'center'
              }}>
                {option.title}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      {/* Animated Profile Dropdown Menu */}
      {showProfileMenu && profileMenuAnim && profileMenuOptions.length > 0 && (
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 95,
            right: tokens.spacing.containerX,
            backgroundColor: 'white',
            borderRadius: tokens.radius['2xl'],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 15,
            overflow: 'hidden',
            minWidth: 180,
            transform: [
              {
                translateY: profileMenuAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                })
              },
              {
                scale: profileMenuAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                })
              }
            ],
            opacity: profileMenuAnim
          }}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          
          {profileMenuOptions.map((option, index) => (
            <TouchableOpacity
              key={option.title}
              onPress={() => {
                (navigation as any).navigate(option.navigateTo);
                onProfilePress?.();
              }}
              activeOpacity={0.7}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: tokens.spacing.gap.lg,
                paddingVertical: tokens.spacing.gap.lg,
                borderBottomWidth: index !== profileMenuOptions.length - 1 ? 0.5 : 0,
                borderBottomColor: 'rgba(124,58,237,0.1)',
                backgroundColor: 'transparent'
              }}
            >
              <Text style={{
                fontSize: tokens.font.size.sm,
                color: tokens.color.text.primary,
                fontWeight: '600',
                textAlign: 'center'
              }}>
                {option.title}
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      {/* Floating Mic Button - Gestalts Brand */}
      <Animated.View style={{ 
        position: 'absolute',
        bottom: 42,
        left: '50%',
        marginLeft: -36,
        zIndex: 1001,
        transform: [{ scale: pulseAnim }]
      }}>
        <TouchableOpacity 
          onPress={handleMicPress}
          activeOpacity={0.9}
        >
          <View style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            overflow: 'hidden',
            shadowColor: 'rgba(124,58,237,0.4)',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 20,
            elevation: 15
          }}>
            {/* Gestalts brand gradient background */}
            <LinearGradient
              colors={['#7C3AED', '#EC4899', '#FB923C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                borderWidth: 2,
                borderColor: 'rgba(255, 255, 255, 0.3)'
              }}
            >
              {/* Liquid glass shine effect */}
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '45%',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                borderTopLeftRadius: 36,
                borderTopRightRadius: 36
              }} />
              
              {/* Inner shadow for depth */}
              <View style={{
                position: 'absolute',
                top: 2,
                left: 2,
                right: 2,
                bottom: 2,
                borderRadius: 34,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)'
              }} />
              
              <View style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Ionicons name="mic" size={32} color="white" />
              </View>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}