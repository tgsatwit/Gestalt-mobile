import React, { useState, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Animated, Image } from 'react-native';
import { Text, useTheme } from '../theme';
import { useMemoriesStore } from '../state/useStore';
import { Ionicons } from '@expo/vector-icons';
import { useDrawer } from '../navigation/SimpleDrawer';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { GlassView } from '../components/GlassView';
import { BottomNavigation } from '../components/BottomNavigation';

export default function DashboardScreen() {
	const { tokens } = useTheme();
	const { openDrawer } = useDrawer();
	const navigation = useNavigation();
	const profile = useMemoriesStore((s) => s.profile);
	const journal = useMemoriesStore((s) => s.journal);
	const milestones = useMemoriesStore((s) => s.milestones);
	const appointmentNotes = useMemoriesStore((s) => s.appointmentNotes);
	const screenWidth = Dimensions.get('window').width;
	const scrollX = useRef(new Animated.Value(0)).current;

	const coachModes = [
		{
			title: 'Language Coach',
			subtitle: 'GLP strategies & daily activities',
			icon: 'mic',
			gradient: [tokens.color.brand.gradient.start, tokens.color.brand.gradient.mid],
			mode: 'Language Coach'
		},
		{
			title: 'Parent Support',
			subtitle: 'Emotional guidance & encouragement',
			icon: 'heart',
			gradient: ['#F472B6', '#EC4899'],
			mode: 'Parent Support'
		},
		{
			title: 'Child Mode',
			subtitle: 'Interactive play & learning',
			icon: 'happy',
			gradient: ['#34D399', '#10B981'],
			mode: 'Child Mode'
		}
	];

	const handleModeSelect = (mode: string) => {
		// Navigate to Coach screen with the selected mode
		(navigation as any).navigate('Coach', { initialMode: mode });
	};

	const handleTilePress = (navigateTo: string) => {
		(navigation as any).navigate(navigateTo);
	};

	const sections = [
		{
			title: 'Learn & Grow',
			icon: 'arrow-forward',
			quickActions: [
				{ title: 'Play Analyzer', icon: 'sync', color: '#7C3AED', navigateTo: 'PlayAnalyzer' },
				{ title: 'Storybook', icon: 'book-outline', color: '#7C3AED', navigateTo: 'Storybook' },
				{ title: 'Knowledge', icon: 'bulb-outline', color: '#7C3AED', navigateTo: 'Knowledge' }
			]
		},
		{
			title: 'Record & Track',
			icon: 'arrow-forward',
			quickActions: [
				{ title: 'Add Journal', icon: 'create-outline', color: '#7C3AED', navigateTo: 'AddJournal' },
				{ title: 'Add Milestone', icon: 'flag-outline', color: '#7C3AED', navigateTo: 'AddMilestone' },
				{ title: 'Journal', icon: 'albums-outline', color: '#7C3AED', navigateTo: 'Memories', count: journal.length },
				{ title: 'Milestones', icon: 'trophy-outline', color: '#7C3AED', navigateTo: 'Memories', count: milestones.length },
				{ title: 'Gestalt Lists', icon: 'list-outline', color: '#7C3AED', navigateTo: 'GestaltLists' },
				{ title: 'Reports', icon: 'document-text-outline', color: '#7C3AED', navigateTo: 'Report' }
			]
		}
	];

	const [scrollY] = useState(new Animated.Value(0));
	const [showProfileMenu, setShowProfileMenu] = useState(false);
	const profileMenuAnim = useRef(new Animated.Value(0)).current;
	const [showAddMenu, setShowAddMenu] = useState(false);
	const addMenuAnim = useRef(new Animated.Value(0)).current;

	const profileMenuOptions = [
		{ title: 'Child Profile', icon: 'person-outline', navigateTo: 'ChildProfile' },
		{ title: 'Specialist', icon: 'medical-outline', navigateTo: 'Specialist' },
		{ title: 'My Profile', icon: 'settings-outline', navigateTo: 'MyProfile' }
	];

	const addMenuOptions = [
		{ title: 'Appointment Note', icon: 'calendar-outline', navigateTo: 'AddAppointmentNote' },
		{ title: 'Milestone', icon: 'flag-outline', navigateTo: 'AddMilestone' },
		{ title: 'Journal Entry', icon: 'create-outline', navigateTo: 'AddJournal' },
		{ title: 'Add a Gestalt', icon: 'list-outline', navigateTo: 'AddGestalt' }
	];

	const toggleProfileMenu = () => {
		if (showProfileMenu) {
			// Close menu
			Animated.timing(profileMenuAnim, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
			}).start(() => setShowProfileMenu(false));
		} else {
			// Close add menu if open
			if (showAddMenu) {
				toggleAddMenu();
			}
			// Open menu
			setShowProfileMenu(true);
			Animated.timing(profileMenuAnim, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}).start();
		}
	};

	const toggleAddMenu = () => {
		if (showAddMenu) {
			// Close menu
			Animated.timing(addMenuAnim, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
			}).start(() => setShowAddMenu(false));
		} else {
			// Close profile menu if open
			if (showProfileMenu) {
				toggleProfileMenu();
			}
			// Open menu
			setShowAddMenu(true);
			Animated.timing(addMenuAnim, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}).start();
		}
	};

	const headerBackgroundOpacity = scrollY.interpolate({
		inputRange: [0, 100],
		outputRange: [0, 1],
		extrapolate: 'clamp'
	});

	const iconOpacity = scrollY.interpolate({
		inputRange: [0, 100],
		outputRange: [1, 0],
		extrapolate: 'clamp'
	});

	const darkIconOpacity = scrollY.interpolate({
		inputRange: [0, 100],
		outputRange: [0, 1],
		extrapolate: 'clamp'
	});

	return (
		<LinearGradient
			colors={['#7C3AED', '#EC4899', '#FB923C']}
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
			style={{ flex: 1 }}
		>

			<ScrollView 
				style={{ flex: 1, backgroundColor: 'transparent' }}
				contentContainerStyle={{ paddingBottom: 60 }}
				showsVerticalScrollIndicator={false}
				onScroll={Animated.event(
					[{ nativeEvent: { contentOffset: { y: scrollY } } }],
					{ useNativeDriver: false }
				)}
				scrollEventThrottle={16}
			>
				{/* Upper Section - transparent over background gradient */}
				<View style={{ paddingBottom: 40, paddingTop: 60 }}>

				{/* Header with Hamburger Menu and Logo */}
				<View style={{ 
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
					paddingHorizontal: tokens.spacing.containerX,
					paddingTop: tokens.spacing.gap.sm,
					paddingBottom: tokens.spacing.gap.lg
				}}>
					{/* Hamburger Menu Button */}
					<TouchableOpacity 
						onPress={openDrawer}
						style={{
							padding: 8,
							marginLeft: -8
						}}
					>
						<Ionicons name="menu-outline" size={28} color="white" />
					</TouchableOpacity>

					{/* Logo and Gestalts Text - centered */}
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
						{/* Inverted Logo - white on transparent */}
						<Image 
							source={require('../../assets/Gestalts-logo.png')} 
							style={{ 
								width: 32, 
								height: 32,
								tintColor: 'white'
							}}
							resizeMode="contain"
						/>
						
						{/* Gestalts Text */}
						<Text weight="semibold" style={{
							fontSize: tokens.font.size.lg,
							fontFamily: 'PlusJakartaSans-SemiBold',
							color: 'white',
							letterSpacing: 0.3,
							textShadowColor: 'rgba(0,0,0,0.3)',
							textShadowOffset: { width: 0, height: 1 },
							textShadowRadius: 2
						}}>
							Gestalts
						</Text>
					</View>

					{/* Spacer for balance */}
					<View style={{ width: 28 }} />
				</View>

				{/* Welcome Message */}
				<View style={{ 
					paddingHorizontal: tokens.spacing.containerX,
					paddingTop: tokens.spacing.gap.lg,
					paddingBottom: tokens.spacing.gap.lg
				}}>
					<Text style={{ 
						fontSize: tokens.font.size.h2,
						fontWeight: '700',
						color: 'white',
						marginBottom: tokens.spacing.gap.xs,
						lineHeight: tokens.font.size.h2 * 1.2
					}}>
						{profile?.parentName ? `Hey, ${profile.parentName}!` : 'Hey!'}
					</Text>
					<Text style={{
						fontSize: tokens.font.size.body,
						color: 'rgba(255,255,255,0.9)',
						lineHeight: tokens.font.size.body * 1.4
					}}>
						How can we support {profile?.childName || 'your child'} today?
					</Text>
				</View>

				{/* Featured Coach Mode Cards - Shazam Style */}
				<View style={{ 
					marginBottom: tokens.spacing.sectionY.sm,
					paddingVertical: tokens.spacing.gap.lg 
				}}>
					<Animated.ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						snapToInterval={204} // cardWidth (180) + spacing (24)
						snapToAlignment="start"
						decelerationRate="fast"
						onScroll={Animated.event(
							[{ nativeEvent: { contentOffset: { x: scrollX } } }],
							{ useNativeDriver: false }
						)}
						onMomentumScrollEnd={() => {
							// Handle scroll end if needed
						}}
						scrollEventThrottle={16}
						contentContainerStyle={{
							paddingLeft: (screenWidth - 180) / 2,
							paddingRight: (screenWidth - 180) / 2
						}}
					>
						{coachModes.map((mode, index) => {
							const cardWidth = 180;
							const spacing = 24;
							
							// Each card's center position in the scroll
							const cardPosition = index * (cardWidth + spacing);
							
							const inputRange = [
								(index - 1) * (cardWidth + spacing),
								cardPosition,
								(index + 1) * (cardWidth + spacing)
							];

							const scale = scrollX.interpolate({
								inputRange,
								outputRange: [0.7, 1, 0.7],
								extrapolate: 'clamp'
							});

							const opacity = scrollX.interpolate({
								inputRange,
								outputRange: [0.4, 1, 0.4],
								extrapolate: 'clamp'
							});

							// Add overlay for inactive cards
							const overlayOpacity = scrollX.interpolate({
								inputRange,
								outputRange: [0.5, 0, 0.5],
								extrapolate: 'clamp'
							});

							return (
								<TouchableOpacity
									key={index}
									onPress={() => handleModeSelect(mode.mode)}
									activeOpacity={0.95}
									style={{
										width: 180,
										alignItems: 'center',
										marginRight: index < coachModes.length - 1 ? 24 : 0
									}}
								>
									{/* Animated Circle */}
									<Animated.View
										style={{
											transform: [{ scale }],
											opacity
										}}
									>
										{/* Liquid Glass Background */}
										<View
											style={{
												width: 180,
												height: 180,
												borderRadius: 90,
												backgroundColor: 'rgba(255,255,255,0.1)',
												borderWidth: 1.5,
												borderColor: 'rgba(255,255,255,0.2)',
												shadowColor: 'rgba(0,0,0,0.25)',
												shadowOffset: { width: 0, height: 20 },
												shadowOpacity: 0.8,
												shadowRadius: 30,
												elevation: 20,
												justifyContent: 'center',
												alignItems: 'center',
												marginBottom: tokens.spacing.gap.md,
												overflow: 'hidden'
											}}
										>
											{/* Subtle Top Gradient Highlight */}
											<View
												style={{
													position: 'absolute',
													top: 0,
													left: 0,
													right: 0,
													height: 90,
													backgroundColor: 'rgba(255,255,255,0.2)',
													borderRadius: 90
												}}
											/>
											
											{/* Inner Glass Reflection */}
											<View
												style={{
													position: 'absolute',
													top: 8,
													left: 8,
													right: 8,
													bottom: 8,
													borderRadius: 82,
													borderWidth: 0.5,
													borderColor: 'rgba(255,255,255,0.15)',
													backgroundColor: 'transparent'
												}}
											/>
											
											{/* Main Icon */}
											<Ionicons name={mode.icon as any} size={55} color="white" />
											
											{/* Overlay for inactive cards */}
											<Animated.View
												style={{
													position: 'absolute',
													top: 0,
													left: 0,
													right: 0,
													bottom: 0,
													backgroundColor: 'rgba(0,0,0,0.4)',
													borderRadius: 90,
													opacity: overlayOpacity
												}}
											/>
										</View>
									</Animated.View>

								{/* Text Below Circle */}
								<Animated.View 
									style={{ 
										alignItems: 'center',
										opacity 
									}}
								>
									<Text style={{
										fontSize: tokens.font.size.lg,
										fontWeight: '700',
										color: 'white',
										textAlign: 'center'
									}}>
										{mode.title}
									</Text>
								</Animated.View>
							</TouchableOpacity>
						);
						})}
					</Animated.ScrollView>
				</View>
			</View>

			{/* Liquid Glass Background Section */}
			<GlassView 
				intensity={0.08}
				style={{ 
					borderTopLeftRadius: 32,
					borderTopRightRadius: 32,
					marginTop: -16,
					paddingTop: 16,
					backgroundColor: 'rgba(255, 255, 255, 0.05)',
					borderTopWidth: 1,
					borderLeftWidth: 1,
					borderRightWidth: 1,
					borderColor: 'rgba(255, 255, 255, 0.2)'
				}}
			>
				{/* Learn & Grow Section */}
				<View style={{ paddingTop: tokens.spacing.gap.sm }}>
					{sections.map((section, sectionIndex) => (
						<View key={sectionIndex} style={{ marginBottom: tokens.spacing.sectionY.md }}>
							{/* Section Header */}
							<View style={{
								paddingHorizontal: tokens.spacing.containerX,
								marginBottom: tokens.spacing.gap.sm
							}}>
								<View style={{ alignItems: 'center' }}>
									<View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.gap.sm }}>
										<Text style={{
											fontSize: tokens.font.size.h3,
											fontWeight: '700',
											color: 'white',
											textAlign: 'center'
										}}>
											{section.title}
										</Text>
									</View>
								</View>
							</View>

							{/* Quick Action Tiles - For sections with colored tiles */}
							{section.quickActions && (
								sectionIndex === 0 ? (
									<View style={{
										flexDirection: 'row',
										justifyContent: 'center',
										alignItems: 'center',
										paddingHorizontal: tokens.spacing.gap.md,
										paddingVertical: tokens.spacing.gap.sm,
										gap: tokens.spacing.gap.md
									}}>
										{section.quickActions.map((action, index) => (
										<TouchableOpacity
											key={index}
											activeOpacity={0.8}
											onPress={() => handleTilePress(action.navigateTo)}
											style={{
												alignItems: 'center',
												width: sectionIndex === 0 ? 120 : 85
											}}
										>
											{/* Backdrop shadow */}
											<View style={{
												position: 'absolute',
												width: sectionIndex === 0 ? 96 : 68,
												height: sectionIndex === 0 ? 96 : 68,
												borderRadius: sectionIndex === 0 ? 28 : 20,
												backgroundColor: 'rgba(0,0,0,0.08)',
												top: 2,
												left: sectionIndex === 0 ? 12 : 8,
												zIndex: 0
											}} />
											<View style={{
												width: sectionIndex === 0 ? 96 : 68,
												height: sectionIndex === 0 ? 96 : 68,
												borderRadius: sectionIndex === 0 ? 28 : 20,
												shadowColor: '#7C3AED',
												shadowOffset: { width: 0, height: 6 },
												shadowOpacity: 0.2,
												shadowRadius: 12,
												elevation: 8,
												marginBottom: tokens.spacing.gap.xs,
												position: 'relative',
												alignItems: 'center',
												justifyContent: 'center',
												overflow: 'visible'
											}}>
																													{/* Enhanced Liquid Glass Background */}
																	<View
																		style={{
																			position: 'absolute',
																			top: 0,
																			left: 0,
																			right: 0,
																			bottom: 0,
																			borderRadius: sectionIndex === 0 ? 28 : 20,
																			backgroundColor: 'rgba(255, 255, 255, 0.15)',
																			// Inner shadow for depth
																			shadowColor: 'rgba(0,0,0,0.1)',
																			shadowOffset: { width: 0, height: 2 },
																			shadowOpacity: 1,
																			shadowRadius: 4
																		}}
																	/>
												
												{/* Liquid Glass Highlight */}
												<View style={{
													position: 'absolute',
													top: 0,
													left: 0,
													right: 0,
													height: '45%',
													borderRadius: sectionIndex === 0 ? 28 : 20,
													backgroundColor: 'rgba(255, 255, 255, 0.3)',
													opacity: 0.8
												}} />
												
												{/* Enhanced Glass Border */}
												<View style={{
													position: 'absolute',
													top: 0,
													left: 0,
													right: 0,
													bottom: 0,
													borderRadius: sectionIndex === 0 ? 28 : 20,
													borderWidth: 1.5,
													borderColor: 'rgba(255, 255, 255, 0.4)'
												}} />
												
												{/* Inner Glass Ring */}
												<View style={{
													position: 'absolute',
													top: 2,
													left: 2,
													right: 2,
													bottom: 2,
													borderRadius: sectionIndex === 0 ? 26 : 18,
													borderWidth: 0.5,
													borderColor: 'rgba(255, 255, 255, 0.2)'
												}} />
												
												
												<Ionicons 
													name={action.icon as any} 
													size={sectionIndex === 0 ? 42 : 32} 
													color='white' 
													style={{ zIndex: 1 }}
												/>
												
												{/* Count badge */}
												{action.count !== undefined && action.count > 0 && (
													<View style={{
														position: 'absolute',
														top: -6,
														right: -6,
														backgroundColor: '#EF4444',
														borderRadius: 12,
														width: 24,
														height: 24,
														alignItems: 'center',
														justifyContent: 'center',
														borderWidth: 2,
														borderColor: 'white',
														shadowColor: '#000',
														shadowOffset: { width: 0, height: 2 },
														shadowOpacity: 0.2,
														shadowRadius: 4,
														elevation: 8,
														zIndex: 10
													}}>
														<Text style={{
															color: 'white',
															fontSize: 10,
															fontWeight: '700'
														}}>
															{action.count}
														</Text>
													</View>
												)}
											</View>
											<Text style={{
												fontSize: tokens.font.size.xs,
												color: 'white',
												textAlign: 'center',
												fontWeight: '500',
												lineHeight: tokens.font.size.xs * 1.2
											}}>
												{action.title}
											</Text>
										</TouchableOpacity>
									))}
									</View>
								) : (
									<ScrollView 
										horizontal 
										showsHorizontalScrollIndicator={false}
										contentContainerStyle={{
											paddingHorizontal: tokens.spacing.gap.md,
											paddingVertical: tokens.spacing.gap.sm,
											gap: tokens.spacing.gap.xs
										}}
									>
										{section.quickActions.map((action, index) => (
											<TouchableOpacity
												key={index}
												activeOpacity={0.8}
												onPress={() => handleTilePress(action.navigateTo)}
												style={{
													alignItems: 'center',
													width: 85
												}}
											>
												{/* Backdrop shadow */}
												<View style={{
													position: 'absolute',
													width: 68,
													height: 68,
													borderRadius: 20,
													backgroundColor: 'rgba(0,0,0,0.08)',
													top: 2,
													left: 8,
													zIndex: 0
												}} />
												<View style={{
													width: 68,
													height: 68,
													borderRadius: 20,
													shadowColor: '#7C3AED',
													shadowOffset: { width: 0, height: 6 },
													shadowOpacity: 0.2,
													shadowRadius: 12,
													elevation: 8,
													marginBottom: tokens.spacing.gap.xs,
													position: 'relative',
													alignItems: 'center',
													justifyContent: 'center',
													overflow: 'visible'
												}}>
																																{/* Enhanced Liquid Glass Background */}
																			<View
																				style={{
																					position: 'absolute',
																					top: 0,
																					left: 0,
																					right: 0,
																					bottom: 0,
																					borderRadius: 20,
																					backgroundColor: 'rgba(255, 255, 255, 0.15)',
																					// Inner shadow for depth
																					shadowColor: 'rgba(0,0,0,0.1)',
																					shadowOffset: { width: 0, height: 2 },
																					shadowOpacity: 1,
																					shadowRadius: 4
																				}}
																			/>
													
													{/* Liquid Glass Highlight */}
													<View style={{
														position: 'absolute',
														top: 0,
														left: 0,
														right: 0,
														height: '45%',
														borderRadius: 20,
														backgroundColor: 'rgba(255, 255, 255, 0.3)',
														opacity: 0.8
													}} />
													
													{/* Enhanced Glass Border */}
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
													
													{/* Inner Glass Ring */}
													<View style={{
														position: 'absolute',
														top: 2,
														left: 2,
														right: 2,
														bottom: 2,
														borderRadius: 18,
														borderWidth: 0.5,
														borderColor: 'rgba(255, 255, 255, 0.2)'
													}} />
													
													
													<Ionicons 
														name={action.icon as any} 
														size={32} 
														color='white' 
														style={{ zIndex: 1 }}
													/>
													
													{/* Count badge */}
													{action.count !== undefined && action.count > 0 && (
														<View style={{
															position: 'absolute',
															top: -6,
															right: -6,
															backgroundColor: '#EF4444',
															borderRadius: 12,
															width: 24,
															height: 24,
															alignItems: 'center',
															justifyContent: 'center',
															borderWidth: 2,
															borderColor: 'white',
															shadowColor: '#000',
															shadowOffset: { width: 0, height: 2 },
															shadowOpacity: 0.2,
															shadowRadius: 4,
															elevation: 8,
															zIndex: 10
														}}>
															<Text style={{
																color: 'white',
																fontSize: 10,
																fontWeight: '700'
															}}>
																{action.count}
															</Text>
														</View>
													)}
												</View>
												<Text style={{
													fontSize: tokens.font.size.xs,
													color: 'white',
													textAlign: 'center',
													fontWeight: '500',
													lineHeight: tokens.font.size.xs * 1.2
												}}>
													{action.title}
												</Text>
											</TouchableOpacity>
										))}
									</ScrollView>
								)
							)}

						</View>
					))}
				</View>
			</GlassView>
			</ScrollView>

			{/* Center Microphone Button - Popping out of bottom nav */}
			<TouchableOpacity style={{ 
				position: 'absolute',
				bottom: 42, // Position above the bottom nav
				left: '50%',
				marginLeft: -32, // Half of button width to center
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
						{/* Glass overlay for mic button */}
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

		</LinearGradient>
	);
}