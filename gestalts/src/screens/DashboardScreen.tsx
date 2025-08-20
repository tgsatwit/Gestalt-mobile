import React, { useState, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Animated } from 'react-native';
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
			icon: 'school',
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
			icon: 'game-controller',
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
				{ title: 'Play Analyzer', icon: 'game-controller-outline', color: '#7C3AED', navigateTo: 'Play' },
				{ title: 'Stories', icon: 'library-outline', color: '#7C3AED', navigateTo: 'Stories' },
				{ title: 'Knowledge', icon: 'bulb-outline', color: '#7C3AED', navigateTo: 'Knowledge' }
			]
		},
		{
			title: 'Record & Track',
			icon: 'arrow-forward',
			quickActions: [
				{ title: 'Add Memory', icon: 'add-circle-outline', color: '#7C3AED', navigateTo: 'AddMemory' },
				{ title: 'Appointment Notes', icon: 'calendar-outline', color: '#7C3AED', navigateTo: 'Appointments', count: appointmentNotes.length },
				{ title: 'Journal', icon: 'journal-outline', color: '#7C3AED', navigateTo: 'Journal', count: journal.length },
				{ title: 'Milestones', icon: 'flag-outline', color: '#7C3AED', navigateTo: 'Milestones', count: milestones.length },
				{ title: 'Gestalt Lists', icon: 'list-outline', color: '#7C3AED', navigateTo: 'GestaltLists' },
				{ title: 'Reports', icon: 'analytics-outline', color: '#7C3AED', navigateTo: 'Reports' }
			]
		},
		{
			title: 'Manage Profile',
			icon: 'arrow-forward',
			items: [
				{ title: 'Child Profile', icon: 'person-outline', navigateTo: 'ChildProfile' },
				{ title: 'Specialist', icon: 'medical-outline', navigateTo: 'Specialist' },
				{ title: 'My Profile', icon: 'settings-outline', navigateTo: 'MyProfile' }
			]
		}
	];

	const [scrollY] = useState(new Animated.Value(0));

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

				{/* Welcome Message */}
				<View style={{ 
					paddingHorizontal: tokens.spacing.containerX,
					paddingTop: tokens.spacing.sectionY.sm,
					paddingBottom: tokens.spacing.gap.lg
				}}>
					<Text style={{ 
						fontSize: tokens.font.size.h2,
						fontWeight: '700',
						color: 'white',
						marginBottom: tokens.spacing.gap.xs,
						lineHeight: tokens.font.size.h2 * 1.2
					}}>
						Hello {profile?.childName ? `${profile.childName}'s parent` : 'there'}!
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

			{/* Glassmorphism Background Section */}
			<View 
				style={{ 
					backgroundColor: 'rgba(255,255,255,0.85)',
					borderTopLeftRadius: 32,
					borderTopRightRadius: 32,
					marginTop: -32,
					paddingTop: 32,
					shadowColor: 'rgba(124,58,237,0.2)',
					shadowOffset: { width: 0, height: -4 },
					shadowOpacity: 0.3,
					shadowRadius: 16,
					elevation: 10,
					borderTopWidth: 1,
					borderLeftWidth: 0.5,
					borderRightWidth: 0.5,
					borderColor: 'rgba(255,255,255,0.6)',
					overflow: 'hidden'
				}}
			>
				{/* Subtle glass reflection overlay */}
				<LinearGradient
					colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)']}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						height: 80,
						borderTopLeftRadius: 32,
						borderTopRightRadius: 32
					}}
				/>
				{/* Learn & Grow Section */}
				<View style={{ paddingTop: tokens.spacing.gap.lg }}>
					{sections.map((section, sectionIndex) => (
						<View key={sectionIndex} style={{ marginBottom: tokens.spacing.sectionY.md }}>
							{/* Section Header */}
							<View style={{
								paddingHorizontal: tokens.spacing.containerX,
								marginBottom: tokens.spacing.gap.lg
							}}>
								<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
									<View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.gap.sm }}>
										<Text style={{
											fontSize: tokens.font.size.h3,
											fontWeight: '700',
											color: '#5B21B6'
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
									<TouchableOpacity style={{
										padding: tokens.spacing.gap.xs,
										borderRadius: tokens.radius.lg,
										backgroundColor: 'rgba(124,58,237,0.1)'
									}}>
										<Ionicons 
											name="arrow-forward" 
											size={18} 
											color='#7C3AED' 
										/>
									</TouchableOpacity>
								</View>
							</View>

							{/* Quick Action Tiles - For sections with colored tiles */}
							{section.quickActions && (
								<ScrollView 
									horizontal 
									showsHorizontalScrollIndicator={false}
									contentContainerStyle={{
										paddingHorizontal: tokens.spacing.gap.lg,
										gap: tokens.spacing.gap.md
									}}
								>
									{section.quickActions.map((action, index) => (
										<TouchableOpacity
											key={index}
											activeOpacity={0.8}
											style={{
												alignItems: 'center',
												width: 110
											}}
										>
											{/* Backdrop shadow */}
											<View style={{
												position: 'absolute',
												width: 80,
												height: 80,
												borderRadius: 24,
												backgroundColor: 'rgba(0,0,0,0.08)',
												top: 2,
												left: 15,
												zIndex: 0
											}} />
											<View style={{
												width: 80,
												height: 80,
												borderRadius: 24,
												shadowColor: '#7C3AED',
												shadowOffset: { width: 0, height: 6 },
												shadowOpacity: 0.2,
												shadowRadius: 12,
												elevation: 8,
												marginBottom: tokens.spacing.gap.md,
												position: 'relative',
												alignItems: 'center',
												justifyContent: 'center',
												overflow: 'hidden'
											}}>
												{/* Purple gradient background */}
												<LinearGradient
													colors={['rgba(255,255,255,0.6)', 'rgba(139,92,246,0.2)', 'rgba(124,58,237,0.15)']}
													start={{ x: 0, y: 0 }}
													end={{ x: 1, y: 1 }}
													style={{
														position: 'absolute',
														top: 0,
														left: 0,
														right: 0,
														bottom: 0,
														borderRadius: 24
													}}
												/>
												
												{/* Glass border */}
												<View style={{
													position: 'absolute',
													top: 0,
													left: 0,
													right: 0,
													bottom: 0,
													borderRadius: 24,
													borderWidth: 1.5,
													borderColor: 'rgba(255,255,255,0.5)'
												}} />
												
												{/* Glass reflection overlay */}
												<View style={{
													position: 'absolute',
													top: 0,
													left: 0,
													right: 0,
													height: '50%',
													backgroundColor: 'rgba(255,255,255,0.4)',
													borderTopLeftRadius: 24,
													borderTopRightRadius: 24
												}} />
												
												{/* Inner glass highlight */}
												<View style={{
													position: 'absolute',
													top: 2,
													left: 2,
													right: 2,
													bottom: 2,
													borderRadius: 22,
													borderWidth: 1,
													borderColor: 'rgba(255,255,255,0.2)'
												}} />
												
												<Ionicons 
													name={action.icon as any} 
													size={40} 
													color={action.color} 
													style={{ zIndex: 1 }}
												/>
												
												{/* Count badge */}
												{action.count !== undefined && action.count > 0 && (
													<View style={{
														position: 'absolute',
														top: -5,
														right: -5,
														backgroundColor: '#EF4444',
														borderRadius: 10,
														paddingHorizontal: 6,
														paddingVertical: 2,
														minWidth: 20,
														alignItems: 'center',
														borderWidth: 2,
														borderColor: 'white',
														shadowColor: '#000',
														shadowOffset: { width: 0, height: 2 },
														shadowOpacity: 0.2,
														shadowRadius: 4,
														elevation: 4
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
												fontSize: tokens.font.size.sm,
												color: '#5B21B6',
												textAlign: 'center',
												fontWeight: '600'
											}}>
												{action.title}
											</Text>
										</TouchableOpacity>
									))}
								</ScrollView>
							)}

							{/* List Items - For sections with vertical lists */}
							{section.items && (
								<View style={{ paddingHorizontal: tokens.spacing.containerX }}>
									{section.items.map((item, itemIndex) => (
										<TouchableOpacity
											key={itemIndex}
											activeOpacity={0.8}
											style={{
												backgroundColor: 'rgba(255,255,255,0.7)',
												borderRadius: 16,
												padding: tokens.spacing.gap.lg,
												marginBottom: tokens.spacing.gap.md,
												flexDirection: 'row',
												alignItems: 'center',
												justifyContent: 'space-between',
												shadowColor: 'rgba(124,58,237,0.15)',
												shadowOffset: { width: 0, height: 3 },
												shadowOpacity: 0.2,
												shadowRadius: 8,
												elevation: 4,
												borderWidth: 1,
												borderColor: 'rgba(255,255,255,0.8)',
												overflow: 'hidden'
											}}
										>
											{/* Subtle glass reflection for each card */}
											<View style={{
												position: 'absolute',
												top: 1,
												left: 1,
												right: 1,
												height: '40%',
												backgroundColor: 'rgba(255,255,255,0.3)',
												borderTopLeftRadius: 15,
												borderTopRightRadius: 15
											}} />
											
											<View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.gap.md, flex: 1, zIndex: 1 }}>
												<View style={{
													width: 32,
													height: 32,
													borderRadius: 16,
													backgroundColor: 'rgba(124,58,237,0.1)',
													alignItems: 'center',
													justifyContent: 'center'
												}}>
													<Ionicons 
														name={item.icon as any} 
														size={16} 
														color='#7C3AED' 
													/>
												</View>
												<View style={{ flex: 1 }}>
													<Text style={{
														fontSize: tokens.font.size.body,
														color: '#5B21B6',
														fontWeight: '500'
													}}>
														{item.title}
													</Text>
												</View>
												{item.count !== undefined && item.count > 0 && (
													<View style={{
														backgroundColor: '#EC4899',
														borderRadius: 12,
														paddingHorizontal: 8,
														paddingVertical: 4,
														marginRight: tokens.spacing.gap.sm
													}}>
														<Text style={{
															color: 'white',
															fontSize: tokens.font.size.xs,
															fontWeight: '700'
														}}>
															{item.count}
														</Text>
													</View>
												)}
											</View>
											<View style={{
												width: 32,
												height: 32,
												borderRadius: 16,
												backgroundColor: 'rgba(124,58,237,0.08)',
												alignItems: 'center',
												justifyContent: 'center',
												zIndex: 1
											}}>
												<Ionicons 
													name="chevron-forward" 
													size={16} 
													color='#7C3AED' 
												/>
											</View>
										</TouchableOpacity>
									))}
								</View>
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

			{/* Compact Sticky Bottom Navigation */}
			<View style={{
				position: 'absolute',
				bottom: 0,
				left: 0,
				right: 0,
				backgroundColor: 'rgba(255,255,255,0.95)',
				borderTopWidth: 1,
				borderTopColor: 'rgba(255,255,255,0.3)',
				paddingTop: tokens.spacing.gap.sm,
				paddingHorizontal: tokens.spacing.gap.md,
				paddingBottom: tokens.spacing.gap.sm + 10, // Extra for safe area
				height: 75,
				shadowColor: 'rgba(124,58,237,0.2)',
				shadowOffset: { width: 0, height: -4 },
				shadowOpacity: 0.3,
				shadowRadius: 12,
				elevation: 8
			}}>
				{/* Glass reflection overlay */}
				<LinearGradient
					colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
					start={{ x: 0, y: 0 }}
					end={{ x: 0, y: 1 }}
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						height: '40%'
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
					<TouchableOpacity style={{ alignItems: 'center', width: 60 }}>
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
		</LinearGradient>
	);
}