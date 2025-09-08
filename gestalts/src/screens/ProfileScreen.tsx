import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, TextInput, View, TouchableOpacity, Alert } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '../navigation/SimpleDrawer';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { BottomNavigation } from '../navigation/BottomNavigation';
import { useAuth } from '../contexts/AuthContext';
import { useMemoriesStore } from '../state/useStore';

type ProfileTab = 'details' | 'notifications' | 'account';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export default function ProfileScreen() {
	const { tokens } = useTheme();
	const { openDrawer } = useDrawer();
	const { user, signOut } = useAuth();
	const navigation = useNavigation<NavigationProp>();
	const { userProfile, updateUserProfile } = useMemoriesStore();
	const [activeTab, setActiveTab] = useState<ProfileTab>('details');
	const [showLeftArrow, setShowLeftArrow] = useState(false);
	const [showRightArrow, setShowRightArrow] = useState(true);
	const scrollViewRef = useRef<any>(null);
	
	// Form state
	const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
	const [firstName, setFirstName] = useState(userProfile?.firstName || '');
	const [lastName, setLastName] = useState(userProfile?.lastName || '');
	const [email, setEmail] = useState(userProfile?.email || user?.email || '');
	
	// Load user profile data on mount
	useEffect(() => {
		if (userProfile) {
			setDisplayName(userProfile.displayName || '');
			setFirstName(userProfile.firstName || '');
			setLastName(userProfile.lastName || '');
			setEmail(userProfile.email || user?.email || '');
		} else if (user) {
			// Initialize from auth user if no profile exists
			setDisplayName(user.displayName || '');
			setEmail(user.email || '');
		}
	}, [userProfile, user]);

	const handleSignOut = () => {
		Alert.alert(
			'Sign Out',
			'Are you sure you want to sign out?',
			[
				{
					text: 'Cancel',
					style: 'cancel'
				},
				{
					text: 'Sign Out',
					style: 'destructive',
					onPress: async () => {
						try {
							await signOut();
						} catch (error) {
							console.error('Sign out error:', error);
							Alert.alert('Error', 'Failed to sign out. Please try again.');
						}
					}
				}
			]
		);
	};
	
	const handleSaveChanges = () => {
		try {
			updateUserProfile({
				displayName: displayName.trim() || undefined,
				firstName: firstName.trim() || undefined,
				lastName: lastName.trim() || undefined,
				email: email.trim() || undefined
			});
			
			Alert.alert('Success', 'Profile updated successfully!');
		} catch (error) {
			console.error('Failed to update profile:', error);
			Alert.alert('Error', 'Failed to update profile. Please try again.');
		}
	};

	const tabs = [
		{ key: 'details', label: 'Details', icon: 'person-outline' },
		{ key: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
		{ key: 'account', label: 'Account Management', icon: 'settings-outline' }
	] as const;

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
							Profile
						</Text>
					</View>
					
					{/* Right Side Controls */}
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

			{/* Content Container with curved top */}
			<View style={{ 
				flex: 1, 
				backgroundColor: 'white', 
				borderTopLeftRadius: 24, 
				borderTopRightRadius: 24
			}}>
				<ScrollView 
					style={{ flex: 1 }}
					contentContainerStyle={{ paddingBottom: 100 }}
					showsVerticalScrollIndicator={false}
				>
					{/* Tab Navigation */}
					<View style={{
						paddingTop: 24,
						paddingHorizontal: tokens.spacing.containerX
					}}>
					<ScrollView 
						ref={scrollViewRef}
						horizontal 
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{ gap: 6, marginBottom: tokens.spacing.gap.lg, paddingLeft: 4, paddingRight: 40 }}
						onScroll={(event) => {
							const scrollX = event.nativeEvent.contentOffset.x;
							const contentWidth = event.nativeEvent.contentSize.width;
							const scrollViewWidth = event.nativeEvent.layoutMeasurement.width;
							
							setShowLeftArrow(scrollX > 10);
							setShowRightArrow(scrollX < contentWidth - scrollViewWidth - 10);
						}}
						scrollEventThrottle={16}
					>
						{tabs.map((tab) => (
							<TouchableOpacity
								key={tab.key}
								onPress={() => setActiveTab(tab.key)}
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									gap: 8,
									paddingHorizontal: 12,
									paddingVertical: 12,
									borderRadius: tokens.radius.pill,
									backgroundColor: activeTab === tab.key ? tokens.color.brand.gradient.start + '15' : tokens.color.bg.muted,
									borderWidth: 1,
									borderColor: activeTab === tab.key ? tokens.color.brand.gradient.start + '30' : tokens.color.border.default
								}}
							>
								<Ionicons 
									name={tab.icon as any} 
									size={16} 
									color={activeTab === tab.key ? tokens.color.brand.gradient.start : tokens.color.text.secondary} 
								/>
								<Text style={{
									fontSize: tokens.font.size.small,
									fontWeight: activeTab === tab.key ? '600' : '500',
									color: activeTab === tab.key ? tokens.color.brand.gradient.start : tokens.color.text.secondary
								}}>{tab.label}</Text>
							</TouchableOpacity>
						))}
					</ScrollView>

					{/* Left Scroll Indicator */}
					{showLeftArrow && (
						<View style={{
							position: 'absolute',
							left: 0,
							top: 24,
							height: 44,
							width: 60,
							zIndex: 10
						}}>
							{/* White gradient overlay */}
							<LinearGradient
								colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0)']}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									right: 0,
									bottom: 0
								}}
							/>
							
							{/* Rounded arrow button */}
							<TouchableOpacity
								onPress={() => {
									scrollViewRef.current?.scrollTo({ x: 0, animated: true });
								}}
								style={{
									position: 'absolute',
									left: tokens.spacing.containerX,
									top: 12,
									width: 32,
									height: 32,
									borderRadius: 16,
									backgroundColor: 'white',
									alignItems: 'center',
									justifyContent: 'center',
									shadowColor: '#000',
									shadowOffset: { width: 0, height: 2 },
									shadowOpacity: 0.15,
									shadowRadius: 8,
									elevation: 4,
									borderWidth: 1,
									borderColor: 'rgba(0,0,0,0.08)'
								}}
							>
								<Ionicons name="chevron-back" size={16} color={tokens.color.brand.gradient.start} />
							</TouchableOpacity>
						</View>
					)}

					{/* Right Scroll Indicator */}
					{showRightArrow && (
						<View style={{
							position: 'absolute',
							right: 0,
							top: 24,
							height: 44,
							width: 60,
							zIndex: 10
						}}>
							{/* White gradient overlay */}
							<LinearGradient
								colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,1)']}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									right: 0,
									bottom: 0
								}}
							/>
							
							{/* Rounded arrow button */}
							<TouchableOpacity
								onPress={() => {
									scrollViewRef.current?.scrollToEnd({ animated: true });
								}}
								style={{
									position: 'absolute',
									right: tokens.spacing.containerX,
									top: 12,
									width: 32,
									height: 32,
									borderRadius: 16,
									backgroundColor: 'white',
									alignItems: 'center',
									justifyContent: 'center',
									shadowColor: '#000',
									shadowOffset: { width: 0, height: 2 },
									shadowOpacity: 0.15,
									shadowRadius: 8,
									elevation: 4,
									borderWidth: 1,
									borderColor: 'rgba(0,0,0,0.08)'
								}}
							>
								<Ionicons name="chevron-forward" size={16} color={tokens.color.brand.gradient.start} />
							</TouchableOpacity>
						</View>
					)}

					{/* Content based on active tab */}
					{activeTab === 'details' && (
						<View style={{ paddingHorizontal: tokens.spacing.containerX }}>
							<Text style={{
								fontSize: tokens.font.size.lg,
								fontWeight: '600',
								color: tokens.color.text.primary,
								marginBottom: tokens.spacing.gap.lg
							}}>
								Profile Details
							</Text>

							{/* Display Name */}
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
									value={displayName}
									onChangeText={setDisplayName}
									style={{
										borderColor: tokens.color.border.default,
										borderWidth: 1,
										borderRadius: tokens.radius.lg,
										padding: tokens.spacing.gap.md,
										fontSize: tokens.font.size.body
									}}
								/>
							</View>

							{/* First and Last Name Row */}
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

							{/* Email Address */}
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
									keyboardType="email-address"
									autoCapitalize="none"
									value={email}
									onChangeText={setEmail}
									style={{
										borderColor: tokens.color.border.default,
										borderWidth: 1,
										borderRadius: tokens.radius.lg,
										padding: tokens.spacing.gap.md,
										fontSize: tokens.font.size.body
									}}
								/>
							</View>

							{/* Save Button */}
							<TouchableOpacity
								onPress={handleSaveChanges}
								style={{
									backgroundColor: tokens.color.brand.gradient.start,
									paddingVertical: tokens.spacing.gap.md,
									borderRadius: tokens.radius.lg,
									alignItems: 'center',
									marginTop: tokens.spacing.gap.md
								}}
							>
								<Text style={{
									color: 'white',
									fontSize: tokens.font.size.body,
									fontWeight: '600'
								}}>
									Save Changes
								</Text>
							</TouchableOpacity>
						</View>
					)}

					{activeTab === 'notifications' && (
						<View style={{ paddingHorizontal: tokens.spacing.containerX }}>
							<Text style={{
								fontSize: tokens.font.size.lg,
								fontWeight: '600',
								color: tokens.color.text.primary,
								marginBottom: tokens.spacing.gap.lg
							}}>
								Notification Preferences
							</Text>

							{/* Notification Settings */}
							{[
								{ label: 'Email Notifications', description: 'Receive updates via email' },
								{ label: 'Push Notifications', description: 'Get notified on your device' },
								{ label: 'Reminder Notifications', description: 'Helpful reminders about entries' },
								{ label: 'Weekly Reports', description: 'Weekly summary of activities' }
							].map((setting, index) => (
								<View key={index} style={{
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'space-between',
									paddingVertical: tokens.spacing.gap.md,
									borderBottomWidth: index < 3 ? 1 : 0,
									borderBottomColor: tokens.color.border.default
								}}>
									<View style={{ flex: 1 }}>
										<Text style={{ 
											fontSize: tokens.font.size.body,
											fontWeight: '500',
											color: tokens.color.text.primary,
											marginBottom: 2
										}}>
											{setting.label}
										</Text>
										<Text style={{ 
											fontSize: tokens.font.size.sm,
											color: tokens.color.text.secondary
										}}>
											{setting.description}
										</Text>
									</View>
									<View style={{
										width: 44,
										height: 24,
										borderRadius: 12,
										backgroundColor: tokens.color.bg.muted,
										marginLeft: tokens.spacing.gap.md
									}} />
								</View>
							))}
						</View>
					)}

					{activeTab === 'account' && (
						<View style={{ paddingHorizontal: tokens.spacing.containerX }}>
							<Text style={{
								fontSize: tokens.font.size.lg,
								fontWeight: '600',
								color: tokens.color.text.primary,
								marginBottom: tokens.spacing.gap.lg
							}}>
								Account Management
							</Text>

							{/* Subscription Status */}
							<View style={{
								backgroundColor: tokens.color.bg.muted,
								borderRadius: tokens.radius.lg,
								padding: tokens.spacing.gap.md,
								marginBottom: tokens.spacing.gap.lg
							}}>
								<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
									<View>
										<Text style={{ 
											fontSize: tokens.font.size.body,
											fontWeight: '600',
											color: tokens.color.text.primary
										}}>
											Subscription Status
										</Text>
										<Text style={{ 
											fontSize: tokens.font.size.sm, 
											color: tokens.color.text.secondary,
											marginTop: 2
										}}>
											Free Plan
										</Text>
									</View>
									<TouchableOpacity style={{
										backgroundColor: tokens.color.brand.gradient.start,
										paddingHorizontal: tokens.spacing.gap.md,
										paddingVertical: tokens.spacing.gap.sm,
										borderRadius: tokens.radius.lg
									}}>
										<Text style={{ color: 'white', fontSize: tokens.font.size.sm, fontWeight: '600' }}>
											Upgrade
										</Text>
									</TouchableOpacity>
								</View>
							</View>

							{/* User Info */}
							{user && (
								<View style={{
									backgroundColor: tokens.color.bg.muted,
									borderRadius: tokens.radius.lg,
									padding: tokens.spacing.gap.md,
									marginBottom: tokens.spacing.gap.lg
								}}>
									<Text style={{ 
										fontSize: tokens.font.size.body,
										fontWeight: '600',
										color: tokens.color.text.primary,
										marginBottom: 4
									}}>
										Signed in as
									</Text>
									<Text style={{ 
										fontSize: tokens.font.size.sm, 
										color: tokens.color.text.secondary
									}}>
										{user.displayName}
									</Text>
									<Text style={{ 
										fontSize: tokens.font.size.sm, 
										color: tokens.color.text.secondary
									}}>
										{user.email}
									</Text>
								</View>
							)}

							{/* Management Actions */}
							{[
								{ icon: 'key', label: 'Change Password' },
								{ icon: 'download', label: 'Export Data' },
								{ icon: 'log-out', label: 'Sign Out', action: handleSignOut },
								{ icon: 'trash', label: 'Delete Account', destructive: true }
							].map((item, index) => (
								<TouchableOpacity
									key={index}
									onPress={item.action}
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										paddingVertical: tokens.spacing.gap.md,
										borderBottomWidth: index < 3 ? 1 : 0,
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
					)}
				</View>
				</ScrollView>
			</View>

			<BottomNavigation />
		</LinearGradient>
	);
}