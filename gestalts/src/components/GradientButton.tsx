import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, useTheme } from '../theme';

export type GradientButtonProps = {
	title: string;
	onPress?: () => void;
	style?: ViewStyle;
	disabled?: boolean;
};

export const GradientButton: React.FC<GradientButtonProps> = ({ title, onPress, style, disabled }) => {
	const { tokens } = useTheme();
	return (
		<Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [style, pressed && { opacity: 0.96 }]}
			android_ripple={{ color: '#ffffff33', borderless: false }}>
			<LinearGradient
				colors={[tokens.color.brand.gradient.start, tokens.color.brand.gradient.mid, tokens.color.brand.gradient.end]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 0 }}
				style={{ paddingVertical: 14, paddingHorizontal: 20, borderRadius: tokens.radius.pill, alignItems: 'center', justifyContent: 'center' }}
			>
				<Text style={{ color: 'white', fontSize: 16 }} weight="semibold">{title}</Text>
			</LinearGradient>
		</Pressable>
	);
};

const styles = StyleSheet.create({});