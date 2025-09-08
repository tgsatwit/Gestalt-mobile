import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Modal, Pressable } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '../navigation/SimpleDrawer';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/types';
import { BottomNavigation } from '../navigation/BottomNavigation';
import { useAuth } from '../contexts/AuthContext';
import { useSpecialistStore } from '../state/useSpecialistStore';
import { Specialist } from '../types/specialist';
import specialistService from '../services/specialistService';

export default function SpecialistProfilesScreen() {
	const { tokens } = useTheme();
	const { openDrawer } = useDrawer();
	const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
	const { getCurrentUserId } = useAuth();
	const { 
		specialists, 
		loading, 
		error, 
		loadSpecialists, 
		clearError 
	} = useSpecialistStore();
	
	const [refreshing, setRefreshing] = useState(false);
	const [dropdownVisible, setDropdownVisible] = useState<string | null>(null);
	const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

	const loadData = async (showRefreshing = false) => {
		const userId = getCurrentUserId();
		if (!userId) {
			return;
		}

		if (showRefreshing) {
			setRefreshing(true);
		}

		try {
			await loadSpecialists(userId);
		} finally {
			if (showRefreshing) {
				setRefreshing(false);
			}
		}
	};

	useEffect(() => {
		loadData();
	}, []);

	// Refresh specialists when screen comes into focus
	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [])
	);

	const handleRefresh = () => {
		loadData(true);
	};

	const handleAddSpecialist = () => {
		navigation.navigate('AddEditSpecialist');
	};

	const handleEditSpecialist = (specialist: Specialist) => {
		navigation.navigate('AddEditSpecialist', { specialistId: specialist.id });
	};

	const handleDeleteSpecialist = async (specialist: Specialist) => {
		const userId = getCurrentUserId();
		if (!userId) return;

		Alert.alert(
			'Delete Specialist',
			`Are you sure you want to delete ${specialist.name}? This will also remove all associated relationships with children.`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							await specialistService.deleteSpecialist(specialist.id, userId);
							Alert.alert('Success', 'Specialist deleted successfully');
							loadData(); // Refresh list
						} catch (err) {
							console.error('Failed to delete specialist:', err);
							Alert.alert('Error', 'Failed to delete specialist. Please try again.');
						}
					}
				}
			]
		);
	};

	if (loading) {
		return (
			<LinearGradient
				colors={['#7C3AED', '#EC4899', '#FB923C']}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
			>
				<ActivityIndicator size="large" color="white" />
				<Text style={{ color: 'white', marginTop: tokens.spacing.gap.md }}>
					Loading Specialists...
				</Text>
			</LinearGradient>
		);
	}

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
					
					{/* Close Button */}
					<TouchableOpacity
						onPress={() => navigation.goBack()}
						activeOpacity={0.7}
						style={{
							padding: 6
						}}
					>
						<Ionicons name="close" size={18} color="white" />
					</TouchableOpacity>
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
					refreshControl={
						<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
					}
				>

					{/* Error Display */}
					{error && (
						<View style={{
							backgroundColor: '#FEE2E2',
							borderColor: '#EF4444',
							borderWidth: 1,
							borderRadius: tokens.radius.lg,
							padding: tokens.spacing.gap.md,
							marginBottom: tokens.spacing.gap.md
						}}>
							<Text style={{ color: '#EF4444', textAlign: 'center' }}>
								{error}
							</Text>
							<TouchableOpacity onPress={clearError} style={{ marginTop: tokens.spacing.gap.xs }}>
								<Text style={{ color: '#EF4444', textAlign: 'center', textDecorationLine: 'underline' }}>
									Dismiss
								</Text>
							</TouchableOpacity>
						</View>
					)}

					{/* Empty State */}
					{specialists.length === 0 && !loading && (
						<View style={{
							alignItems: 'center',
							justifyContent: 'center',
							paddingVertical: tokens.spacing.gap.xl * 2
						}}>
							<View style={{
								width: 80,
								height: 80,
								borderRadius: 40,
								backgroundColor: tokens.color.bg.muted,
								alignItems: 'center',
								justifyContent: 'center',
								marginBottom: tokens.spacing.gap.lg
							}}>
								<Ionicons name="medical" size={40} color={tokens.color.text.secondary} />
							</View>
							<Text weight="medium" style={{
								fontSize: tokens.font.size.lg,
								color: tokens.color.text.primary,
								marginBottom: tokens.spacing.gap.sm,
								textAlign: 'center'
							}}>
								No Specialists Yet
							</Text>
							<Text style={{
								fontSize: tokens.font.size.body,
								color: tokens.color.text.secondary,
								textAlign: 'center',
								marginBottom: tokens.spacing.gap.lg,
								lineHeight: 24,
								paddingHorizontal: tokens.spacing.gap.lg
							}}>
								Add your first specialist to start managing your healthcare professional network.
							</Text>
							<TouchableOpacity
								onPress={handleAddSpecialist}
								style={{
									backgroundColor: tokens.color.brand.gradient.start,
									borderRadius: tokens.radius.lg,
									paddingHorizontal: tokens.spacing.gap.lg,
									paddingVertical: tokens.spacing.gap.md
								}}
							>
								<Text style={{ color: 'white', fontSize: tokens.font.size.body, fontWeight: '600' }}>
									Add First Specialist
								</Text>
							</TouchableOpacity>
						</View>
					)}

					{/* Specialists List */}
					{specialists.map((specialist) => (
						<TouchableOpacity
							key={specialist.id}
							onPress={() => handleEditSpecialist(specialist)}
							style={{
								backgroundColor: 'white',
								borderRadius: tokens.radius.lg,
								padding: tokens.spacing.gap.lg,
								marginBottom: tokens.spacing.gap.md,
								shadowColor: '#000',
								shadowOffset: { width: 0, height: 2 },
								shadowOpacity: 0.08,
								shadowRadius: 12,
								elevation: 4,
								borderWidth: 1,
								borderColor: tokens.color.border.default
							}}
						>
							{/* Header Row */}
							<View style={{
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								marginBottom: tokens.spacing.gap.sm
							}}>
								<View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
									{/* Profile Avatar */}
									<View style={{
										width: 50,
										height: 50,
										borderRadius: 25,
										backgroundColor: tokens.color.brand.gradient.start + '20',
										alignItems: 'center',
										justifyContent: 'center',
										marginRight: tokens.spacing.gap.md
									}}>
										<Text style={{
											fontSize: tokens.font.size.lg,
											fontWeight: '600',
											color: tokens.color.brand.gradient.start
										}}>
											{specialist.name.charAt(0).toUpperCase()}
										</Text>
									</View>

									{/* Name and Title */}
									<View style={{ flex: 1 }}>
										<Text weight="medium" style={{
											fontSize: tokens.font.size.lg,
											color: tokens.color.text.primary,
											marginBottom: 2
										}}>
											{specialist.name}
										</Text>
										<Text style={{
											fontSize: tokens.font.size.sm,
											color: tokens.color.text.secondary
										}}>
											{specialist.title}
										</Text>
									</View>
								</View>

								{/* Actions Menu */}
								<TouchableOpacity
									onPress={(event) => {
										const { pageY } = event.nativeEvent;
										setDropdownPosition({ top: pageY + 10, right: 20 });
										setDropdownVisible(specialist.id);
									}}
									style={{ padding: tokens.spacing.gap.xs }}
								>
									<Ionicons name="ellipsis-vertical" size={16} color={tokens.color.text.secondary} />
								</TouchableOpacity>
							</View>

							{/* Details - Only show if there's actual content */}
							{(specialist.organization || specialist.email || specialist.phone || 
							  (specialist.specialties && specialist.specialties.length > 0)) && (
								<View style={{
									backgroundColor: tokens.color.bg.muted,
									borderRadius: tokens.radius.lg,
									padding: tokens.spacing.gap.md
								}}>
								{/* Organization */}
								{specialist.organization && (
									<View style={{
										flexDirection: 'row',
										alignItems: 'center',
										marginBottom: tokens.spacing.gap.sm
									}}>
										<Ionicons 
											name="business" 
											size={16} 
											color={tokens.color.brand.gradient.start}
											style={{ marginRight: tokens.spacing.gap.sm }}
										/>
										<Text style={{
											fontSize: tokens.font.size.sm,
											color: tokens.color.text.secondary
										}}>
											{specialist.organization}
										</Text>
									</View>
								)}

								{/* Contact Info */}
								{(specialist.email || specialist.phone) && (
									<View style={{
										flexDirection: 'row',
										alignItems: 'center',
										marginBottom: tokens.spacing.gap.sm
									}}>
										<Ionicons 
											name="call" 
											size={16} 
											color={tokens.color.brand.gradient.start}
											style={{ marginRight: tokens.spacing.gap.sm }}
										/>
										<Text style={{
											fontSize: tokens.font.size.sm,
											color: tokens.color.text.secondary,
											flex: 1
										}}>
											{specialist.phone || specialist.email}
										</Text>
									</View>
								)}

								{/* Specialties */}
								{specialist.specialties && specialist.specialties.length > 0 && (
									<View style={{
										flexDirection: 'row',
										alignItems: 'center'
									}}>
										<Ionicons 
											name="star" 
											size={16} 
											color={tokens.color.brand.gradient.start}
											style={{ marginRight: tokens.spacing.gap.sm }}
										/>
										<Text style={{
											fontSize: tokens.font.size.sm,
											color: tokens.color.text.secondary,
											flex: 1
										}}>
											{specialist.specialties.slice(0, 2).join(', ')}
											{specialist.specialties.length > 2 && ` +${specialist.specialties.length - 2} more`}
										</Text>
									</View>
								)}
							</View>
						)}

						</TouchableOpacity>
					))}

					{/* Add New Specialist Card */}
					{specialists.length > 0 && (
						<TouchableOpacity
							onPress={handleAddSpecialist}
							style={{
								backgroundColor: tokens.color.bg.muted,
								borderRadius: tokens.radius.lg,
								padding: tokens.spacing.gap.xl,
								alignItems: 'center',
								borderWidth: 2,
								borderColor: tokens.color.border.default,
								borderStyle: 'dashed'
							}}
						>
							<Ionicons name="add-circle" size={40} color={tokens.color.brand.gradient.start} />
							<Text weight="medium" style={{
								fontSize: tokens.font.size.body,
								color: tokens.color.brand.gradient.start,
								marginTop: tokens.spacing.gap.sm
							}}>
								Add Another Specialist
							</Text>
						</TouchableOpacity>
					)}
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

			{/* Dropdown Menu Modal */}
			<Modal
				transparent
				visible={dropdownVisible !== null}
				animationType="fade"
				onRequestClose={() => setDropdownVisible(null)}
			>
				<Pressable 
					style={{ flex: 1 }} 
					onPress={() => setDropdownVisible(null)}
				>
					<View style={{
						position: 'absolute',
						top: dropdownPosition.top,
						right: dropdownPosition.right,
						backgroundColor: 'white',
						borderRadius: tokens.radius.lg,
						shadowColor: '#000',
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.25,
						shadowRadius: 8,
						elevation: 5,
						minWidth: 150
					}}>
						<TouchableOpacity
							onPress={() => {
								const specialist = specialists.find(s => s.id === dropdownVisible);
								if (specialist) {
									handleEditSpecialist(specialist);
								}
								setDropdownVisible(null);
							}}
							style={{
								paddingHorizontal: tokens.spacing.gap.md,
								paddingVertical: tokens.spacing.gap.sm,
								borderBottomWidth: 1,
								borderBottomColor: tokens.color.border.default
							}}
						>
							<Text style={{ fontSize: tokens.font.size.body, color: tokens.color.text.primary }}>
								View/Edit
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => {
								const specialist = specialists.find(s => s.id === dropdownVisible);
								if (specialist) {
									handleDeleteSpecialist(specialist);
								}
								setDropdownVisible(null);
							}}
							style={{
								paddingHorizontal: tokens.spacing.gap.md,
								paddingVertical: tokens.spacing.gap.sm
							}}
						>
							<Text style={{ fontSize: tokens.font.size.body, color: '#EF4444' }}>
								Delete
							</Text>
						</TouchableOpacity>
					</View>
				</Pressable>
			</Modal>
		</LinearGradient>
	);
}