import React, { useState, createContext, useContext, useEffect, useRef } from 'react';
import { View, Modal, TouchableOpacity, ScrollView, Image, Animated, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text, useTheme } from '../theme';
import { useMemoriesStore } from '../state/useStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { MainStackParamList } from './MainNavigator';
import type { NavigationProp } from '@react-navigation/native';

interface DrawerContextType {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType | undefined>(undefined);

export const useDrawer = () => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }
  return context;
};

interface DrawerProviderProps {
  children: React.ReactNode;
}

export function DrawerProvider({ children }: DrawerProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { tokens } = useTheme();
  const profile = useMemoriesStore((s) => s.profile);
  const journal = useMemoriesStore((s) => s.journal);
  const milestones = useMemoriesStore((s) => s.milestones);
  const appointmentNotes = useMemoriesStore((s) => s.appointmentNotes);
  const playSessions = useMemoriesStore((s) => s.playSessions);
  
  const slideAnim = useRef(new Animated.Value(-320)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    setIsOpen(true);
    // Animate drawer sliding in from left with easing
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        // Ease-out cubic for smooth acceleration
        easing: (t) => {
          const p = t - 1;
          return p * p * p + 1;
        }
      }),
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  const closeDrawer = () => {
    // Animate drawer sliding out to left with easing
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -320,
        duration: 250,
        useNativeDriver: true,
        // Ease-in cubic for smooth deceleration
        easing: (t) => t * t * t
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsOpen(false);
    });
  };

  const menuItems = [
    {
      name: 'Dashboard',
      label: 'Dashboard',
      icon: 'home',
      iconColor: '#7C3AED'
    },
    {
      name: 'Coach',
      label: 'Ask Jessie',
      icon: 'mic',
      iconColor: '#7C3AED'
    },
    {
      name: 'Memories',
      label: 'Memories',
      icon: 'albums',
      iconColor: '#7C3AED',
      count: journal.length + milestones.length + appointmentNotes.length
    },
    {
      name: 'Play',
      label: 'Play Analysis',
      icon: 'sync',
      iconColor: '#7C3AED',
      count: playSessions.length
    },
    {
      name: 'Report',
      label: 'Reports',
      icon: 'document-text',
      iconColor: '#7C3AED'
    }
  ];

  const navigation = useNavigation<NavigationProp<MainStackParamList>>();

  const handleNavigate = (screen: keyof MainStackParamList, params?: any) => {
    closeDrawer();
    navigation.navigate(screen, params);
  };

  return (
    <DrawerContext.Provider value={{ isOpen, openDrawer, closeDrawer }}>
      {children}
      <Modal
        visible={isOpen}
        animationType="none"
        transparent
        onRequestClose={closeDrawer}
      >
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {/* Animated Drawer Content */}
          <Animated.View style={{
            width: 320,
            backgroundColor: 'white',
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5,
            transform: [{ translateX: slideAnim }]
          }}>
            <ScrollView style={{ flex: 1 }}>
              {/* Header */}
              <View style={{ 
                paddingHorizontal: tokens.spacing.containerX,
                paddingVertical: tokens.spacing.gap.lg,
                paddingTop: 60,
                borderBottomWidth: 1,
                borderBottomColor: tokens.color.border.default,
                marginBottom: tokens.spacing.gap.md
              }}>
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between'
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image 
                      source={require('../../assets/Gestalts-logo.png')} 
                      style={{ width: 32, height: 32, marginRight: tokens.spacing.gap.sm }}
                      resizeMode="contain"
                    />
                    <Text weight="semibold" style={{ 
                      fontSize: tokens.font.size.h3,
                      fontFamily: 'PlusJakartaSans-SemiBold'
                    }}>
                      Gestalts
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={closeDrawer}
                    style={{ 
                      padding: 8,
                      marginRight: -8
                    }}
                  >
                    <Ionicons name="close" size={24} color={tokens.color.text.secondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Menu Items */}
              <View style={{ paddingHorizontal: tokens.spacing.gap.sm }}>
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.name}
                    onPress={() => handleNavigate(item.name as keyof MainStackParamList)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: tokens.spacing.gap.sm,
                      paddingHorizontal: tokens.spacing.gap.md,
                      marginVertical: 1,
                      borderRadius: tokens.radius.lg,
                      backgroundColor: 'transparent'
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: item.iconColor + '15',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: tokens.spacing.gap.md
                      }}
                    >
                      <Ionicons 
                        name={item.icon as any} 
                        size={20} 
                        color={item.iconColor} 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text 
                        weight="medium"
                        style={{ 
                          fontSize: tokens.font.size.body,
                          color: tokens.color.text.primary,
                          fontFamily: 'PlusJakartaSans-Medium'
                        }}
                      >
                        {item.label}
                      </Text>
                    </View>
                    {item.count !== undefined && item.count > 0 && (
                      <View
                        style={{
                          backgroundColor: tokens.color.border.default,
                          borderRadius: 10,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          minWidth: 20,
                          alignItems: 'center'
                        }}
                      >
                        <Text style={{ 
                          color: tokens.color.text.secondary, 
                          fontSize: tokens.font.size.xs, 
                          fontWeight: '600' 
                        }}>
                          {item.count}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Footer */}
              <View style={{ 
                marginTop: 'auto',
                paddingHorizontal: tokens.spacing.containerX,
                paddingVertical: tokens.spacing.gap.lg,
                borderTopWidth: 1,
                borderTopColor: tokens.color.border.default
              }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: tokens.spacing.gap.sm
                  }}
                >
                  <Ionicons name="settings-outline" size={20} color={tokens.color.text.secondary} />
                  <Text color="secondary" style={{ 
                    marginLeft: tokens.spacing.gap.sm, 
                    fontSize: tokens.font.size.body,
                    fontFamily: 'PlusJakartaSans-Regular'
                  }}>
                    Settings
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: tokens.spacing.gap.sm
                  }}
                >
                  <Ionicons name="help-circle-outline" size={20} color={tokens.color.text.secondary} />
                  <Text color="secondary" style={{ 
                    marginLeft: tokens.spacing.gap.sm, 
                    fontSize: tokens.font.size.body,
                    fontFamily: 'PlusJakartaSans-Regular'
                  }}>
                    Help & Support
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>

          {/* Animated Overlay */}
          <Animated.View 
            style={{ 
              flex: 1, 
              backgroundColor: 'rgba(0,0,0,0.5)',
              opacity: overlayOpacity
            }}
          >
            <TouchableOpacity 
              style={{ flex: 1 }}
              onPress={closeDrawer}
              activeOpacity={1}
            />
          </Animated.View>
        </View>
      </Modal>
    </DrawerContext.Provider>
  );
}