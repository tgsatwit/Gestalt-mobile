import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Alert, Switch, ActivityIndicator } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '../navigation/SimpleDrawer';
import { GradientButton } from '../components/GradientButton';
import { useNavigation } from '@react-navigation/native';
import { BottomNavigation } from '../navigation/BottomNavigation';
import { useAuth } from '../contexts/AuthContext';
// Use Firebase-enabled service to save to 'users' collection
import userProfileService from '../services/userProfileServiceFirebase';
import { UserProfile, CreateUserProfileData, UpdateUserProfileData } from '../types/userProfile';

export default function UserProfileScreen() {
	const { tokens } = useTheme();
	const { openDrawer } = useDrawer();
	const navigation = useNavigation();
	const { getCurrentUserId, user, updateUserName } = useAuth();
	
	// Profile data state
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	
	// Form state
	const [name, setName] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [email, setEmail] = useState('');
	const [phoneNumber, setPhoneNumber] = useState('');
	
	// Notification preferences
	const [emailNotifications, setEmailNotifications] = useState(true);
	const [pushNotifications, setPushNotifications] = useState(true);
	const [reminderNotifications, setReminderNotifications] = useState(true);
	const [weeklyReports, setWeeklyReports] = useState(true);
	
	// Coaching preferences
	const [interactionStyle, setInteractionStyle] = useState<'supportive' | 'direct' | 'conversational'>('supportive');
	const [reminderFrequency, setReminderFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'none'>('weekly');
	const [reportFormat, setReportFormat] = useState<'detailed' | 'summary' | 'visual'>('detailed');
	
	// Privacy settings
	const [profileVisibility, setProfileVisibility] = useState<'private' | 'contacts' | 'public'>('private');
	
	useEffect(() => {
		loadUserProfile();
	}, []);

	const loadUserProfile = async () => {
		const userId = getCurrentUserId();
		if (!userId) {
			setError('User not authenticated');
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);
			
			const profile = await userProfileService.getProfile(userId);
			
			if (profile) {
				setUserProfile(profile);
				populateFormFromProfile(profile);
			} else {
				// Create default profile if none exists
				await createDefaultProfile(userId);
			}
		} catch (err) {
			console.error('Failed to load user profile:', err);
			setError('Failed to load profile');
		} finally {
			setLoading(false);
		}
	};

	const createDefaultProfile = async (userId: string) => {
		try {
			const defaultData: CreateUserProfileData = {
				name: user?.name || 'User',
				email: user?.email,
			};

			await userProfileService.createProfile(userId, defaultData);
			await loadUserProfile(); // Reload after creation
		} catch (err) {
			console.error('Failed to create default profile:', err);
			setError('Failed to create profile');
		}
	};

	const populateFormFromProfile = (profile: UserProfile) => {
		setName(profile.name || '');
		setFirstName(profile.firstName || '');
		setLastName(profile.lastName || '');
		setEmail(profile.email || '');
		setPhoneNumber(profile.phoneNumber || '');
		setEmailNotifications(profile.emailNotifications ?? true);
		setPushNotifications(profile.pushNotifications ?? true);
		setReminderNotifications(profile.reminderNotifications ?? true);
		setWeeklyReports(profile.weeklyReports ?? true);
		setInteractionStyle(profile.preferredInteractionStyle || 'supportive');
		setReminderFrequency(profile.reminderFrequency || 'weekly');
		setReportFormat(profile.reportFormat || 'detailed');
		setProfileVisibility(profile.profileVisibility || 'private');
	};

	const handleSave = async () => {
		const userId = getCurrentUserId();
		if (!userId) {
			Alert.alert('Error', 'User not authenticated');
			return;
		}

		if (!name.trim()) {
			Alert.alert('Validation Error', 'Please enter your name');
			return;
		}

		setSaving(true);
		setError(null);

		try {
			const updates: UpdateUserProfileData = {
				name: name.trim(),
				firstName: firstName.trim(), // Send empty string if empty
				lastName: lastName.trim(), // Send empty string if empty
				email: email.trim(),
				phoneNumber: phoneNumber.trim(),
				emailNotifications,
				pushNotifications,
				reminderNotifications,
				weeklyReports,
				preferredInteractionStyle: interactionStyle,
				reminderFrequency,
				reportFormat,
				profileVisibility
			};

			await userProfileService.updateProfile(userId, updates);
			
			// Reload profile to update auth context with fresh data
			// This ensures the local user object stays in sync with Firestore

			Alert.alert('Success', 'Profile updated successfully!');
			await loadUserProfile(); // Reload to get fresh data
		} catch (err) {
			console.error('Save profile error:', err);
			setError('Failed to save profile');
			Alert.alert('Error', 'Failed to save profile. Please try again.');
		} finally {
			setSaving(false);
		}
	};

	const handlePasswordReset = () => {
		Alert.alert(
			'Password Reset',
			'Password reset functionality will be implemented with full authentication system.',
			[{ text: 'OK' }]
		);
	};

	const handleDataExport = async () => {
		const userId = getCurrentUserId();
		if (!userId) return;

		try {
			await userProfileService.requestDataExport(userId);
			Alert.alert(
				'Data Export Requested',
				'Your data export has been requested. You will receive an email with your data within 24-48 hours.',
				[{ text: 'OK' }]
			);
		} catch (err) {
			Alert.alert('Error', 'Failed to request data export. Please try again.');
		}
	};

	const handleAccountDeletion = async () => {
		Alert.alert(
			'Delete Account',
			'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						const userId = getCurrentUserId();
						if (!userId) return;

						try {
							await userProfileService.markForDeletion(userId);
							Alert.alert(
								'Account Deletion Scheduled',
								'Your account has been marked for deletion. It will be permanently deleted within 30 days. Contact support if you change your mind.',
								[{ text: 'OK' }]
							);
						} catch (err) {
							Alert.alert('Error', 'Failed to schedule account deletion. Please try again.');
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
				<Text style={{ color: 'white', marginTop: tokens.spacing.gap.md }}>Loading Profile...</Text>
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
							Profile Settings
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

					{/* Account Information */}
					<View style={{ marginBottom: tokens.spacing.gap.lg }}>
						<Text weight="medium" style={{ 
							fontSize: tokens.font.size.lg,
							color: tokens.color.text.primary,
							marginBottom: tokens.spacing.gap.md 
						}}>
							Account Information
						</Text>

						<View style={{ marginBottom: tokens.spacing.gap.md }}>
							<Text style={{ 
								fontSize: tokens.font.size.sm,
								color: tokens.color.text.secondary,
								marginBottom: tokens.spacing.gap.xs 
							}}>
								Display Name
							</Text>
							<TextInput
								placeholder="Enter your display name"
								value={name}
								onChangeText={setName}
								style={{
									borderColor: tokens.color.border.default,
									borderWidth: 1,
									borderRadius: tokens.radius.lg,
									padding: tokens.spacing.gap.md,
									fontSize: tokens.font.size.body
								}}
							/>
						</View>

						<View style={{ flexDirection: 'row', gap: tokens.spacing.gap.sm, marginBottom: tokens.spacing.gap.md }}>
							<View style={{ flex: 1 }}>
								<Text style={{ 
									fontSize: tokens.font.size.sm,
									color: tokens.color.text.secondary,
									marginBottom: tokens.spacing.gap.xs 
								}}>
									First Name
								</Text>
								<TextInput
									placeholder="First name"
									value={firstName}
									onChangeText={setFirstName}
									style={{
										borderColor: tokens.color.border.default,
										borderWidth: 1,
										borderRadius: tokens.radius.lg,
										padding: tokens.spacing.gap.md,
										fontSize: tokens.font.size.body
									}}
								/>
							</View>
							<View style={{ flex: 1 }}>
								<Text style={{ 
									fontSize: tokens.font.size.sm,
									color: tokens.color.text.secondary,
									marginBottom: tokens.spacing.gap.xs 
								}}>
									Last Name
								</Text>
								<TextInput
									placeholder="Last name"
									value={lastName}
									onChangeText={setLastName}
									style={{
										borderColor: tokens.color.border.default,
										borderWidth: 1,
										borderRadius: tokens.radius.lg,
										padding: tokens.spacing.gap.md,
										fontSize: tokens.font.size.body
									}}
								/>
							</View>
						</View>

						<View style={{ marginBottom: tokens.spacing.gap.md }}>
							<Text style={{ 
								fontSize: tokens.font.size.sm,
								color: tokens.color.text.secondary,
								marginBottom: tokens.spacing.gap.xs 
							}}>
								Email Address
							</Text>
							<TextInput
								placeholder="your.email@example.com"
								value={email}
								onChangeText={setEmail}
								keyboardType="email-address"
								autoCapitalize="none"
								style={{
									borderColor: tokens.color.border.default,
									borderWidth: 1,
									borderRadius: tokens.radius.lg,
									padding: tokens.spacing.gap.md,
									fontSize: tokens.font.size.body
								}}
							/>
						</View>

					</View>

					{/* Notification Settings */}
					<View style={{ marginBottom: tokens.spacing.gap.lg }}>
						<Text weight="medium" style={{ 
							fontSize: tokens.font.size.lg,
							color: tokens.color.text.primary,
							marginBottom: tokens.spacing.gap.md 
						}}>
							Notification Preferences
						</Text>

						{[
							{ label: 'Email Notifications', value: emailNotifications, setter: setEmailNotifications },
							{ label: 'Push Notifications', value: pushNotifications, setter: setPushNotifications },
							{ label: 'Reminder Notifications', value: reminderNotifications, setter: setReminderNotifications },
							{ label: 'Weekly Reports', value: weeklyReports, setter: setWeeklyReports }
						].map((setting, index) => (
							<View key={index} style={{
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								paddingVertical: tokens.spacing.gap.md,
								borderBottomWidth: index < 3 ? 1 : 0,
								borderBottomColor: tokens.color.border.default
							}}>
								<Text style={{ fontSize: tokens.font.size.body }}>
									{setting.label}
								</Text>
								<Switch
									value={setting.value}
									onValueChange={setting.setter}
									trackColor={{ false: tokens.color.bg.muted, true: tokens.color.brand.gradient.start + '60' }}
									thumbColor={setting.value ? tokens.color.brand.gradient.start : '#f4f3f4'}
								/>
							</View>
						))}
					</View>


					{/* Account Management */}
					<View style={{ marginBottom: tokens.spacing.gap.lg }}>
						<Text weight="medium" style={{ 
							fontSize: tokens.font.size.lg,
							color: tokens.color.text.primary,
							marginBottom: tokens.spacing.gap.md 
						}}>
							Account Management
						</Text>

						{/* Subscription Status */}
						<View style={{
							backgroundColor: tokens.color.bg.muted,
							borderRadius: tokens.radius.lg,
							padding: tokens.spacing.gap.md,
							marginBottom: tokens.spacing.gap.md
						}}>
							<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
								<View>
									<Text weight="medium" style={{ fontSize: tokens.font.size.body }}>
										Subscription Status
									</Text>
									<Text style={{ 
										fontSize: tokens.font.size.sm, 
										color: tokens.color.text.secondary,
										textTransform: 'capitalize'
									}}>
										{userProfile?.subscriptionStatus || 'Free'}
									</Text>
								</View>
								<TouchableOpacity style={{
									backgroundColor: tokens.color.brand.gradient.start,
									paddingHorizontal: tokens.spacing.gap.md,
									paddingVertical: tokens.spacing.gap.sm,
									borderRadius: tokens.radius.lg
								}}>
									<Text style={{ color: 'white', fontSize: tokens.font.size.sm }}>
										Upgrade
									</Text>
								</TouchableOpacity>
							</View>
						</View>

						{/* Management Actions */}
						{[
							{ icon: 'key', label: 'Change Password', action: handlePasswordReset },
							{ icon: 'download', label: 'Export Data', action: handleDataExport },
							{ icon: 'trash', label: 'Delete Account', action: handleAccountDeletion, destructive: true }
						].map((item, index) => (
							<TouchableOpacity
								key={index}
								onPress={item.action}
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									paddingVertical: tokens.spacing.gap.md,
									borderBottomWidth: index < 2 ? 1 : 0,
									borderBottomColor: tokens.color.border.default
								}}
							>
								<Ionicons 
									name={item.icon as any} 
									size={20} 
									color={item.destructive ? '#EF4444' : tokens.color.text.secondary}
									style={{ marginRight: tokens.spacing.gap.md }}
								/>
								<Text style={{ 
									fontSize: tokens.font.size.body,
									color: item.destructive ? '#EF4444' : tokens.color.text.primary,
									flex: 1
								}}>
									{item.label}
								</Text>
								<Ionicons name="chevron-forward" size={16} color={tokens.color.text.secondary} />
							</TouchableOpacity>
						))}
					</View>

					{/* Save Button */}
					<GradientButton 
						title={saving ? 'Saving...' : 'Save Changes'}
						onPress={handleSave}
						disabled={saving}
					/>

					{/* Profile Info */}
					{userProfile && (
						<View style={{
							marginTop: tokens.spacing.gap.lg,
							padding: tokens.spacing.gap.md,
							backgroundColor: tokens.color.bg.muted,
							borderRadius: tokens.radius.lg
						}}>
							<Text style={{ 
								fontSize: tokens.font.size.xs,
								color: tokens.color.text.secondary,
								textAlign: 'center'
							}}>
								Account created: {userProfile.accountCreatedDate?.toLocaleDateString()}
							</Text>
						</View>
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