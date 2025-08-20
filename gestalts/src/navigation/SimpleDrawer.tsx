import React, { useState, createContext, useContext, useEffect, useRef } from 'react';
import { View, Modal, TouchableOpacity, ScrollView, Image, Animated, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text, useTheme } from '../theme';
import { useMemoriesStore } from '../state/useStore';
import { Ionicons } from '@expo/vector-icons';
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
  
  const slideAnim = useRef(new Animated.Value(-280)).current;
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
        toValue: -280,
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
      color: '#667eea'
    },
    {
      name: 'Coach',
      label: 'AI Coach',
      icon: 'chatbubbles',
      color: '#f093fb'
    },
    {
      name: 'Memories',
      label: 'Memories',
      icon: 'book',
      color: '#4facfe',
      count: journal.length + milestones.length + appointmentNotes.length
    },
    {
      name: 'Play',
      label: 'Play Analysis',
      icon: 'game-controller',
      color: '#43e97b',
      count: playSessions.length
    },
    {
      name: 'Report',
      label: 'Reports',
      icon: 'document-text',
      color: '#ff6b6b'
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
            width: 280,
            backgroundColor: 'white',
            shadowColor: '#000',
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
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
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: tokens.spacing.gap.sm }}>
                  <Image 
                    source={require('../../assets/Gestalts-logo.png')} 
                    style={{ width: 40, height: 40, marginRight: tokens.spacing.gap.sm }}
                    resizeMode="contain"
                  />
                  <View>
                    <Text weight="semibold" style={{ fontSize: tokens.font.size.lg }}>
                      Gestalts
                    </Text>
                    {profile && (
                      <Text color="secondary" style={{ fontSize: tokens.font.size.sm }}>
                        Supporting {profile.childName}
                      </Text>
                    )}
                  </View>
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
                      marginVertical: 2,
                      borderRadius: tokens.radius.lg
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: item.color + '20',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: tokens.spacing.gap.md
                      }}
                    >
                      <Ionicons 
                        name={item.icon as any} 
                        size={18} 
                        color={item.color} 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text 
                        weight="regular"
                        style={{ 
                          fontSize: tokens.font.size.body,
                          color: tokens.color.text.secondary
                        }}
                      >
                        {item.label}
                      </Text>
                    </View>
                    {item.count !== undefined && item.count > 0 && (
                      <View
                        style={{
                          backgroundColor: item.color,
                          borderRadius: 10,
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          minWidth: 20,
                          alignItems: 'center'
                        }}
                      >
                        <Text style={{ 
                          color: 'white', 
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
                  <Text color="secondary" style={{ marginLeft: tokens.spacing.gap.sm, fontSize: tokens.font.size.body }}>
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
                  <Text color="secondary" style={{ marginLeft: tokens.spacing.gap.sm, fontSize: tokens.font.size.body }}>
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