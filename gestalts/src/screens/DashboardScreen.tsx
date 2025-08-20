import React, { useState, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Animated, Image } from 'react-native';
import { Text, useTheme } from '../theme';
import { useMemoriesStore } from '../state/useStore';
import { Ionicons } from '@expo/vector-icons';
import { useDrawer } from '../navigation/SimpleDrawer';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

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

	const sections = [
		{
			title: 'Learn & Grow',
			icon: 'arrow-forward',
			quickActions: [
				{ title: 'Play Analyzer', icon: 'sync', color: '#7C3AED', navigateTo: 'Play' },
				{ title: 'Storybook', icon: 'book-open', color: '#7C3AED', navigateTo: 'Stories' },
				{ title: 'Knowledge', icon: 'bulb-outline', color: '#7C3AED', navigateTo: 'Knowledge' }
			]
		},
		{
			title: 'Record & Track',
			icon: 'arrow-forward',
			quickActions: [
				{ title: 'Add Memory', icon: 'add-circle-outline', color: '#7C3AED', navigateTo: 'AddMemory' },
				{ title: 'Appointment Notes', icon: 'calendar-outline', color: '#7C3AED', navigateTo: 'Appointments', count: appointmentNotes.length },
				{ title: 'Journal', icon: 'create-outline', color: '#7C3AED', navigateTo: 'Journal', count: journal.length },
				{ title: 'Milestones', icon: 'flag-outline', color: '#7C3AED', navigateTo: 'Milestones', count: milestones.length },
				{ title: 'Gestalt Lists', icon: 'list-outline', color: '#7C3AED', navigateTo: 'GestaltLists' },
				{ title: 'Reports', icon: 'analytics-outline', color: '#7C3AED', navigateTo: 'Reports' }
			]
		}
	];

	const [scrollY] = useState(new Animated.Value(0));
	const [showProfileMenu, setShowProfileMenu] = useState(false);
	const profileMenuAnim = useRef(new Animated.Value(0)).current;

	const profileMenuOptions = [
		{ title: 'Child Profile', icon: 'person-outline', navigateTo: 'ChildProfile' },
		{ title: 'Specialist', icon: 'medical-outline', navigateTo: 'Specialist' },
		{ title: 'My Profile', icon: 'settings-outline', navigateTo: 'MyProfile' }
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
			// Open menu
			setShowProfileMenu(true);
			Animated.timing(profileMenuAnim, {
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

				{/* Logo and Gestalts Text */}
				<View style={{ 
					alignItems: 'center',
					paddingHorizontal: tokens.spacing.containerX,
					paddingTop: tokens.spacing.gap.sm,
					paddingBottom: tokens.spacing.gap.lg
				}}>
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
						
						{/* Gestalts Text - left aligned */}
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
				</View>

				{/* Welcome Message */}
				<View style={{ 
					paddingHorizontal: tokens.spacing.containerX,
					paddingTop: tokens.spacing.gap.xl,
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
			<View 
				style={{ 
					backgroundColor: 'rgba(255,255,255,0.15)',
					borderTopLeftRadius: 32,
					borderTopRightRadius: 32,
					marginTop: -16,
					paddingTop: 16,
					shadowColor: 'rgba(124,58,237,0.3)',
					shadowOffset: { width: 0, height: -8 },
					shadowOpacity: 0.4,
					shadowRadius: 24,
					elevation: 15,
					borderTopWidth: 2,
					borderLeftWidth: 1,
					borderRightWidth: 1,
					borderColor: 'rgba(255,255,255,0.3)',
					overflow: 'hidden',
					// Add backdrop filter effect through opacity layers
					backdropFilter: 'blur(20px)'
				}}
			>
				{/* Simplified liquid glass background */}
				<LinearGradient
					colors={[
						'rgba(255,255,255,0.85)',
						'rgba(255,255,255,0.75)',
						'rgba(255,255,255,0.8)'
					]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						borderTopLeftRadius: 32,
						borderTopRightRadius: 32
					}}
				/>
				
				{/* Subtle top highlight */}
				<LinearGradient
					colors={[
						'rgba(255,255,255,0.4)',
						'rgba(255,255,255,0.1)',
						'rgba(255,255,255,0.0)'
					]}
					start={{ x: 0, y: 0 }}
					end={{ x: 0, y: 1 }}
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						height: 60,
						borderTopLeftRadius: 32,
						borderTopRightRadius: 32
					}}
				/>
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
											color: '#5B21B6',
											textAlign: 'center'
										}}>
											{section.title}
										</Text>
										{section.count !== undefined && section.count > 0 && (
											<View style={{
												backgroundColor: '#EC4899',
												borderRadius: 12,
												paddingHorizontal: 10,
												paddingVertical: 4,
												minWidth: 24,
												alignItems: 'center'
											}}>
												<Text style={{
													color: 'white',
													fontSize: tokens.font.size.xs,
													fontWeight: '700'
												}}>
													{section.count}
												</Text>
											</View>
										)}
									</View>
								</View>
							</View>

							{/* Quick Action Tiles - For sections with colored tiles */}
							{section.quickActions && (
								<ScrollView 
									horizontal 
									showsHorizontalScrollIndicator={false}
									contentContainerStyle={{
										paddingHorizontal: tokens.spacing.gap.md,
										paddingVertical: tokens.spacing.gap.sm,
										gap: sectionIndex === 0 ? tokens.spacing.gap.md : tokens.spacing.gap.xs
									}}
								>
									{section.quickActions.map((action, index) => (
										<TouchableOpacity
											key={index}
											activeOpacity={0.8}
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
												{/* Dynamic gradient background */}
												<LinearGradient
													colors={sectionIndex === 0 ? [
														'#6B21A8',
														'#7C3AED',
														'#6B21A8'
													] : [
														'rgba(255,255,255,0.95)', 
														'rgba(255,255,255,0.85)', 
														'rgba(255,255,255,0.9)'
													]}
													start={{ x: 0, y: 0 }}
													end={{ x: 1, y: 1 }}
													style={{
														position: 'absolute',
														top: 0,
														left: 0,
														right: 0,
														bottom: 0,
														borderRadius: sectionIndex === 0 ? 28 : 20
													}}
												/>
												
												{/* Glass border */}
												<View style={{
													position: 'absolute',
													top: 0,
													left: 0,
													right: 0,
													bottom: 0,
													borderRadius: sectionIndex === 0 ? 28 : 20,
													borderWidth: 1.5,
													borderColor: sectionIndex === 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.5)'
												}} />
												
												{/* Glass reflection overlay */}
												<LinearGradient
													colors={sectionIndex === 0 ? [
														'rgba(255,255,255,0.6)',
														'rgba(255,255,255,0.2)',
														'rgba(255,255,255,0.1)'
													] : [
														'rgba(255,255,255,0.4)',
														'rgba(255,255,255,0.2)',
														'rgba(255,255,255,0.0)'
													]}
													start={{ x: 0, y: 0 }}
													end={{ x: 1, y: 1 }}
													style={{
														position: 'absolute',
														top: 0,
														left: 0,
														right: 0,
														height: '60%',
														borderTopLeftRadius: sectionIndex === 0 ? 28 : 20,
														borderTopRightRadius: sectionIndex === 0 ? 28 : 20
													}}
												/>
												
												{/* Inner glass highlight */}
												<View style={{
													position: 'absolute',
													top: 2,
													left: 2,
													right: 2,
													bottom: 2,
													borderRadius: sectionIndex === 0 ? 26 : 18,
													borderWidth: 1,
													borderColor: sectionIndex === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)'
												}} />
												
												<Ionicons 
													name={action.icon as any} 
													size={sectionIndex === 0 ? 42 : 32} 
													color={sectionIndex === 0 ? 'white' : action.color} 
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
												color: '#5B21B6',
												textAlign: 'center',
												fontWeight: '500',
												lineHeight: tokens.font.size.xs * 1.2
											}}>
												{action.title}
											</Text>
										</TouchableOpacity>
									))}
								</ScrollView>
							)}

						</View>
					))}
				</View>
				
			</View>
			</ScrollView>

			{/* Center Microphone Button - Popping out of bottom nav */}
			<TouchableOpacity style={{ 
				position: 'absolute',
				bottom: 35, // Position above the bottom nav
				left: '50%',
				marginLeft: -28, // Half of button width to center
				zIndex: 1000
			}}>
				<View style={{
					width: 56,
					height: 56,
					borderRadius: 28,
					overflow: 'hidden',
					shadowColor: tokens.color.brand.gradient.start,
					shadowOffset: { width: 0, height: 8 },
					shadowOpacity: 0.5,
					shadowRadius: 16,
					elevation: 12
				}}>
					<LinearGradient
						colors={[tokens.color.brand.gradient.start, tokens.color.brand.gradient.mid]}
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
						
						<Ionicons name="mic" size={24} color="white" style={{ zIndex: 1 }} />
					</LinearGradient>
				</View>
			</TouchableOpacity>

			{/* Shadow Base Layer for Dramatic Effect */}
			<View style={{
				position: 'absolute',
				bottom: 0,
				left: 0,
				right: 0,
				height: 100,
				backgroundColor: 'transparent',
				shadowColor: '#000000',
				shadowOffset: { width: 0, height: -15 },
				shadowOpacity: 0.25,
				shadowRadius: 30,
				elevation: 25
			}} />

			{/* Compact Sticky Bottom Navigation */}
			<View style={{
				position: 'absolute',
				bottom: 0,
				left: 0,
				right: 0,
				backgroundColor: 'white',
				borderTopWidth: 0,
				paddingTop: tokens.spacing.gap.sm,
				paddingHorizontal: tokens.spacing.gap.md,
				paddingBottom: tokens.spacing.gap.sm + 10, // Extra for safe area
				height: 75,
				// Dramatic upward shadow
				shadowColor: '#000000',
				shadowOffset: { width: 0, height: -12 },
				shadowOpacity: 0.2,
				shadowRadius: 25,
				elevation: 30,
				overflow: 'visible'
			}}>
				{/* Bright white glow at top edge */}
				<View style={{
					position: 'absolute',
					top: -6,
					left: 0,
					right: 0,
					height: 6,
					backgroundColor: 'white',
					shadowColor: 'white',
					shadowOffset: { width: 0, height: 0 },
					shadowOpacity: 1,
					shadowRadius: 8,
					elevation: 5
				}} />
				
				{/* White glow gradient overlay */}
				<LinearGradient
					colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)']}
					start={{ x: 0, y: 0 }}
					end={{ x: 0, y: 1 }}
					style={{
						position: 'absolute',
						top: -3,
						left: 0,
						right: 0,
						height: 20
					}}
				/>
				
				<View style={{ 
					flexDirection: 'row', 
					alignItems: 'center', 
					justifyContent: 'space-between',
					flex: 1,
					paddingHorizontal: tokens.spacing.gap.xs
				}}>
					{/* Menu Button */}
					<TouchableOpacity onPress={openDrawer} style={{ alignItems: 'center', width: 60 }}>
						<Ionicons name="menu-outline" size={22} color={tokens.color.text.secondary} />
						<Text style={{ 
							fontSize: 10, 
							color: tokens.color.text.secondary, 
							marginTop: 3,
							fontWeight: '500'
						}}>
							Menu
						</Text>
					</TouchableOpacity>
					
					{/* Add Memory Button */}
					<TouchableOpacity style={{ alignItems: 'center', width: 60 }}>
						<Ionicons name="add-outline" size={22} color={tokens.color.text.secondary} />
						<Text style={{ 
							fontSize: 10, 
							color: tokens.color.text.secondary, 
							marginTop: 3,
							fontWeight: '500'
						}}>
							Add
						</Text>
					</TouchableOpacity>
					
					{/* Spacer for center button */}
					<View style={{ width: 56 }} />
					
					{/* View Memories Button */}
					<TouchableOpacity style={{ alignItems: 'center', width: 60 }}>
						<Ionicons name="book-outline" size={22} color={tokens.color.text.secondary} />
						<Text style={{ 
							fontSize: 10, 
							color: tokens.color.text.secondary, 
							marginTop: 3,
							fontWeight: '500'
						}}>
							Memories
						</Text>
					</TouchableOpacity>
					
					{/* Profile Button */}
					<TouchableOpacity onPress={toggleProfileMenu} style={{ alignItems: 'center', width: 60 }}>
						<Ionicons name="person-outline" size={22} color={tokens.color.text.secondary} />
						<Text style={{ 
							fontSize: 10, 
							color: tokens.color.text.secondary, 
							marginTop: 3,
							fontWeight: '500'
						}}>
							Profile
						</Text>
					</TouchableOpacity>
				</View>
			</View>

			{/* Profile Menu Overlay */}
			{showProfileMenu && (
				<Animated.View
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(0,0,0,0.1)',
						opacity: profileMenuAnim
					}}
				>
					<TouchableOpacity 
						style={{ flex: 1 }}
						onPress={toggleProfileMenu}
						activeOpacity={1}
					/>
				</Animated.View>
			)}

			{/* Animated Profile Dropdown Menu */}
			{showProfileMenu && (
				<Animated.View
					style={{
						position: 'absolute',
						bottom: 85, // Just above the bottom nav
						right: tokens.spacing.containerX,
						backgroundColor: 'white',
						borderRadius: tokens.radius.xl,
						shadowColor: '#000',
						shadowOffset: { width: 0, height: 8 },
						shadowOpacity: 0.15,
						shadowRadius: 20,
						elevation: 15,
						overflow: 'hidden',
						minWidth: 180,
						transform: [
							{
								translateY: profileMenuAnim.interpolate({
									inputRange: [0, 1],
									outputRange: [20, 0],
								})
							},
							{
								scale: profileMenuAnim.interpolate({
									inputRange: [0, 1],
									outputRange: [0.95, 1],
								})
							}
						],
						opacity: profileMenuAnim
					}}
				>
					{/* Glass effect background */}
					<LinearGradient
						colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
						}}
					/>
					
					{profileMenuOptions.map((option, index) => (
						<TouchableOpacity
							key={option.title}
							onPress={() => {
								console.log('Navigate to:', option.navigateTo);
								toggleProfileMenu();
							}}
							activeOpacity={0.7}
							style={{
								alignItems: 'center',
								justifyContent: 'center',
								paddingHorizontal: tokens.spacing.gap.lg,
								paddingVertical: tokens.spacing.gap.md,
								borderBottomWidth: index !== profileMenuOptions.length - 1 ? 0.5 : 0,
								borderBottomColor: 'rgba(124,58,237,0.1)',
								backgroundColor: 'transparent'
							}}
						>
							<Text style={{
								fontSize: 10,
								color: tokens.color.text.secondary,
								fontWeight: '500',
								textAlign: 'center'
							}}>
								{option.title}
							</Text>
						</TouchableOpacity>
					))}
				</Animated.View>
			)}
		</LinearGradient>
	);
}