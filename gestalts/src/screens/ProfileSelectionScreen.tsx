import React, { useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '../navigation/SimpleDrawer';
import { GradientButton } from '../components/GradientButton';
import { useMemoriesStore } from '../state/useStore';
import { useNavigation } from '@react-navigation/native';
import { BottomNavigation } from '../navigation/BottomNavigation';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileSelectionScreen() {
	const { tokens } = useTheme();
	const { openDrawer } = useDrawer();
	const navigation = useNavigation();
	const { getCurrentUserId } = useAuth();
	const { 
		profiles, 
		currentProfile,
		profileLoading, 
		profileError,
		loadUserProfiles,
		setCurrentProfile,
		deleteProfile,
		clearProfileError
	} = useMemoriesStore();

	// Load profiles when component mounts
	useEffect(() => {
		const userId = getCurrentUserId();
		if (userId) {
			loadUserProfiles(userId);
		}
	}, [getCurrentUserId, loadUserProfiles]);

	// Clear errors when component mounts
	useEffect(() => {
		clearProfileError();
	}, [clearProfileError]);

	const handleSelectProfile = (profile: any) => {
		setCurrentProfile(profile);
		Alert.alert('Success', `Switched to ${profile.childName}'s profile`, [
			{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }
		]);
	};

	const handleEditProfile = (profile: any) => {
		setCurrentProfile(profile);
		navigation.navigate('ChildProfile');
	};

	const handleDeleteProfile = (profile: any) => {
		Alert.alert(
			'Delete Profile',
			`Are you sure you want to delete ${profile.childName}'s profile? This action cannot be undone.`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						const userId = getCurrentUserId();
						if (userId) {
							try {
								await deleteProfile(profile.id, userId);
								Alert.alert('Success', 'Profile deleted successfully');
							} catch (error) {
								Alert.alert('Error', 'Failed to delete profile');
							}
						}
					}
				}
			]
		);
	};

	const handleCreateNewProfile = () => {
		setCurrentProfile(null);
		navigation.navigate('ChildProfile');
	};

	if (profileLoading) {
		return (
			<LinearGradient
				colors={['#7C3AED', '#EC4899', '#FB923C']}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={{ flex: 1 }}
			>
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
					<ActivityIndicator size="large" color="white" />
					<Text style={{ color: 'white', marginTop: tokens.spacing.gap.md }}>
						Loading profiles...
					</Text>
				</View>
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
					{/* Left Side: Menu + Title */}
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.gap.md, flex: 1 }}>
						<TouchableOpacity onPress={openDrawer}>
							<Ionicons name="menu" size={24} color="white" />
						</TouchableOpacity>
						<Text style={{ color: 'white', fontSize: tokens.font.size.h3, fontWeight: '600' }}>
							Select Profile
						</Text>
					</View>
					
					{/* Right Side Controls */}
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.gap.sm }}>
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
			</View>

			{/* Content Container */}
			<View style={{ 
				flex: 1, 
				backgroundColor: 'white', 
				borderTopLeftRadius: 24, 
				borderTopRightRadius: 24
			}}>
				<ScrollView contentContainerStyle={{ padding: tokens.spacing.containerX, paddingBottom: 120 }}>
					{/* Error Display */}
					{profileError && (
						<View style={{
							backgroundColor: '#FEE2E2',
							borderColor: '#EF4444',
							borderWidth: 1,
							borderRadius: tokens.radius.lg,
							padding: tokens.spacing.gap.md,
							marginBottom: tokens.spacing.gap.md
						}}>
							<Text style={{ color: '#EF4444', textAlign: 'center' }}>
								{profileError}
							</Text>
						</View>
					)}

					{/* Current Profile */}
					{currentProfile && (
						<View style={{ marginBottom: tokens.spacing.gap.lg }}>
							<Text weight="medium" style={{ 
								fontSize: tokens.font.size.sm,
								color: tokens.color.text.secondary,
								marginBottom: tokens.spacing.gap.sm 
							}}>
								Current Profile
							</Text>
							<View style={{
								backgroundColor: tokens.color.brand.gradient.start + '20',
								borderColor: tokens.color.brand.gradient.start,
								borderWidth: 2,
								borderRadius: tokens.radius.lg,
								padding: tokens.spacing.gap.md,
								marginBottom: tokens.spacing.gap.md
							}}>
								<Text weight="medium" style={{ color: tokens.color.brand.gradient.start, marginBottom: 4 }}>
									{currentProfile.childName}
								</Text>
								<Text color="secondary" style={{ fontSize: tokens.font.size.sm }}>
									Stage {currentProfile.currentStage || 1} • Created {new Date(currentProfile.createdAt).toLocaleDateString()}
								</Text>
							</View>
						</View>
					)}

					{/* Available Profiles */}
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						All Profiles ({profiles.length})
					</Text>

					{profiles.length === 0 ? (
						<View style={{
							backgroundColor: tokens.color.surface,
							borderRadius: tokens.radius.lg,
							padding: tokens.spacing.gap.xl,
							alignItems: 'center',
							marginBottom: tokens.spacing.gap.lg
						}}>
							<Ionicons name="person-add-outline" size={48} color={tokens.color.text.secondary} />
							<Text weight="medium" style={{ marginTop: tokens.spacing.gap.md, textAlign: 'center' }}>
								No profiles found
							</Text>
							<Text color="secondary" style={{ textAlign: 'center', marginTop: tokens.spacing.gap.xs }}>
								Create your first child profile to get started
							</Text>
						</View>
					) : (
						profiles.map((profile) => (
							<TouchableOpacity
								key={profile.id}
								onPress={() => handleSelectProfile(profile)}
								style={{
									backgroundColor: currentProfile?.id === profile.id 
										? tokens.color.brand.gradient.start + '10' 
										: tokens.color.surface,
									borderColor: currentProfile?.id === profile.id 
										? tokens.color.brand.gradient.start 
										: tokens.color.border.default,
									borderWidth: 1,
									borderRadius: tokens.radius.lg,
									padding: tokens.spacing.gap.md,
									marginBottom: tokens.spacing.gap.sm,
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'space-between'
								}}
							>
								<View style={{ flex: 1 }}>
									<Text weight="medium" style={{
										color: currentProfile?.id === profile.id 
											? tokens.color.brand.gradient.start 
											: tokens.color.text.primary,
										marginBottom: 2
									}}>
										{profile.childName}
									</Text>
									<Text color="secondary" style={{ fontSize: tokens.font.size.sm }}>
										Stage {profile.currentStage || 1} • {profile.parentName || 'No parent name'}
									</Text>
									<Text color="secondary" style={{ fontSize: tokens.font.size.xs, marginTop: 2 }}>
										Created {new Date(profile.createdAt).toLocaleDateString()}
									</Text>
								</View>

								<View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.gap.sm }}>
									<TouchableOpacity
										onPress={() => handleEditProfile(profile)}
										style={{ padding: tokens.spacing.gap.xs }}
									>
										<Ionicons name="pencil" size={18} color={tokens.color.text.secondary} />
									</TouchableOpacity>
									<TouchableOpacity
										onPress={() => handleDeleteProfile(profile)}
										style={{ padding: tokens.spacing.gap.xs }}
									>
										<Ionicons name="trash-outline" size={18} color="#EF4444" />
									</TouchableOpacity>
									{currentProfile?.id === profile.id && (
										<Ionicons name="checkmark-circle" size={24} color={tokens.color.brand.gradient.start} />
									)}
								</View>
							</TouchableOpacity>
						))
					)}

					{/* Create New Profile Button */}
					<GradientButton 
						title="Create New Profile" 
						onPress={handleCreateNewProfile}
						style={{ marginTop: tokens.spacing.gap.lg }}
					/>
				</ScrollView>
			</View>

			<BottomNavigation />
		</LinearGradient>
	);
}