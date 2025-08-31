import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '../navigation/SimpleDrawer';
import { useNavigation } from '@react-navigation/native';
import { BottomNavigation } from '../components/BottomNavigation';

export default function GestaltListsScreen() {
	const { tokens } = useTheme();
	const { openDrawer } = useDrawer();
	const navigation = useNavigation();
	const [searchQuery, setSearchQuery] = useState('');

	const gestaltCategories = [
		{ name: 'Daily Routines', count: 45, color: '#7C3AED', icon: 'home' },
		{ name: 'TV/Movies', count: 32, color: '#EC4899', icon: 'tv' },
		{ name: 'Books', count: 28, color: '#10B981', icon: 'book' },
		{ name: 'Songs', count: 67, color: '#F59E0B', icon: 'musical-notes' },
		{ name: 'Games', count: 23, color: '#EF4444', icon: 'game-controller' },
		{ name: 'Social Scripts', count: 19, color: '#3B82F6', icon: 'people' }
	];

	const recentGestalts = [
		{
			phrase: "To infinity and beyond!",
			source: "Toy Story",
			category: "Movies",
			stage: "Stage 1",
			dateAdded: "2 days ago",
			contexts: ["Playing with toys", "Expressing excitement"]
		},
		{
			phrase: "Let's go on an adventure",
			source: "Daily routine",
			category: "Social Scripts",
			stage: "Stage 2",
			dateAdded: "1 week ago",
			contexts: ["Going out", "Starting activities"]
		},
		{
			phrase: "It's gonna be okay",
			source: "Parent comfort",
			category: "Daily Routines",
			stage: "Stage 3",
			dateAdded: "3 days ago",
			contexts: ["Self-soothing", "Comforting others"]
		}
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
							Gestalt Lists
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
							onPress={() => navigation.navigate('Dashboard' as never)}
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
				<ScrollView contentContainerStyle={{ padding: tokens.spacing.containerX, paddingBottom: 120 }}>
				{/* Search */}
				<View style={{
					backgroundColor: tokens.color.surface,
					borderRadius: tokens.radius.lg,
					padding: tokens.spacing.gap.md,
					flexDirection: 'row',
					alignItems: 'center',
					marginBottom: tokens.spacing.gap.lg
				}}>
					<Ionicons name="search" size={20} color={tokens.color.text.secondary} />
					<TextInput
						placeholder="Search gestalts..."
						value={searchQuery}
						onChangeText={setSearchQuery}
						style={{
							flex: 1,
							marginLeft: tokens.spacing.gap.sm,
							fontSize: tokens.font.size.body
						}}
					/>
				</View>

				{/* Add New Gestalt */}
				<TouchableOpacity style={{
					backgroundColor: 'rgba(124, 58, 237, 0.1)',
					borderColor: '#7C3AED',
					borderWidth: 1,
					borderRadius: tokens.radius.lg,
					padding: tokens.spacing.gap.lg,
					flexDirection: 'row',
					alignItems: 'center',
					marginBottom: tokens.spacing.gap.lg
				}}>
					<Ionicons name="add-circle" size={32} color="#7C3AED" />
					<View style={{ marginLeft: tokens.spacing.gap.md, flex: 1 }}>
						<Text weight="semibold" style={{ color: '#7C3AED' }}>
							Add New Gestalt
						</Text>
						<Text color="secondary" style={{ fontSize: tokens.font.size.sm }}>
							Record a new phrase or script
						</Text>
					</View>
					<Ionicons name="chevron-forward" size={20} color="#7C3AED" />
				</TouchableOpacity>

				{/* Categories */}
				<Text weight="semibold" style={{ 
					fontSize: tokens.font.size.lg,
					marginBottom: tokens.spacing.gap.md 
				}}>
					Categories
				</Text>

				<View style={{ 
					flexDirection: 'row',
					flexWrap: 'wrap',
					marginHorizontal: -tokens.spacing.gap.xs,
					marginBottom: tokens.spacing.gap.lg
				}}>
					{gestaltCategories.map((category, index) => (
						<TouchableOpacity
							key={index}
							style={{
								width: '50%',
								padding: tokens.spacing.gap.xs
							}}
						>
							<View style={{
								backgroundColor: tokens.color.surface,
								borderRadius: tokens.radius.lg,
								padding: tokens.spacing.gap.md,
								alignItems: 'center',
								minHeight: 100
							}}>
								<View style={{
									width: 40,
									height: 40,
									borderRadius: 20,
									backgroundColor: category.color + '20',
									alignItems: 'center',
									justifyContent: 'center',
									marginBottom: tokens.spacing.gap.sm
								}}>
									<Ionicons name={category.icon as any} size={20} color={category.color} />
								</View>
								<Text weight="medium" style={{ 
									fontSize: tokens.font.size.sm,
									textAlign: 'center',
									marginBottom: 2
								}}>
									{category.name}
								</Text>
								<Text style={{ 
									fontSize: tokens.font.size.xs,
									color: category.color,
									fontWeight: '600' 
								}}>
									{category.count} phrases
								</Text>
							</View>
						</TouchableOpacity>
					))}
				</View>

				{/* Recent Gestalts */}
				<Text weight="semibold" style={{ 
					fontSize: tokens.font.size.lg,
					marginBottom: tokens.spacing.gap.md 
				}}>
					Recent Additions
				</Text>

				{recentGestalts.map((gestalt, index) => (
					<TouchableOpacity
						key={index}
						style={{
							backgroundColor: tokens.color.surface,
							borderRadius: tokens.radius.lg,
							padding: tokens.spacing.gap.md,
							marginBottom: tokens.spacing.gap.sm
						}}
					>
						<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
							<View style={{ flex: 1, marginRight: tokens.spacing.gap.md }}>
								<Text weight="semibold" style={{ 
									fontSize: tokens.font.size.body,
									marginBottom: 4
								}}>
									"{gestalt.phrase}"
								</Text>
								<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
									<Text color="secondary" style={{ fontSize: tokens.font.size.sm }}>
										From: {gestalt.source}
									</Text>
									<View style={{
										backgroundColor: gestaltCategories.find(c => c.name === gestalt.category)?.color + '20' || tokens.color.surface,
										paddingHorizontal: 8,
										paddingVertical: 2,
										borderRadius: tokens.radius.sm,
										marginLeft: tokens.spacing.gap.sm
									}}>
										<Text style={{ 
											fontSize: tokens.font.size.xs,
											color: gestaltCategories.find(c => c.name === gestalt.category)?.color || tokens.color.text.secondary,
											fontWeight: '600'
										}}>
											{gestalt.stage}
										</Text>
									</View>
								</View>
								<Text color="secondary" style={{ 
									fontSize: tokens.font.size.xs,
									marginBottom: 4
								}}>
									Added {gestalt.dateAdded}
								</Text>
								<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
									{gestalt.contexts.map((context, i) => (
										<Text
											key={i}
											style={{
												fontSize: tokens.font.size.xs,
												color: tokens.color.text.tertiary,
												backgroundColor: tokens.color.border.default,
												paddingHorizontal: 6,
												paddingVertical: 2,
												borderRadius: tokens.radius.xs,
												marginRight: tokens.spacing.gap.xs,
												marginBottom: 2
											}}
										>
											{context}
										</Text>
									))}
								</View>
							</View>
							<TouchableOpacity>
								<Ionicons name="ellipsis-vertical" size={20} color={tokens.color.text.secondary} />
							</TouchableOpacity>
						</View>
					</TouchableOpacity>
				))}

				{/* Import Options */}
				<View style={{
					backgroundColor: 'rgba(16, 185, 129, 0.05)',
					borderRadius: tokens.radius.lg,
					padding: tokens.spacing.gap.lg,
					marginTop: tokens.spacing.gap.lg
				}}>
					<Text weight="semibold" style={{ marginBottom: tokens.spacing.gap.md }}>
						Import Gestalts
					</Text>
					<TouchableOpacity style={{ 
						flexDirection: 'row',
						alignItems: 'center',
						marginBottom: tokens.spacing.gap.sm 
					}}>
						<Ionicons name="cloud-download-outline" size={20} color="#10B981" />
						<Text style={{ 
							marginLeft: tokens.spacing.gap.sm,
							color: '#10B981',
							fontWeight: '500' 
						}}>
							Download common phrase library
						</Text>
					</TouchableOpacity>
					<TouchableOpacity style={{ 
						flexDirection: 'row',
						alignItems: 'center' 
					}}>
						<Ionicons name="document-text-outline" size={20} color="#10B981" />
						<Text style={{ 
							marginLeft: tokens.spacing.gap.sm,
							color: '#10B981',
							fontWeight: '500' 
						}}>
							Import from file
						</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</View>



		<BottomNavigation />
	</LinearGradient>
	);
}