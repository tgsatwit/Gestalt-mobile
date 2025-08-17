import React from 'react';
import { View } from 'react-native';
import { Text, useTheme } from '../theme';

export default function AppHeader({ title }: { title: string }) {
	const { tokens } = useTheme();
	return (
		<View style={{ height: 56, borderBottomColor: tokens.color.border.default, borderBottomWidth: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
			<Text weight="semibold" style={{ fontSize: tokens.font.size.h3 }}>{title}</Text>
		</View>
	);
}