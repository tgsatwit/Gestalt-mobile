import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '../navigation/SimpleDrawer';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BottomNavigation } from '../navigation/BottomNavigation';
import { useAuth } from '../contexts/AuthContext';
import { useMemoriesStore } from '../state/useStore';
import { ChildProfile } from '../types/profile';

export default function ChildProfilesListScreen() {
	const { tokens } = useTheme();
	const { openDrawer } = useDrawer();
	const navigation = useNavigation();
	const { getCurrentUserId } = useAuth();
	
	// Use centralized store instead of local state
	const { 
		profiles, 
		profileLoading: loading, 
		profileError: error,
		loadUserProfiles,
		deleteProfile,
		clearProfileError
	} = useMemoriesStore();
	
	const [refreshing, setRefreshing] = useState(false);

	const loadProfiles = async (showRefreshing = false) => {
		const userId = getCurrentUserId();
		if (!userId) {
			console.error('User not authenticated');
			return;
		}

		try {
			if (showRefreshing) {
				setRefreshing(true);
			}
			clearProfileError();
			
			console.log('Loading user profiles from Firebase for user:', userId);
			await loadUserProfiles(userId);
			console.log('✅ User profiles loaded from Firebase');
			
		} catch (err) {
			console.error('Failed to load child profiles:', err);
		} finally {
			setRefreshing(false);
		}
	};

	useEffect(() => {
		loadProfiles();
	}, []);

	// Refresh profiles when screen comes into focus
	useFocusEffect(
		useCallback(() => {
			loadProfiles();
		}, [])
	);

	const handleRefresh = () => {
		loadProfiles(true);
	};

	const handleProfilePress = (profile: ChildProfile) => {
		// Navigate to edit profile screen with profile data
		navigation.navigate('ChildProfile', { profileId: profile.id });
	};

	const handleDeleteProfile = async (profile: ChildProfile) => {
		const userId = getCurrentUserId();
		if (!userId) return;

		Alert.alert(
			'Delete Profile',
			`Are you sure you want to delete ${profile.childName}'s profile? This action cannot be undone.`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							await deleteProfile(profile.id, userId);
							Alert.alert('Success', 'Profile deleted successfully');
						} catch (err) {
							console.error('Failed to delete profile:', err);
							Alert.alert('Error', 'Failed to delete profile. Please try again.');
						}
					}
				}
			]
		);
	};

	const getStageDisplayText = (stage?: number) => {
		if (!stage) return 'Stage not set';
		
		const stages = [
			'Delayed Echolalia/Scripting',
			'Mitigation/Trimming', 
			'Isolation of Units',
			'Recombination',
			'Spontaneous Language',
			'Advanced Language'
		];
		
		return `Stage ${stage}: ${stages[stage - 1] || 'Unknown'}`;
	};

	const getAgeFromBirthDate = (birthDate?: string) => {
		if (!birthDate) return null;
		
		const birth = new Date(birthDate);
		const today = new Date();
		const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
		
		if (ageInMonths < 12) {
			return `${ageInMonths} months`;
		} else {
			const years = Math.floor(ageInMonths / 12);
			const months = ageInMonths % 12;
			return months > 0 ? `${years}y ${months}m` : `${years} years`;
		}
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
					Loading Profiles...
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
							Child Profiles
						</Text>
					</View>
					
					{/* Close Button */}
					<TouchableOpacity
						onPress={() => navigation.navigate('Dashboard')}
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
						</View>
					)}

					{/* Empty State */}
					{profiles.length === 0 && !loading && (
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
								<Ionicons name="person-add" size={40} color={tokens.color.text.secondary} />
							</View>
							<Text weight="medium" style={{
								fontSize: tokens.font.size.lg,
								color: tokens.color.text.primary,
								marginBottom: tokens.spacing.gap.sm,
								textAlign: 'center'
							}}>
								No Child Profiles Yet
							</Text>
							<Text style={{
								fontSize: tokens.font.size.body,
								color: tokens.color.text.secondary,
								textAlign: 'center',
								marginBottom: tokens.spacing.gap.lg,
								lineHeight: 24
							}}>
								Create your first child profile to start tracking progress and get personalized coaching.
							</Text>
							<TouchableOpacity
								onPress={() => navigation.navigate('ChildProfile')}
								style={{
									backgroundColor: tokens.color.brand.gradient.start,
									borderRadius: tokens.radius.lg,
									paddingHorizontal: tokens.spacing.gap.lg,
									paddingVertical: tokens.spacing.gap.md
								}}
							>
								<Text style={{ color: 'white', fontSize: tokens.font.size.body, fontWeight: '600' }}>
									Create Profile
								</Text>
							</TouchableOpacity>
						</View>
					)}

					{/* Profiles List */}
					{profiles.map((profile) => (
						<TouchableOpacity
							key={profile.id}
							onPress={() => handleProfilePress(profile)}
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
											{profile.childName.charAt(0).toUpperCase()}
										</Text>
									</View>

									{/* Name and Age */}
									<View style={{ flex: 1 }}>
										<Text weight="medium" style={{
											fontSize: tokens.font.size.lg,
											color: tokens.color.text.primary,
											marginBottom: 2
										}}>
											{profile.childName}
										</Text>
										{profile.birthDate && (
											<Text style={{
												fontSize: tokens.font.size.sm,
												color: tokens.color.text.secondary
											}}>
												Age: {getAgeFromBirthDate(profile.birthDate)}
											</Text>
										)}
									</View>
								</View>

								{/* Actions Menu */}
								<TouchableOpacity
									onPress={() => {
										Alert.alert(
											'Profile Actions',
											`What would you like to do with ${profile.childName}'s profile?`,
											[
												{ text: 'Cancel', style: 'cancel' },
												{ text: 'Edit', onPress: () => handleProfilePress(profile) },
												{ text: 'Delete', style: 'destructive', onPress: () => handleDeleteProfile(profile) }
											]
										);
									}}
									style={{ padding: tokens.spacing.gap.xs }}
								>
									<Ionicons name="ellipsis-vertical" size={16} color={tokens.color.text.secondary} />
								</TouchableOpacity>
							</View>

							{/* Profile Details */}
							<View style={{
								backgroundColor: tokens.color.bg.muted,
								borderRadius: tokens.radius.lg,
								padding: tokens.spacing.gap.md
							}}>
								{/* GLP Stage */}
								<View style={{
									flexDirection: 'row',
									alignItems: 'center',
									marginBottom: tokens.spacing.gap.sm
								}}>
									<Ionicons 
										name="analytics" 
										size={16} 
										color={tokens.color.brand.gradient.start}
										style={{ marginRight: tokens.spacing.gap.sm }}
									/>
									<Text style={{
										fontSize: tokens.font.size.sm,
										color: tokens.color.text.secondary
									}}>
										{getStageDisplayText(profile.currentStage)}
									</Text>
								</View>

								{/* Interests */}
								{profile.interests && profile.interests.length > 0 && (
									<View style={{
										flexDirection: 'row',
										alignItems: 'center',
										marginBottom: tokens.spacing.gap.sm
									}}>
										<Ionicons 
											name="heart" 
											size={16} 
											color={tokens.color.brand.gradient.start}
											style={{ marginRight: tokens.spacing.gap.sm }}
										/>
										<Text style={{
											fontSize: tokens.font.size.sm,
											color: tokens.color.text.secondary,
											flex: 1
										}}>
											Interests: {profile.interests.slice(0, 3).join(', ')}
											{profile.interests.length > 3 && ` +${profile.interests.length - 3} more`}
										</Text>
									</View>
								)}

								{/* Last Updated */}
								<View style={{
									flexDirection: 'row',
									alignItems: 'center'
								}}>
									<Ionicons 
										name="time" 
										size={16} 
										color={tokens.color.text.secondary}
										style={{ marginRight: tokens.spacing.gap.sm }}
									/>
									<Text style={{
										fontSize: tokens.font.size.xs,
										color: tokens.color.text.secondary
									}}>
										Updated {profile.updatedAt.toLocaleDateString()}
									</Text>
								</View>
							</View>

							{/* Quick Actions */}
							<View style={{
								flexDirection: 'row',
								justifyContent: 'flex-end',
								marginTop: tokens.spacing.gap.md,
								gap: tokens.spacing.gap.sm
							}}>
								<TouchableOpacity
									onPress={() => {
										// Navigate to memories with this profile selected
										// This will require updating the memories store
										navigation.navigate('Memories');
									}}
									style={{
										backgroundColor: tokens.color.brand.gradient.start + '20',
										borderRadius: tokens.radius.lg,
										paddingHorizontal: tokens.spacing.gap.md,
										paddingVertical: tokens.spacing.gap.sm
									}}
								>
									<Text style={{
										fontSize: tokens.font.size.sm,
										color: tokens.color.brand.gradient.start,
										fontWeight: '500'
									}}>
										View Memories
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									onPress={() => handleProfilePress(profile)}
									style={{
										backgroundColor: tokens.color.brand.gradient.start,
										borderRadius: tokens.radius.lg,
										paddingHorizontal: tokens.spacing.gap.md,
										paddingVertical: tokens.spacing.gap.sm
									}}
								>
									<Text style={{
										fontSize: tokens.font.size.sm,
										color: 'white',
										fontWeight: '500'
									}}>
										Edit Profile
									</Text>
								</TouchableOpacity>
							</View>
						</TouchableOpacity>
					))}

					{/* Add New Profile Card */}
					{profiles.length > 0 && (
						<TouchableOpacity
							onPress={() => navigation.navigate('ChildProfile')}
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
								Add Another Child Profile
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
		</LinearGradient>
	);
}