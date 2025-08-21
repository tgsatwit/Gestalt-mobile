import React from 'react';
import { View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GlassViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export const GlassView: React.FC<GlassViewProps> = ({ 
  children, 
  style,
  intensity = 0.1 
}) => {
  return (
    <View style={[style, { overflow: 'hidden', position: 'relative' }]}>
      {/* Base subtle tint */}
      <View 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: `rgba(0, 0, 0, 0.05)`,
        }} 
      />
      
      {/* Primary frosted glass layer */}
      <View 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: `rgba(255, 255, 255, ${intensity})`,
        }} 
      />
      
      {/* Multi-directional gradient reflections */}
      <LinearGradient
        colors={[
          `rgba(255, 255, 255, ${intensity * 0.6})`,
          'transparent',
          `rgba(255, 255, 255, ${intensity * 0.3})`,
          'transparent',
          `rgba(255, 255, 255, ${intensity * 0.4})`
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      />
      
      {/* Top rim light reflection */}
      <LinearGradient
        colors={[
          `rgba(255, 255, 255, ${intensity * 1.2})`,
          `rgba(255, 255, 255, ${intensity * 0.4})`,
          'transparent'
        ]}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '25%',
        }}
      />
      
      {/* Side rim highlights */}
      <LinearGradient
        colors={[
          `rgba(255, 255, 255, ${intensity * 0.8})`,
          'transparent'
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '15%',
          bottom: 0,
        }}
      />
      
      <LinearGradient
        colors={[
          'transparent',
          `rgba(255, 255, 255, ${intensity * 0.8})`
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '15%',
          bottom: 0,
        }}
      />
      
      {/* Bottom subtle reflection */}
      <LinearGradient
        colors={[
          'transparent',
          `rgba(255, 255, 255, ${intensity * 0.3})`,
          `rgba(255, 255, 255, ${intensity * 0.5})`
        ]}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '20%',
        }}
      />
      
      {/* Diagonal streak reflection */}
      <LinearGradient
        colors={[
          'transparent',
          `rgba(255, 255, 255, ${intensity * 0.4})`,
          'transparent'
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          position: 'absolute',
          top: '20%',
          left: '20%',
          right: '20%',
          height: '40%',
          transform: [{ rotate: '15deg' }]
        }}
      />
      
      {/* Surface texture with subtle noise-like pattern */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent',
          opacity: 0.3,
        }}
      >
        {/* Create a subtle pattern with multiple small gradients */}
        {Array.from({ length: 8 }).map((_, i) => (
          <LinearGradient
            key={i}
            colors={[
              'transparent',
              `rgba(255, 255, 255, ${intensity * 0.1})`,
              'transparent'
            ]}
            style={{
              position: 'absolute',
              width: '20%',
              height: '20%',
              top: `${(i % 4) * 25}%`,
              left: `${Math.floor(i / 4) * 50}%`,
              borderRadius: 50,
              transform: [{ rotate: `${i * 45}deg` }]
            }}
          />
        ))}
      </View>
      
      {children}
    </View>
  );
};