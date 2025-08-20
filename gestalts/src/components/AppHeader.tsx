import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useDrawer } from '../navigation/SimpleDrawer';

interface AppHeaderProps {
	title: string;
	showLogo?: boolean;
	showMenu?: boolean;
}

export default function AppHeader({ title, showLogo = false, showMenu = false }: AppHeaderProps) {
	const { tokens } = useTheme();
	const { openDrawer } = useDrawer();

	return (
		<View style={{ 
			height: 56, 
			borderBottomColor: tokens.color.border.default, 
			borderBottomWidth: 1, 
			backgroundColor: 'white', 
			alignItems: 'center', 
			justifyContent: 'space-between',
			flexDirection: 'row',
			paddingHorizontal: tokens.spacing.containerX
		}}>
			{showMenu ? (
				<TouchableOpacity
					onPress={openDrawer}
					style={{ padding: 4 }}
				>
					<Ionicons name="menu" size={24} color={tokens.color.text.primary} />
				</TouchableOpacity>
			) : (
				<View style={{ width: 32 }} />
			)}
			
			<View style={{ flexDirection: 'row', alignItems: 'center' }}>
				{showLogo && (
					<Image 
						source={require('../../assets/Gestalts-logo.png')} 
						style={{ width: 24, height: 24, marginRight: tokens.spacing.gap.sm }}
						resizeMode="contain"
					/>
				)}
				<Text weight="semibold" style={{ fontSize: tokens.font.size.h3 }}>{title}</Text>
			</View>
			
			<View style={{ width: 32 }} />
		</View>
	);
}