import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '../navigation/SimpleDrawer';
import { useNavigation } from '@react-navigation/native';
import { GradientButton } from '../components/GradientButton';

export default function StorybookScreen() {
	const { tokens } = useTheme();
	const { openDrawer } = useDrawer();
	const navigation = useNavigation();
	const [selectedStory, setSelectedStory] = useState<string | null>(null);

	const stories = [
		{
			id: '1',
			title: 'The Playground Adventure',
			description: 'A story about making friends at the playground',
			ageRange: '3-5 years',
			duration: '5 min',
			gestaltStage: 'Stage 2-3',
			icon: 'sunny'
		},
		{
			id: '2',
			title: 'Going to the Store',
			description: 'Practice shopping vocabulary and phrases',
			ageRange: '4-6 years',
			duration: '7 min',
			gestaltStage: 'Stage 3-4',
			icon: 'cart'
		},
		{
			id: '3',
			title: 'Bedtime Routines',
			description: 'Familiar phrases for bedtime',
			ageRange: '2-4 years',
			duration: '4 min',
			gestaltStage: 'Stage 1-2',
			icon: 'moon'
		},
		{
			id: '4',
			title: 'Animal Friends',
			description: 'Learn about animals and their sounds',
			ageRange: '2-5 years',
			duration: '6 min',
			gestaltStage: 'Stage 2',
			icon: 'paw'
		}
	];

	const storyCategories = [
		{ name: 'Daily Routines', count: 12, color: '#EC4899' },
		{ name: 'Social Stories', count: 8, color: '#8B5CF6' },
		{ name: 'Emotions', count: 6, color: '#3B82F6' },
		{ name: 'Adventure', count: 10, color: '#10B981' }
	];

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
							Storybook
						</Text>
					</View>
					
					{/* Right Side Controls */}
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.gap.sm }}>
						{/* Settings Button */}
						<TouchableOpacity
							activeOpacity={0.7}
							style={{
								padding: 6
							}}
						>
							<Ionicons name="ellipsis-horizontal" size={18} color="white" />
						</TouchableOpacity>

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

			{/* Content Container with curved top */}
			<View style={{ 
				flex: 1, 
				backgroundColor: 'white', 
				borderTopLeftRadius: 24, 
				borderTopRightRadius: 24
			}}>
				<ScrollView contentContainerStyle={{ padding: tokens.spacing.containerX, paddingBottom: 40 }}>
				{/* Introduction */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text style={{ 
						fontSize: tokens.font.size.h2, 
						fontWeight: '700',
						marginBottom: tokens.spacing.gap.sm 
					}}>
						Interactive Stories
					</Text>
					<Text color="secondary">
						Engage with stories designed for Gestalt Language Processors, featuring natural language chunks and repetitive patterns.
					</Text>
				</View>

				{/* Story Categories */}
				<ScrollView 
					horizontal 
					showsHorizontalScrollIndicator={false}
					style={{ marginBottom: tokens.spacing.gap.lg }}
				>
					{storyCategories.map((category, index) => (
						<TouchableOpacity
							key={index}
							style={{
								backgroundColor: category.color + '15',
								borderRadius: tokens.radius.lg,
								paddingHorizontal: tokens.spacing.gap.md,
								paddingVertical: tokens.spacing.gap.sm,
								marginRight: tokens.spacing.gap.sm,
								borderWidth: 1,
								borderColor: category.color + '30'
							}}
						>
							<Text style={{ 
								color: category.color, 
								fontWeight: '600',
								fontSize: tokens.font.size.sm 
							}}>
								{category.name} ({category.count})
							</Text>
						</TouchableOpacity>
					))}
				</ScrollView>

				{/* Featured Story */}
				<TouchableOpacity style={{
					backgroundColor: 'rgba(139, 92, 246, 0.1)',
					borderRadius: tokens.radius.xl,
					padding: tokens.spacing.gap.lg,
					marginBottom: tokens.spacing.gap.lg,
					borderWidth: 1,
					borderColor: 'rgba(139, 92, 246, 0.2)'
				}}>
					<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: tokens.spacing.gap.sm }}>
						<View style={{
							backgroundColor: '#8B5CF6',
							paddingHorizontal: tokens.spacing.gap.sm,
							paddingVertical: 4,
							borderRadius: tokens.radius.sm,
							marginRight: tokens.spacing.gap.sm
						}}>
							<Text style={{ color: 'white', fontSize: tokens.font.size.xs, fontWeight: '600' }}>
								FEATURED
							</Text>
						</View>
						<Text color="secondary" style={{ fontSize: tokens.font.size.sm }}>
							Today's Story
						</Text>
					</View>
					<Text style={{ 
						fontSize: tokens.font.size.xl, 
						fontWeight: '700',
						marginBottom: tokens.spacing.gap.xs 
					}}>
						The Rainbow Bridge
					</Text>
					<Text color="secondary" style={{ marginBottom: tokens.spacing.gap.md }}>
						A magical journey about colors and friendship
					</Text>
					<GradientButton 
						title="Start Reading" 
						colors={['#8B5CF6', '#7C3AED']}
					/>
				</TouchableOpacity>

				{/* Story Library */}
				<View>
					<Text weight="semibold" style={{ 
						fontSize: tokens.font.size.lg,
						marginBottom: tokens.spacing.gap.md 
					}}>
						Story Library
					</Text>
					
					{stories.map((story) => (
						<TouchableOpacity
							key={story.id}
							onPress={() => setSelectedStory(story.id)}
							style={{
								backgroundColor: tokens.color.surface,
								borderRadius: tokens.radius.lg,
								padding: tokens.spacing.gap.md,
								marginBottom: tokens.spacing.gap.sm,
								borderWidth: selectedStory === story.id ? 2 : 1,
								borderColor: selectedStory === story.id ? '#8B5CF6' : tokens.color.border.default
							}}
						>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<View style={{
									width: 50,
									height: 50,
									borderRadius: tokens.radius.lg,
									backgroundColor: '#8B5CF620',
									alignItems: 'center',
									justifyContent: 'center',
									marginRight: tokens.spacing.gap.md
								}}>
									<Ionicons name={story.icon as any} size={24} color="#8B5CF6" />
								</View>
								<View style={{ flex: 1 }}>
									<Text weight="medium" style={{ marginBottom: 2 }}>
										{story.title}
									</Text>
									<Text color="secondary" style={{ 
										fontSize: tokens.font.size.sm,
										marginBottom: 4 
									}}>
										{story.description}
									</Text>
									<View style={{ flexDirection: 'row', gap: tokens.spacing.gap.sm }}>
										<Text style={{ 
											fontSize: tokens.font.size.xs,
											color: tokens.color.text.tertiary 
										}}>
											{story.ageRange}
										</Text>
										<Text style={{ 
											fontSize: tokens.font.size.xs,
											color: tokens.color.text.tertiary 
										}}>
											• {story.duration}
										</Text>
										<Text style={{ 
											fontSize: tokens.font.size.xs,
											color: '#8B5CF6',
											fontWeight: '600' 
										}}>
											{story.gestaltStage}
										</Text>
									</View>
								</View>
								<Ionicons name="chevron-forward" size={20} color={tokens.color.text.secondary} />
							</View>
						</TouchableOpacity>
					))}
				</View>

				{/* Create Custom Story */}
				<TouchableOpacity style={{
					backgroundColor: tokens.color.surface,
					borderRadius: tokens.radius.xl,
					padding: tokens.spacing.gap.lg,
					marginTop: tokens.spacing.gap.lg,
					borderWidth: 1,
					borderColor: tokens.color.border.default,
					alignItems: 'center'
				}}>
					<Ionicons name="add-circle-outline" size={32} color="#8B5CF6" />
					<Text weight="medium" style={{ 
						marginTop: tokens.spacing.gap.sm,
						marginBottom: tokens.spacing.gap.xs 
					}}>
						Create Custom Story
					</Text>
					<Text color="secondary" style={{ 
						fontSize: tokens.font.size.sm,
						textAlign: 'center' 
					}}>
						Build personalized stories for your child
					</Text>
				</TouchableOpacity>
				</ScrollView>
			</View>
		</LinearGradient>
	);
}