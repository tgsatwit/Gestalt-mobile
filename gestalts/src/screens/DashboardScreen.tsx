import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Dimensions, Animated, Image, StyleSheet } from 'react-native';
import { Text } from '../theme';
import { useMemoriesStore } from '../state/useStore';
import { Ionicons } from '@expo/vector-icons';
import { useDrawer } from '../navigation/SimpleDrawer';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { BottomNavigation } from '../components/BottomNavigation';
import { ProfileSetupNotification } from '../components/ProfileSetupNotification';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardScreen() {
	// const { tokens } = useTheme();
	const { openDrawer } = useDrawer();
	const navigation = useNavigation();
	const currentProfile = useMemoriesStore((s) => s.currentProfile);
	const profiles = useMemoriesStore((s) => s.profiles);
	const journal = useMemoriesStore((s) => s.journal);
	const milestones = useMemoriesStore((s) => s.milestones);
	// const appointmentNotes = useMemoriesStore((s) => s.appointmentNotes);
	
	// Show notification if user has no child profiles
	const shouldShowNotification = profiles.length === 0;
	const screenWidth = Dimensions.get('window').width;
	// const scrollX = useRef(new Animated.Value(0)).current;
	const pulseAnim = useRef(new Animated.Value(1)).current;

	// Pulse animation for mic button
	useEffect(() => {
		Animated.loop(
			Animated.sequence([
				Animated.timing(pulseAnim, {
					toValue: 1.05,
					duration: 1500,
					useNativeDriver: true,
				}),
				Animated.timing(pulseAnim, {
					toValue: 1,
					duration: 1500,
					useNativeDriver: true,
				}),
			])
		).start();
	}, []);

	// AI Coach modes - with subtle accent colors
	const coachModes = [
		{
			title: 'Language',
			icon: 'chatbubbles',
			accentColor: 'rgba(139, 92, 246, 0.3)',
			mode: 'Language Coach'
		},
		{
			title: 'Support',
			icon: 'heart',
			accentColor: 'rgba(236, 72, 153, 0.3)',
			mode: 'Parent Support'
		},
		{
			title: 'Play',
			icon: 'game-controller',
			accentColor: 'rgba(34, 197, 94, 0.3)',
			mode: 'Child Mode'
		}
	];

	const handleModeSelect = (mode: string) => {
		(navigation as any).navigate('Coach', { initialMode: mode });
	};

	const handleTilePress = (navigateTo: string) => {
		(navigation as any).navigate(navigateTo);
	};

	// Feature tiles with glass design
	const mainFeatures = [
		{ 
			icon: 'book', 
			title: 'Journal',
			navigateTo: 'Memories',
			count: journal.length,
			size: 'large'
		},
		{ 
			icon: 'trophy', 
			title: 'Milestones',
			navigateTo: 'Memories',
			count: milestones.length,
			size: 'small'
		},
		{ 
			icon: 'game-controller', 
			title: 'Play',
			navigateTo: 'PlayAnalyzer',
			size: 'small'
		},
		{ 
			icon: 'bar-chart', 
			title: 'Reports',
			navigateTo: 'Report',
			size: 'medium'
		},
		{ 
			icon: 'list', 
			title: 'Gestalts',
			navigateTo: 'GestaltLists',
			size: 'medium'
		},
		{ 
			icon: 'book-outline', 
			title: 'Storybook',
			navigateTo: 'Storybook',
			size: 'medium'
		}
	];

	const [showAddMenu, setShowAddMenu] = useState(false);
	const [showProfileMenu, setShowProfileMenu] = useState(false);
	const addMenuAnim = useRef(new Animated.Value(0)).current;
	const profileMenuAnim = useRef(new Animated.Value(0)).current;

	const addMenuOptions = [
		{ title: 'Journal', icon: 'create-outline', navigateTo: 'AddJournal' },
		{ title: 'Milestone', icon: 'flag-outline', navigateTo: 'AddMilestone' },
		{ title: 'Note', icon: 'calendar-outline', navigateTo: 'AddAppointmentNote' }
	];

	const profileMenuOptions = [
		{ title: 'My Profile', icon: 'person-outline', navigateTo: 'Profile' },
		{ title: 'Children Profiles', icon: 'people-outline', navigateTo: 'ChildProfilesList' },
		{ title: 'Specialist Profiles', icon: 'medical-outline', navigateTo: 'SpecialistProfiles' }
	];



	const toggleAddMenu = () => {
		if (showAddMenu) {
			Animated.timing(addMenuAnim, {
				toValue: 0,
				duration: 200,
				useNativeDriver: true,
			}).start(() => setShowAddMenu(false));
		} else {
			setShowAddMenu(true);
			Animated.timing(addMenuAnim, {
				toValue: 1,
				duration: 200,
				useNativeDriver: true,
			}).start();
		}
	};

	const toggleProfileMenu = () => {
		if (showProfileMenu) {
			Animated.timing(profileMenuAnim, {
				toValue: 0,
				duration: 200,
				useNativeDriver: true,
			}).start(() => setShowProfileMenu(false));
		} else {
			setShowProfileMenu(true);
			Animated.timing(profileMenuAnim, {
				toValue: 1,
				duration: 200,
				useNativeDriver: true,
			}).start();
		}
	};

	return (
		<View style={{ flex: 1 }}>
			{/* Gestalt Brand Gradient Background */}
			<LinearGradient
				colors={['#7C3AED', '#EC4899', '#FB923C']}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={StyleSheet.absoluteFillObject}
			/>
			
			{/* Subtle overlay for depth */}
			<LinearGradient
				colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.1)']}
				start={{ x: 0, y: 0 }}
				end={{ x: 0, y: 1 }}
				style={StyleSheet.absoluteFillObject}
			/>

			<View style={{ flex: 1, paddingTop: 60 }}>
				<ScrollView 
					style={{ flex: 1 }}
					contentContainerStyle={{ paddingBottom: 100 }}
					showsVerticalScrollIndicator={false}
				>
					{/* Header with Logo and Menu */}
					<View style={{ 
						paddingHorizontal: 20,
						paddingTop: 10,
						paddingBottom: 10
					}}>
						{/* Top row with hamburger menu and logo */}
						<View style={{
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
							marginBottom: 10
						}}>
							<TouchableOpacity onPress={openDrawer}>
								<Ionicons name="menu" size={24} color="white" />
							</TouchableOpacity>
							
							{/* Centered Logo */}
							<View style={{ flex: 1, alignItems: 'center' }}>
								<Image 
									source={require('../../assets/Gestalts-logo.png')} 
									style={{ 
										width: 80, 
										height: 80, 
										resizeMode: 'contain',
										tintColor: 'white'
									}} 
								/>
							</View>
							
							{/* Spacer to balance the hamburger menu */}
							<View style={{ width: 24 }} />
						</View>
					</View>

					{/* Welcome Section - Reimplemented */}
				<View style={{ 
					marginTop: 20,
					paddingHorizontal: 20,
					paddingVertical: 0,
					paddingBottom: 60,
					minHeight: 100
				}}>
					<View style={{ marginBottom: 16 }}>
						<Text style={{ 
							fontSize: 38,
							fontWeight: '800',
							color: 'white',
							letterSpacing: -1,
							textShadowColor: 'rgba(0,0,0,0.2)',
							textShadowOffset: { width: 0, height: 2 },
							textShadowRadius: 4,
							lineHeight: 44
						}}>
							Hey {currentProfile?.parentName?.split(' ')[0] || 'there'}!
						</Text>
					</View>
					<Text style={{
						fontSize: 18,
						color: 'rgba(255,255,255,0.95)',
						fontWeight: '500',
						lineHeight: 22
					}}>
						How can I help with {currentProfile?.childName || 'your child'}'s development today?
					</Text>
				</View>

				{/* Profile Setup Notification */}
				<ProfileSetupNotification show={shouldShowNotification} />

				{/* AI Coach Cards - Liquid Glass Design */}
				<View style={{ paddingBottom: 30 }}>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						snapToInterval={screenWidth * 0.7}
						decelerationRate="fast"
						contentContainerStyle={{
							paddingHorizontal: 20
						}}
					>
						{coachModes.map((mode, index) => (
							<TouchableOpacity
								key={index}
								onPress={() => handleModeSelect(mode.mode)}
								activeOpacity={0.9}
								style={{
									marginRight: 15
								}}
							>
								<View style={{
									width: screenWidth * 0.7,
									height: 160,
									borderRadius: 24,
									overflow: 'hidden',
									backgroundColor: 'rgba(255,255,255,0.1)',
									borderWidth: 1,
									borderColor: 'rgba(255,255,255,0.2)'
								}}>
									{/* Glass effect overlay */}
									<View style={{
										position: 'absolute',
										top: 0,
										left: 0,
										right: 0,
										height: '50%',
										backgroundColor: 'rgba(255,255,255,0.1)'
									}} />
									
									<View style={{
										flex: 1,
										padding: 24,
										justifyContent: 'space-between'
									}}>
										<Ionicons 
											name={mode.icon as any} 
											size={40} 
											color="white"
											style={{
												shadowColor: '#000',
												shadowOffset: { width: 0, height: 2 },
												shadowOpacity: 0.2,
												shadowRadius: 4
											}}
										/>
										<Text style={{
											fontSize: 24,
											fontWeight: '700',
											color: 'white',
											letterSpacing: -0.5,
											textShadowColor: 'rgba(0,0,0,0.2)',
											textShadowOffset: { width: 0, height: 1 },
											textShadowRadius: 2
										}}>
											{mode.title}
										</Text>
									</View>
								</View>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>

				{/* Feature Grid - Liquid Glass Tiles */}
				<View style={{
					paddingHorizontal: 20
				}}>
					{/* Large Feature Tile */}
					<TouchableOpacity
						onPress={() => handleTilePress(mainFeatures[0].navigateTo)}
						activeOpacity={0.9}
						style={{ marginBottom: 15 }}
					>
						<View style={{
							height: 140,
							borderRadius: 24,
							overflow: 'hidden',
							backgroundColor: 'rgba(255,255,255,0.1)',
							borderWidth: 1,
							borderColor: 'rgba(255,255,255,0.2)'
						}}>
							{/* Glass shine effect */}
							<LinearGradient
								colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0)']}
								start={{ x: 0, y: 0 }}
								end={{ x: 0.5, y: 1 }}
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									right: 0,
									bottom: 0
								}}
							/>
							
							<View style={{
								flex: 1,
								padding: 24,
								justifyContent: 'space-between'
							}}>
								<View style={{
									flexDirection: 'row',
									justifyContent: 'space-between',
									alignItems: 'flex-start'
								}}>
									<Ionicons 
										name={mainFeatures[0].icon as any} 
										size={48} 
										color="white"
										style={{
											shadowColor: '#000',
											shadowOffset: { width: 0, height: 2 },
											shadowOpacity: 0.2,
											shadowRadius: 4
										}}
									/>
									{mainFeatures[0].count !== undefined && mainFeatures[0].count > 0 && (
										<View style={{
											backgroundColor: 'rgba(255,255,255,0.2)',
											paddingHorizontal: 12,
											paddingVertical: 4,
											borderRadius: 12,
											borderWidth: 1,
											borderColor: 'rgba(255,255,255,0.3)'
										}}>
											<Text style={{
												color: 'white',
												fontWeight: '700',
												fontSize: 16
											}}>
												{mainFeatures[0].count}
											</Text>
										</View>
									)}
								</View>
								
								<Text style={{
									fontSize: 18,
									fontWeight: '600',
									color: 'white',
									letterSpacing: -0.3
								}}>
									{mainFeatures[0].title}
								</Text>
							</View>
						</View>
					</TouchableOpacity>

					{/* Two Column Grid */}
					<View style={{
						flexDirection: 'row',
						gap: 15
					}}>
						{mainFeatures.slice(1, 3).map((feature, index) => (
							<TouchableOpacity
								key={index}
								onPress={() => handleTilePress(feature.navigateTo)}
								activeOpacity={0.9}
								style={{ flex: 1 }}
							>
								<View style={{
									height: 120,
									borderRadius: 24,
									overflow: 'hidden',
									backgroundColor: 'rgba(255,255,255,0.1)',
									borderWidth: 1,
									borderColor: 'rgba(255,255,255,0.2)'
								}}>
									{/* Glass shine */}
									<LinearGradient
										colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']}
										start={{ x: 0, y: 0 }}
										end={{ x: 0.5, y: 1 }}
										style={{
											position: 'absolute',
											top: 0,
											left: 0,
											right: 0,
											bottom: 0
										}}
									/>
									
									<View style={{
										flex: 1,
										padding: 20,
										justifyContent: 'space-between'
									}}>
										<View style={{
											flexDirection: 'row',
											justifyContent: 'space-between',
											alignItems: 'flex-start'
										}}>
											<Ionicons 
												name={feature.icon as any} 
												size={36} 
												color="white"
												style={{
													shadowColor: '#000',
													shadowOffset: { width: 0, height: 2 },
													shadowOpacity: 0.2,
													shadowRadius: 4
												}}
											/>
											{'count' in feature && feature.count !== undefined && feature.count > 0 && (
												<View style={{
													backgroundColor: 'rgba(255,255,255,0.2)',
													paddingHorizontal: 8,
													paddingVertical: 2,
													borderRadius: 8,
													borderWidth: 1,
													borderColor: 'rgba(255,255,255,0.3)'
												}}>
													<Text style={{
														color: 'white',
														fontWeight: '700',
														fontSize: 12
													}}>
														{feature.count}
													</Text>
												</View>
											)}
										</View>
										
										<Text style={{
											fontSize: 18,
											fontWeight: '600',
											color: 'white',
											letterSpacing: -0.3
										}}>
											{feature.title}
										</Text>
									</View>
								</View>
							</TouchableOpacity>
						))}
					</View>

					{/* Wide Feature Tiles */}
					<View style={{ marginTop: 15, gap: 15 }}>
						{mainFeatures.slice(3).map((feature, index) => (
							<TouchableOpacity
								key={index}
								onPress={() => handleTilePress(feature.navigateTo)}
								activeOpacity={0.9}
							>
								<View style={{
									height: 100,
									borderRadius: 24,
									overflow: 'hidden',
									backgroundColor: 'rgba(255,255,255,0.1)',
									borderWidth: 1,
									borderColor: 'rgba(255,255,255,0.2)'
								}}>
									{/* Glass shine */}
									<LinearGradient
										colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0)']}
										start={{ x: 0, y: 0 }}
										end={{ x: 1, y: 0.5 }}
										style={{
											position: 'absolute',
											top: 0,
											left: 0,
											right: 0,
											bottom: 0
										}}
									/>
									
									<View style={{
										flex: 1,
										flexDirection: 'row',
										alignItems: 'center',
										justifyContent: 'space-between',
										padding: 20
									}}>
										<View style={{
											flexDirection: 'row',
											alignItems: 'center',
											gap: 16
										}}>
											<Ionicons 
												name={feature.icon as any} 
												size={32} 
												color="white"
												style={{
													shadowColor: '#000',
													shadowOffset: { width: 0, height: 2 },
													shadowOpacity: 0.2,
													shadowRadius: 4
												}}
											/>
											
											<Text style={{
												fontSize: 18,
												fontWeight: '600',
												color: 'white',
												letterSpacing: -0.3
											}}>
												{feature.title}
											</Text>
										</View>
									</View>
								</View>
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* Quick Add Section - Glass Button */}
				<View style={{
					paddingHorizontal: 20,
					paddingTop: 30,
					paddingBottom: 20
				}}>
					<View style={{
						flexDirection: 'row',
						gap: 12
					}}>
						<TouchableOpacity
							onPress={() => handleTilePress('AddJournal')}
							style={{ flex: 1 }}
						>
							<View style={{
								height: 56,
								borderRadius: 28,
								backgroundColor: 'rgba(255,255,255,0.15)',
								borderWidth: 1,
								borderColor: 'rgba(255,255,255,0.3)',
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 8
							}}>
								<Ionicons name="add-circle" size={24} color="white" />
								<Text style={{
									fontSize: 16,
									fontWeight: '600',
									color: 'white'
								}}>
									Quick Add
								</Text>
							</View>
						</TouchableOpacity>
					</View>
				</View>
				</ScrollView>
			</View>

			{/* Floating Mic Button - Light Gray Liquid Glass with Purple Icon */}
			<Animated.View style={{ 
				position: 'absolute',
				bottom: 42,
				left: '50%',
				marginLeft: -36,
				zIndex: 1000,
				transform: [{ scale: pulseAnim }]
			}}>
				<TouchableOpacity 
					onPress={() => handleModeSelect('Language Coach')}
					activeOpacity={0.9}
				>
					<View style={{
						width: 72,
						height: 72,
						borderRadius: 36,
						backgroundColor: 'rgba(241, 245, 249, 0.95)',
						borderWidth: 2,
						borderColor: 'rgba(255, 255, 255, 0.8)',
						shadowColor: '#000',
						shadowOffset: { width: 0, height: 8 },
						shadowOpacity: 0.25,
						shadowRadius: 20,
						elevation: 15,
						overflow: 'hidden'
					}}>
						{/* Liquid glass shine effect */}
						<View style={{
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							height: '45%',
							backgroundColor: 'rgba(255, 255, 255, 0.6)'
						}} />
						
						{/* Inner shadow for depth */}
						<View style={{
							position: 'absolute',
							top: 2,
							left: 2,
							right: 2,
							bottom: 2,
							borderRadius: 34,
							borderWidth: 1,
							borderColor: 'rgba(0, 0, 0, 0.05)'
						}} />
						
						<View style={{
							flex: 1,
							alignItems: 'center',
							justifyContent: 'center'
						}}>
							<Ionicons name="mic" size={32} color="#7C3AED" />
						</View>
					</View>
				</TouchableOpacity>
			</Animated.View>

			<BottomNavigation
				onAddPress={toggleAddMenu}
				onProfilePress={toggleProfileMenu}
				showAddMenu={showAddMenu}
				showProfileMenu={showProfileMenu}
				addMenuAnim={addMenuAnim}
				profileMenuAnim={profileMenuAnim}
				addMenuOptions={addMenuOptions}
				profileMenuOptions={profileMenuOptions}
			/>

			{/* Floating Add Menu - Glass Design */}
			{showAddMenu && addMenuAnim && (
				<>
					<Animated.View
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							backgroundColor: 'rgba(0,0,0,0.4)',
							opacity: addMenuAnim
						}}
					>
						<TouchableOpacity 
							style={{ flex: 1 }}
							onPress={toggleAddMenu}
							activeOpacity={1}
						/>
					</Animated.View>
					
					<Animated.View
						style={{
							position: 'absolute',
							bottom: 100,
							left: 20,
							right: 20,
							opacity: addMenuAnim,
							transform: [{
								translateY: addMenuAnim.interpolate({
									inputRange: [0, 1],
									outputRange: [50, 0],
								})
							}]
						}}
					>
						<View style={{
							backgroundColor: 'rgba(255,255,255,0.95)',
							borderRadius: 24,
							padding: 20,
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 10 },
							shadowOpacity: 0.2,
							shadowRadius: 30,
							elevation: 20
						}}>
							<View style={{
								flexDirection: 'row',
								justifyContent: 'space-around'
							}}>
								{addMenuOptions.map((option, index) => (
									<TouchableOpacity
										key={index}
										onPress={() => {
											(navigation as any).navigate(option.navigateTo);
											toggleAddMenu();
										}}
										style={{ alignItems: 'center' }}
									>
										<View style={{
											width: 60,
											height: 60,
											borderRadius: 20,
											backgroundColor: 'rgba(124,58,237,0.1)',
											alignItems: 'center',
											justifyContent: 'center',
											marginBottom: 8
										}}>
											<Ionicons 
												name={option.icon as any} 
												size={28} 
												color="#7C3AED"
											/>
										</View>
										<Text style={{
											fontSize: 12,
											color: '#6B7280',
											fontWeight: '500'
										}}>
											{option.title}
										</Text>
									</TouchableOpacity>
								))}
							</View>
						</View>
					</Animated.View>
				</>
			)}

		</View>
	);
}