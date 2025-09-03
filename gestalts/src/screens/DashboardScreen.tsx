import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Dimensions, Animated, Image, StyleSheet, Platform } from 'react-native';
import { Text } from '../theme';
import { useMemoriesStore } from '../state/useStore';
import { Ionicons } from '@expo/vector-icons';
import { useDrawer } from '../navigation/SimpleDrawer';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { BottomNavigation } from '../navigation/BottomNavigation';
import { ProfileSetupNotification } from '../components/ProfileSetupNotification';
import { useAuth } from '../contexts/AuthContext';
import { BlurView } from 'expo-blur';

export default function DashboardScreen() {
	// const { tokens } = useTheme();
	const { openDrawer } = useDrawer();
	const navigation = useNavigation();
	const currentProfile = useMemoriesStore((s) => s.currentProfile);
	const profiles = useMemoriesStore((s) => s.profiles);
	const journal = useMemoriesStore((s) => s.journal);
	const milestones = useMemoriesStore((s) => s.milestones);
	const appointmentNotes = useMemoriesStore((s) => s.appointmentNotes);
	
	// Show notification if user has no child profiles
	const shouldShowNotification = profiles.length === 0;
	const screenWidth = Dimensions.get('window').width;
	// const scrollX = useRef(new Animated.Value(0)).current;
	
	// State for expandable tiles
	const [expandedGestalts, setExpandedGestalts] = useState(false);
	const [expandedAppointments, setExpandedAppointments] = useState(false);
	const gestaltExpandAnim = useRef(new Animated.Value(0)).current;
	const appointmentExpandAnim = useRef(new Animated.Value(0)).current;


	// AI Coach modes
	const coachModes = [
		{
			title: 'Language Coach',
			icon: 'mic',
			mode: 'Language Coach'
		},
		{
			title: 'Parent Support',
			icon: 'heart',
			mode: 'Parent Support'
		},
		{
			title: 'Child Mode',
			icon: 'happy-outline',
			mode: 'Child Mode'
		}
	];
	
	// Sample data for Gestalt Lists (would come from store in production)
	const recentGestalts = [
		{ id: '1', phrase: "To infinity and beyond!", source: "Toy Story", category: "Movies" },
		{ id: '2', phrase: "Let's go on an adventure", source: "Daily routine", category: "Social" },
		{ id: '3', phrase: "It's gonna be okay", source: "Parent comfort", category: "Comfort" }
	];
	
	// Get open appointment notes
	const openAppointmentNotes = appointmentNotes.filter(note => !note.isClosed).slice(0, 3);

	const handleModeSelect = (mode: string) => {
		(navigation as any).navigate('Coach', { initialMode: mode });
	};

	const handleTilePress = (navigateTo: string) => {
		(navigation as any).navigate(navigateTo);
	};
	
	const toggleGestaltsExpand = () => {
		const toValue = expandedGestalts ? 0 : 1;
		Animated.spring(gestaltExpandAnim, {
			toValue,
			useNativeDriver: false,
			tension: 50,
			friction: 7
		}).start();
		setExpandedGestalts(!expandedGestalts);
	};
	
	const toggleAppointmentsExpand = () => {
		const toValue = expandedAppointments ? 0 : 1;
		Animated.spring(appointmentExpandAnim, {
			toValue,
			useNativeDriver: false,
			tension: 50,
			friction: 7
		}).start();
		setExpandedAppointments(!expandedAppointments);
	};

	// Feature tiles reorganized as requested
	const flagshipFeatures = [
		{ 
			icon: 'sync', 
			title: 'Play Analyzer',
			navigateTo: 'PlayAnalyzer',
			description: 'Analyze play'
		},
		{ 
			icon: 'book-outline', 
			title: 'Storybook',
			navigateTo: 'Storybook',
			description: 'Interactive stories'
		}
	];
	
	const memoryFeatures = [
		{ 
			icon: 'create-outline', 
			title: 'Journal',
			navigateTo: 'Memories',
			count: journal.length
		},
		{ 
			icon: 'trophy', 
			title: 'Milestones',
			navigateTo: 'Memories',
			count: milestones.length
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
			{/* Gestalts brand gradient background - organic flow */}
			<LinearGradient
				colors={['#F3E8FF', '#FDF2FE', '#FFF0F8', '#FFF7ED', '#FAFAFA']}
				start={{ x: 0.2, y: 0 }}
				end={{ x: 0.8, y: 1 }}
				style={StyleSheet.absoluteFillObject}
			/>
			{/* Additional gradient overlay for more organic feel */}
			<LinearGradient
				colors={['transparent', 'rgba(236, 72, 153, 0.03)', 'transparent', 'rgba(251, 146, 60, 0.02)', 'transparent']}
				start={{ x: 1, y: 0 }}
				end={{ x: 0, y: 1 }}
				style={{
					...StyleSheet.absoluteFillObject,
					opacity: 0.6
				}}
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
							<Ionicons name="menu" size={24} color="#6B7280" />
						</TouchableOpacity>
							
							{/* Centered Logo */}
							<View style={{ flex: 1, alignItems: 'center' }}>
								<Image 
									source={require('../../assets/Gestalts-logo.png')} 
									style={{ 
										width: 80, 
										height: 80, 
										resizeMode: 'contain'
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
							color: '#111827',
							letterSpacing: -1,
							lineHeight: 44
						}}>
							Hey {currentProfile?.parentName?.split(' ')[0] || 'there'}!
						</Text>
					</View>
					<Text style={{
						fontSize: 18,
						color: '#4B5563',
						fontWeight: '500',
						lineHeight: 22
					}}>
						How can I help with {currentProfile?.childName || 'your child'}'s development today?
					</Text>
				</View>

				{/* Profile Setup Notification */}
				<ProfileSetupNotification show={shouldShowNotification} />

				{/* Section Title - Ask Jessie */}
				<View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
					<Text style={{
						fontSize: 22,
						fontWeight: '700',
						color: '#111827',
						letterSpacing: -0.5
					}}>Ask Jessie</Text>
					<Text style={{
						fontSize: 14,
						color: '#6B7280',
						marginTop: 2
					}}>Choose your AI coach mode</Text>
				</View>
				
				{/* AI Coach Cards - Enhanced Liquid Glass */}
				<View style={{ paddingBottom: 30 }}>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						snapToInterval={screenWidth * 0.65}
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
									width: screenWidth * 0.65,
									height: 140,
									borderRadius: 24,
									overflow: 'hidden',
									shadowColor: '#7C3AED',
									shadowOffset: { width: 0, height: 8 },
									shadowOpacity: 0.4,
									shadowRadius: 20,
									elevation: 15
								}}>
									{/* Gestalts brand gradient background - same as mic button */}
									<LinearGradient
										colors={['#7C3AED', '#EC4899', '#FB923C']}
										start={{ x: 0, y: 0 }}
										end={{ x: 1, y: 1 }}
										style={{
											position: 'absolute',
											top: 0,
											left: 0,
											right: 0,
											bottom: 0
										}}
									/>
									
									{/* Liquid glass shine effect - same as mic button */}
									<View style={{
										position: 'absolute',
										top: 0,
										left: 0,
										right: 0,
										height: '45%',
										backgroundColor: 'rgba(255, 255, 255, 0.3)',
										borderTopLeftRadius: 24,
										borderTopRightRadius: 24
									}} />
									
									{/* Inner shadow for depth */}
									<View style={{
										position: 'absolute',
										top: 2,
										left: 2,
										right: 2,
										bottom: 2,
										borderRadius: 22,
										borderWidth: 1,
										borderColor: 'rgba(255, 255, 255, 0.2)'
									}} />
									
									{/* Outer border */}
									<View style={{
										position: 'absolute',
										top: 0,
										left: 0,
										right: 0,
										bottom: 0,
										borderRadius: 24,
										borderWidth: 2,
										borderColor: 'rgba(255, 255, 255, 0.3)'
									}} />
									
									<View style={{
										flex: 1,
										padding: 20,
										justifyContent: 'space-between'
									}}>
										<Ionicons 
											name={mode.icon as any} 
											size={34} 
											color="#FFFFFF"
										/>
										<Text style={{
											fontSize: 20,
											fontWeight: '700',
											color: '#FFFFFF',
											letterSpacing: -0.5
										}}>
											{mode.title}
										</Text>
									</View>
								</View>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>

				{/* Section Divider */}
				<View style={{ 
					paddingHorizontal: 20, 
					marginVertical: 20 
				}}>
					<View style={{
						height: 1,
						backgroundColor: 'rgba(0,0,0,0.05)',
						marginHorizontal: 10
					}} />
				</View>

				{/* Interact Section */}
				<View style={{ paddingHorizontal: 20, marginBottom: 30 }}>
					<Text style={{
						fontSize: 22,
						fontWeight: '700',
						color: '#111827',
						letterSpacing: -0.5,
						marginBottom: 15
					}}>Interact</Text>
					
					<View style={{
						flexDirection: 'row',
						gap: 15
					}}>
						{flagshipFeatures.map((feature, index) => (
							<TouchableOpacity
								key={index}
								onPress={() => handleTilePress(feature.navigateTo)}
								activeOpacity={0.9}
								style={{ flex: 1 }}
							>
								<View style={{
									height: 140,
									borderRadius: 24,
									overflow: 'hidden',
									backgroundColor: 'rgba(255,255,255,0.75)',
									shadowColor: '#7C3AED',
									shadowOffset: { width: 0, height: 6 },
									shadowOpacity: 0.15,
									shadowRadius: 16,
									elevation: 10
								}}>
									{/* Liquid glass shine effect */}
									<View style={{
										position: 'absolute',
										top: 0,
										left: 0,
										right: 0,
										height: '45%',
										backgroundColor: 'rgba(255, 255, 255, 0.3)',
										borderTopLeftRadius: 24,
										borderTopRightRadius: 24
									}} />
									
									{/* Inner shadow for depth */}
									<View style={{
										position: 'absolute',
										top: 2,
										left: 2,
										right: 2,
										bottom: 2,
										borderRadius: 22,
										borderWidth: 1,
										borderColor: 'rgba(255, 255, 255, 0.3)'
									}} />
									
									{/* Outer border */}
									<View style={{
										position: 'absolute',
										top: 0,
										left: 0,
										right: 0,
										bottom: 0,
										borderRadius: 24,
										borderWidth: 1.5,
										borderColor: 'rgba(255, 255, 255, 0.4)'
									}} />
									
									<View style={{
										flex: 1,
										padding: 20,
										justifyContent: 'space-between'
									}}>
										<Ionicons 
											name={feature.icon as any} 
											size={36} 
											color="#4B5563"
										/>
										<View>
											<Text style={{
												fontSize: 18,
												fontWeight: '700',
												color: '#111827',
												letterSpacing: -0.3
											}}>
												{feature.title}
											</Text>
											<Text style={{
												fontSize: 13,
												color: '#6B7280',
												marginTop: 2
											}}>
												{feature.description}
											</Text>
										</View>
									</View>
								</View>
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* Memory Features Section */}
				<View style={{ paddingHorizontal: 20, marginBottom: 30 }}>
					<Text style={{
						fontSize: 22,
						fontWeight: '700',
						color: '#111827',
						letterSpacing: -0.5,
						marginBottom: 15
					}}>Memories</Text>
					
					<View style={{
						flexDirection: 'row',
						gap: 15,
						marginBottom: 15
					}}>
						{memoryFeatures.map((feature, index) => (
							<TouchableOpacity
								key={index}
								onPress={() => handleTilePress(feature.navigateTo)}
								activeOpacity={0.9}
								style={{ flex: 1 }}
							>
																<View style={{
									height: 110,
									borderRadius: 20,
									overflow: 'hidden',
									backgroundColor: 'rgba(255,255,255,0.75)',
									shadowColor: '#7C3AED',
									shadowOffset: { width: 0, height: 4 },
									shadowOpacity: 0.12,
									shadowRadius: 12,
									elevation: 8
								}}>
									{/* Liquid glass shine effect */}
									<View style={{
										position: 'absolute',
										top: 0,
										left: 0,
										right: 0,
										height: '45%',
										backgroundColor: 'rgba(255, 255, 255, 0.3)',
										borderTopLeftRadius: 20,
										borderTopRightRadius: 20
									}} />
									
									{/* Inner shadow for depth */}
									<View style={{
										position: 'absolute',
										top: 2,
										left: 2,
										right: 2,
										bottom: 2,
										borderRadius: 18,
										borderWidth: 1,
										borderColor: 'rgba(255, 255, 255, 0.3)'
									}} />
									
									{/* Outer border */}
									<View style={{
										position: 'absolute',
										top: 0,
										left: 0,
										right: 0,
										bottom: 0,
										borderRadius: 20,
										borderWidth: 1.5,
										borderColor: 'rgba(255, 255, 255, 0.4)'
									}} />
									
									<View style={{
										flex: 1,
										padding: 16,
										justifyContent: 'space-between'
									}}>
										<View style={{
											flexDirection: 'row',
											justifyContent: 'space-between',
											alignItems: 'flex-start'
										}}>
											<Ionicons 
												name={feature.icon as any} 
												size={30} 
												color="#4B5563"
											/>
											{feature.count !== undefined && feature.count > 0 && (
												<View style={{
													backgroundColor: 'rgba(124,58,237,0.1)',
													paddingHorizontal: 8,
													paddingVertical: 2,
													borderRadius: 8,
													borderWidth: 0.5,
													borderColor: 'rgba(124,58,237,0.2)'
												}}>
													<Text style={{
														color: '#7C3AED',
														fontWeight: '700',
														fontSize: 12
													}}>
														{feature.count}
													</Text>
												</View>
											)}
										</View>
										
										<Text style={{
											fontSize: 15,
											fontWeight: '600',
											color: '#111827',
											letterSpacing: -0.3
										}}>
											{feature.title}
										</Text>
									</View>
								</View>
							</TouchableOpacity>
						))}
					</View>

					{/* Expandable Gestalt Lists Tile */}
					<TouchableOpacity
						onPress={toggleGestaltsExpand}
						activeOpacity={0.9}
						style={{ marginBottom: 15 }}
					>
						<Animated.View style={{
							borderRadius: 24,
							overflow: 'hidden',
							backgroundColor: 'rgba(255,255,255,0.75)',
							shadowColor: '#7C3AED',
							shadowOffset: { width: 0, height: 6 },
							shadowOpacity: 0.15,
							shadowRadius: 16,
							elevation: 10,
							height: gestaltExpandAnim.interpolate({
								inputRange: [0, 1],
								outputRange: [80, 280]
							})
						}}>
							{/* Liquid glass shine effect */}
							<View style={{
								position: 'absolute',
								top: 0,
								left: 0,
								right: 0,
								height: expandedGestalts ? 60 : '45%',
								backgroundColor: 'rgba(255, 255, 255, 0.3)',
								borderTopLeftRadius: 24,
								borderTopRightRadius: 24
							}} />
							
							{/* Inner shadow for depth */}
							<View style={{
								position: 'absolute',
								top: 2,
								left: 2,
								right: 2,
								bottom: 2,
								borderRadius: 22,
								borderWidth: 1,
								borderColor: 'rgba(255, 255, 255, 0.3)'
							}} />
							
							{/* Outer border */}
							<View style={{
								position: 'absolute',
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
								borderRadius: 24,
								borderWidth: 1.5,
								borderColor: 'rgba(255, 255, 255, 0.4)'
							}} />
							
							<View style={{ flex: 1 }}>
								{/* Header - centered when collapsed */}
								<View style={{
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'space-between',
									height: 80,
									paddingHorizontal: 16
								}}>
									<View style={{
										flexDirection: 'row',
										alignItems: 'center',
										gap: 12
									}}>
										<Ionicons name="list" size={26} color="#4B5563" />
										<Text style={{
											fontSize: 16,
											fontWeight: '600',
											color: '#111827',
											letterSpacing: -0.3
										}}>
											Gestalt Lists
										</Text>
									</View>
									<Ionicons 
										name={expandedGestalts ? "chevron-up" : "chevron-down"} 
										size={20} 
										color="#6B7280"
									/>
								</View>
								
								{/* Expanded Content */}
								<Animated.View style={{
									opacity: gestaltExpandAnim,
									paddingHorizontal: 16,
									paddingBottom: 16
								}}>
									<Text style={{
										fontSize: 13,
										color: '#6B7280',
										marginBottom: 15
									}}>
										Recent Gestalts
									</Text>
									
									{recentGestalts.map((gestalt, index) => (
										<View key={gestalt.id} style={{
											paddingVertical: 10,
											borderTopWidth: index > 0 ? 0.5 : 0,
											borderTopColor: 'rgba(229,231,235,0.5)'
										}}>
											<Text style={{
												fontSize: 14,
												fontWeight: '600',
												color: '#374151'
											}}>
												{gestalt.phrase}
											</Text>
											<Text style={{
												fontSize: 12,
												color: '#9CA3AF',
												marginTop: 2
											}}>
												{gestalt.source} • {gestalt.category}
											</Text>
										</View>
									))}
									
									<TouchableOpacity
										onPress={() => handleTilePress('GestaltLists')}
										style={{
											marginTop: 15,
											paddingVertical: 10,
											paddingHorizontal: 16,
											backgroundColor: 'rgba(124,58,237,0.1)',
											borderRadius: 12,
											alignItems: 'center'
										}}
									>
										<Text style={{
											fontSize: 14,
											fontWeight: '600',
											color: '#7C3AED'
										}}>
											Add New Gestalt
										</Text>
									</TouchableOpacity>
								</Animated.View>
							</View>
						</Animated.View>
					</TouchableOpacity>
				</View>

				{/* Specialist Interaction Section */}
				<View style={{ paddingHorizontal: 20, marginBottom: 30 }}>
					<Text style={{
						fontSize: 22,
						fontWeight: '700',
						color: '#111827',
						letterSpacing: -0.5,
						marginBottom: 15
					}}>Specialist Tools</Text>
					
					{/* Expandable Appointment Notes */}
					<TouchableOpacity
						onPress={toggleAppointmentsExpand}
						activeOpacity={0.9}
						style={{ marginBottom: 15 }}
					>
											<Animated.View style={{
						borderRadius: 24,
						overflow: 'hidden',
						backgroundColor: 'rgba(255,255,255,0.75)',
						shadowColor: '#7C3AED',
						shadowOffset: { width: 0, height: 6 },
						shadowOpacity: 0.15,
						shadowRadius: 16,
						elevation: 10,
						height: appointmentExpandAnim.interpolate({
							inputRange: [0, 1],
							outputRange: [80, 320]
						})
					}}>
						{/* Liquid glass shine effect */}
						<View style={{
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							height: expandedAppointments ? 60 : '45%',
							backgroundColor: 'rgba(255, 255, 255, 0.3)',
							borderTopLeftRadius: 24,
							borderTopRightRadius: 24
						}} />
						
						{/* Inner shadow for depth */}
						<View style={{
							position: 'absolute',
							top: 2,
							left: 2,
							right: 2,
							bottom: 2,
							borderRadius: 22,
							borderWidth: 1,
							borderColor: 'rgba(255, 255, 255, 0.3)'
						}} />
						
						{/* Outer border */}
						<View style={{
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							borderRadius: 24,
							borderWidth: 1.5,
							borderColor: 'rgba(255, 255, 255, 0.4)'
						}} />
							
							<View style={{ flex: 1 }}>
								{/* Header - centered when collapsed */}
								<View style={{
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'space-between',
									height: 80,
									paddingHorizontal: 16
								}}>
									<View style={{
										flexDirection: 'row',
										alignItems: 'center',
										gap: 12
									}}>
										<Ionicons name="calendar-outline" size={26} color="#4B5563" />
										<Text style={{
											fontSize: 16,
											fontWeight: '600',
											color: '#111827',
											letterSpacing: -0.3
										}}>
											Appointment Notes
										</Text>
										{openAppointmentNotes.length > 0 && (
											<View style={{
												backgroundColor: 'rgba(239,68,68,0.1)',
												paddingHorizontal: 8,
												paddingVertical: 2,
												borderRadius: 8,
												borderWidth: 0.5,
												borderColor: 'rgba(239,68,68,0.2)'
											}}>
												<Text style={{
													color: '#EF4444',
													fontWeight: '700',
													fontSize: 12
												}}>
													{openAppointmentNotes.length}
												</Text>
											</View>
										)}
									</View>
									<Ionicons 
										name={expandedAppointments ? "chevron-up" : "chevron-down"} 
										size={20} 
										color="#6B7280"
									/>
								</View>
								
								{/* Expanded Content */}
								<Animated.View style={{
									opacity: appointmentExpandAnim,
									paddingHorizontal: 16,
									paddingBottom: 16
								}}>
									<Text style={{
										fontSize: 13,
										color: '#6B7280',
										marginBottom: 15
									}}>
										Open Notes
									</Text>
									
									{openAppointmentNotes.length > 0 ? (
										openAppointmentNotes.map((note, index) => (
											<View key={note.id} style={{
												paddingVertical: 10,
												borderTopWidth: index > 0 ? 0.5 : 0,
												borderTopColor: 'rgba(229,231,235,0.5)'
											}}>
												<View style={{
													flexDirection: 'row',
													justifyContent: 'space-between',
													alignItems: 'flex-start'
												}}>
													<View style={{ flex: 1 }}>
														<Text style={{
															fontSize: 14,
															fontWeight: '600',
															color: '#374151'
														}}>
															{note.question}
														</Text>
														{note.specialist && (
															<Text style={{
																fontSize: 12,
																color: '#9CA3AF',
																marginTop: 2
															}}>
																{note.specialist}
															</Text>
														)}
													</View>
													<TouchableOpacity
														onPress={() => {
															// Mark as closed logic here
														}}
														style={{
															padding: 4,
															marginLeft: 8
														}}
													>
														<Ionicons name="checkmark-circle-outline" size={22} color="#10B981" />
													</TouchableOpacity>
												</View>
											</View>
										))
									) : (
										<Text style={{
											fontSize: 14,
											color: '#9CA3AF',
											fontStyle: 'italic'
										}}>
											No open appointment notes
										</Text>
									)}
									
									<TouchableOpacity
										onPress={() => handleTilePress('AddAppointmentNote')}
										style={{
											marginTop: 15,
											paddingVertical: 10,
											paddingHorizontal: 16,
											backgroundColor: 'rgba(124,58,237,0.1)',
											borderRadius: 12,
											alignItems: 'center'
										}}
									>
										<Text style={{
											fontSize: 14,
											fontWeight: '600',
											color: '#7C3AED'
										}}>
											Add Appointment Note
										</Text>
									</TouchableOpacity>
								</Animated.View>
							</View>
						</Animated.View>
					</TouchableOpacity>
					
					{/* Reports and Specialist Management */}
					<View style={{
						flexDirection: 'row',
						gap: 15
					}}>
						<TouchableOpacity
							onPress={() => handleTilePress('Report')}
							activeOpacity={0.9}
							style={{ flex: 1 }}
						>
							<View style={{
								height: 110,
								borderRadius: 20,
								overflow: 'hidden',
								backgroundColor: 'rgba(255,255,255,0.75)',
								shadowColor: '#7C3AED',
								shadowOffset: { width: 0, height: 4 },
								shadowOpacity: 0.12,
								shadowRadius: 12,
								elevation: 8
							}}>
								{/* Liquid glass shine effect */}
								<View style={{
									position: 'absolute',
									top: 0,
									left: 0,
									right: 0,
									height: '45%',
									backgroundColor: 'rgba(255, 255, 255, 0.3)',
									borderTopLeftRadius: 20,
									borderTopRightRadius: 20
								}} />
								
								{/* Inner shadow for depth */}
								<View style={{
									position: 'absolute',
									top: 2,
									left: 2,
									right: 2,
									bottom: 2,
									borderRadius: 18,
									borderWidth: 1,
									borderColor: 'rgba(255, 255, 255, 0.3)'
								}} />
								
								{/* Outer border */}
								<View style={{
									position: 'absolute',
									top: 0,
									left: 0,
									right: 0,
									bottom: 0,
									borderRadius: 20,
									borderWidth: 1.5,
									borderColor: 'rgba(255, 255, 255, 0.4)'
								}} />
								
								<View style={{
									flex: 1,
									padding: 16,
									justifyContent: 'space-between'
								}}>
									<Ionicons name="bar-chart" size={30} color="#4B5563" />
									<Text style={{
										fontSize: 15,
										fontWeight: '600',
										color: '#111827',
										letterSpacing: -0.3
									}}>
										Reports
									</Text>
								</View>
							</View>
						</TouchableOpacity>
						
						<TouchableOpacity
							onPress={() => handleTilePress('SpecialistProfiles')}
							activeOpacity={0.9}
							style={{ flex: 1 }}
						>
							<View style={{
								height: 110,
								borderRadius: 20,
								overflow: 'hidden',
								backgroundColor: 'rgba(255,255,255,0.75)',
								shadowColor: '#7C3AED',
								shadowOffset: { width: 0, height: 4 },
								shadowOpacity: 0.12,
								shadowRadius: 12,
								elevation: 8
							}}>
								{/* Liquid glass shine effect */}
								<View style={{
									position: 'absolute',
									top: 0,
									left: 0,
									right: 0,
									height: '45%',
									backgroundColor: 'rgba(255, 255, 255, 0.3)',
									borderTopLeftRadius: 20,
									borderTopRightRadius: 20
								}} />
								
								{/* Inner shadow for depth */}
								<View style={{
									position: 'absolute',
									top: 2,
									left: 2,
									right: 2,
									bottom: 2,
									borderRadius: 18,
									borderWidth: 1,
									borderColor: 'rgba(255, 255, 255, 0.3)'
								}} />
								
								{/* Outer border */}
								<View style={{
									position: 'absolute',
									top: 0,
									left: 0,
									right: 0,
									bottom: 0,
									borderRadius: 20,
									borderWidth: 1.5,
									borderColor: 'rgba(255, 255, 255, 0.4)'
								}} />
								
								<View style={{
									flex: 1,
									padding: 16,
									justifyContent: 'space-between'
								}}>
									<Ionicons name="medical-outline" size={30} color="#4B5563" />
									<Text style={{
										fontSize: 15,
										fontWeight: '600',
										color: '#111827',
										letterSpacing: -0.3
									}}>
										Specialists
									</Text>
								</View>
							</View>
						</TouchableOpacity>
					</View>
				</View>
				</ScrollView>
			</View>



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
												color="#4B5563"
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