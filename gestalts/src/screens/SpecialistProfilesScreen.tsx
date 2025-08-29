import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '../navigation/SimpleDrawer';
import { useNavigation } from '@react-navigation/native';
import { BottomNavigation } from '../components/BottomNavigation';

export default function SpecialistProfilesScreen() {
	const { tokens } = useTheme();
	const { openDrawer } = useDrawer();
	const navigation = useNavigation();

	return (
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
						<TouchableOpacity onPress={openDrawer}>
							<Ionicons name="menu" size={24} color="white" />
						</TouchableOpacity>
						<Text style={{ color: 'white', fontSize: tokens.font.size.h3, fontWeight: '600' }}>
							Specialist Profiles
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
				>
					{/* Coming Soon Message */}
					<View style={{
						alignItems: 'center',
						justifyContent: 'center',
						paddingVertical: tokens.spacing.gap.xl * 2
					}}>
						<View style={{
							width: 100,
							height: 100,
							borderRadius: 50,
							backgroundColor: tokens.color.bg.muted,
							alignItems: 'center',
							justifyContent: 'center',
							marginBottom: tokens.spacing.gap.lg
						}}>
							<Ionicons name="medical" size={50} color={tokens.color.brand.gradient.start} />
						</View>
						
						<Text weight="medium" style={{
							fontSize: tokens.font.size.xl,
							color: tokens.color.text.primary,
							marginBottom: tokens.spacing.gap.sm,
							textAlign: 'center'
						}}>
							Specialist Profiles
						</Text>
						
						<Text style={{
							fontSize: tokens.font.size.body,
							color: tokens.color.text.secondary,
							textAlign: 'center',
							marginBottom: tokens.spacing.gap.lg,
							lineHeight: 24,
							paddingHorizontal: tokens.spacing.gap.lg
						}}>
							Manage your healthcare professional network, including speech-language pathologists, occupational therapists, and other specialists working with your child.
						</Text>

						<View style={{
							backgroundColor: tokens.color.bg.muted,
							borderRadius: tokens.radius.lg,
							padding: tokens.spacing.gap.lg,
							marginBottom: tokens.spacing.gap.lg,
							borderWidth: 1,
							borderColor: tokens.color.border.default
						}}>
							<Text weight="medium" style={{
								fontSize: tokens.font.size.body,
								color: tokens.color.text.primary,
								marginBottom: tokens.spacing.gap.sm,
								textAlign: 'center'
							}}>
								Coming Soon
							</Text>
							<Text style={{
								fontSize: tokens.font.size.sm,
								color: tokens.color.text.secondary,
								textAlign: 'center',
								lineHeight: 20
							}}>
								This feature is currently in development. You'll soon be able to:
							</Text>
						</View>

						{/* Feature List */}
						<View style={{ width: '100%', marginBottom: tokens.spacing.gap.xl }}>
							{[
								'Create specialist profiles with contact information',
								'Track appointment history and notes',
								'Share progress reports with your team',
								'Coordinate care plans and goals',
								'Schedule and manage appointments',
								'Store professional recommendations'
							].map((feature, index) => (
								<View key={index} style={{
									flexDirection: 'row',
									alignItems: 'flex-start',
									marginBottom: tokens.spacing.gap.md,
									paddingHorizontal: tokens.spacing.gap.md
								}}>
									<View style={{
										width: 8,
										height: 8,
										borderRadius: 4,
										backgroundColor: tokens.color.brand.gradient.start,
										marginRight: tokens.spacing.gap.md,
										marginTop: 8
									}} />
									<Text style={{
										fontSize: tokens.font.size.sm,
										color: tokens.color.text.secondary,
										flex: 1,
										lineHeight: 22
									}}>
										{feature}
									</Text>
								</View>
							))}
						</View>

						{/* CTA Button */}
						<TouchableOpacity
							onPress={() => {
								// Navigate back or to feedback
								navigation.goBack();
							}}
							style={{
								backgroundColor: tokens.color.brand.gradient.start + '20',
								borderColor: tokens.color.brand.gradient.start,
								borderWidth: 1,
								borderRadius: tokens.radius.lg,
								paddingHorizontal: tokens.spacing.gap.lg,
								paddingVertical: tokens.spacing.gap.md
							}}
						>
							<Text style={{
								color: tokens.color.brand.gradient.start,
								fontSize: tokens.font.size.body,
								fontWeight: '600',
								textAlign: 'center'
							}}>
								Request Early Access
							</Text>
						</TouchableOpacity>

						{/* Beta Notice */}
						<View style={{
							marginTop: tokens.spacing.gap.xl,
							paddingHorizontal: tokens.spacing.gap.lg
						}}>
							<Text style={{
								fontSize: tokens.font.size.xs,
								color: tokens.color.text.secondary,
								textAlign: 'center',
								lineHeight: 18
							}}>
								Want to help shape this feature? Contact us to join our beta testing program and get early access to specialist profile management.
							</Text>
						</View>
					</View>
				</ScrollView>
			</View>

			{/* Center Microphone Button */}
			<TouchableOpacity style={{ 
				position: 'absolute',
				bottom: 42,
				left: '50%',
				marginLeft: -32,
				zIndex: 1000
			}}>
				<View style={{
					width: 64,
					height: 64,
					borderRadius: 32,
					overflow: 'hidden',
					shadowColor: tokens.color.brand.gradient.start,
					shadowOffset: { width: 0, height: 8 },
					shadowOpacity: 0.5,
					shadowRadius: 16,
					elevation: 12
				}}>
					<LinearGradient
						colors={['#4C1D95', '#5B21B6', '#6D28D9', '#7C3AED']}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 1 }}
						style={{
							width: '100%',
							height: '100%',
							alignItems: 'center',
							justifyContent: 'center'
						}}
					>
						<View style={{
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							height: '50%',
							backgroundColor: 'rgba(255,255,255,0.2)',
							borderRadius: 28
						}} />
						
						<Ionicons name="mic" size={28} color="white" style={{ zIndex: 1 }} />
					</LinearGradient>
				</View>
			</TouchableOpacity>

			<BottomNavigation />
		</LinearGradient>
	);
}