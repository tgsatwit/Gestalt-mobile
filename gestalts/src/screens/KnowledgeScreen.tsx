import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '../navigation/SimpleDrawer';
import { useNavigation } from '@react-navigation/native';
import { BottomNavigation } from '../components/BottomNavigation';

export default function KnowledgeScreen() {
	const { tokens } = useTheme();
	const { openDrawer } = useDrawer();
	const navigation = useNavigation();

	const knowledgeCategories = [
		{
			title: 'Understanding GLP',
			description: 'Learn the basics of Gestalt Language Processing',
			icon: 'school',
			color: '#7C3AED',
			articles: 12
		},
		{
			title: 'Stages of Development',
			description: 'Detailed guide through all 6 stages',
			icon: 'trending-up',
			color: '#EC4899',
			articles: 6
		},
		{
			title: 'Daily Strategies',
			description: 'Practical tips for everyday interactions',
			icon: 'bulb',
			color: '#F59E0B',
			articles: 18
		},
		{
			title: 'Communication Tips',
			description: 'Effective ways to support language',
			icon: 'chatbubbles',
			color: '#10B981',
			articles: 15
		},
		{
			title: 'Resources & Research',
			description: 'Latest studies and expert insights',
			icon: 'library',
			color: '#3B82F6',
			articles: 8
		},
		{
			title: 'Success Stories',
			description: 'Real experiences from other families',
			icon: 'heart',
			color: '#EF4444',
			articles: 10
		}
	];

	const recentArticles = [
		{
			title: 'Natural Language Acquisition Through Play',
			readTime: '5 min read',
			category: 'Daily Strategies',
			isNew: true
		},
		{
			title: 'Understanding Echolalia as Communication',
			readTime: '8 min read',
			category: 'Understanding GLP',
			isNew: false
		},
		{
			title: 'Moving from Scripts to Flexible Language',
			readTime: '6 min read',
			category: 'Stages of Development',
			isNew: true
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
							Knowledge Base
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
				<ScrollView contentContainerStyle={{ padding: tokens.spacing.containerX, paddingBottom: 120 }}>
				{/* Search Bar */}
				<TouchableOpacity style={{
					backgroundColor: tokens.color.surface,
					borderRadius: tokens.radius.lg,
					padding: tokens.spacing.gap.md,
					flexDirection: 'row',
					alignItems: 'center',
					marginBottom: tokens.spacing.gap.lg
				}}>
					<Ionicons name="search" size={20} color={tokens.color.text.secondary} />
					<Text color="secondary" style={{ 
						marginLeft: tokens.spacing.gap.sm,
						fontSize: tokens.font.size.body 
					}}>
						Search articles and resources...
					</Text>
				</TouchableOpacity>

				{/* Featured Article */}
				<TouchableOpacity style={{
					backgroundColor: 'rgba(124, 58, 237, 0.05)',
					borderRadius: tokens.radius.xl,
					padding: tokens.spacing.gap.lg,
					marginBottom: tokens.spacing.gap.lg,
					borderWidth: 1,
					borderColor: 'rgba(124, 58, 237, 0.1)'
				}}>
					<View style={{ 
						backgroundColor: '#7C3AED',
						paddingHorizontal: tokens.spacing.gap.sm,
						paddingVertical: 4,
						borderRadius: tokens.radius.sm,
						alignSelf: 'flex-start',
						marginBottom: tokens.spacing.gap.sm
					}}>
						<Text style={{ 
							color: 'white', 
							fontSize: tokens.font.size.xs, 
							fontWeight: '600' 
						}}>
							FEATURED
						</Text>
					</View>
					<Text style={{ 
						fontSize: tokens.font.size.xl, 
						fontWeight: '700',
						marginBottom: tokens.spacing.gap.xs 
					}}>
						Getting Started with GLP
					</Text>
					<Text color="secondary" style={{ marginBottom: tokens.spacing.gap.sm }}>
						A comprehensive guide for parents new to Gestalt Language Processing
					</Text>
					<Text style={{ 
						color: '#7C3AED',
						fontWeight: '600',
						fontSize: tokens.font.size.sm 
					}}>
						Read now →
					</Text>
				</TouchableOpacity>

				{/* Categories */}
				<Text weight="semibold" style={{ 
					fontSize: tokens.font.size.lg,
					marginBottom: tokens.spacing.gap.md 
				}}>
					Browse Categories
				</Text>

				<View style={{ 
					flexDirection: 'row',
					flexWrap: 'wrap',
					marginHorizontal: -tokens.spacing.gap.xs,
					marginBottom: tokens.spacing.gap.lg
				}}>
					{knowledgeCategories.map((category, index) => (
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
								height: 140,
								justifyContent: 'space-between'
							}}>
								<View>
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
										marginBottom: 2 
									}}>
										{category.title}
									</Text>
									<Text color="secondary" style={{ 
										fontSize: tokens.font.size.xs,
										lineHeight: tokens.font.size.xs * 1.3
									}}>
										{category.description}
									</Text>
								</View>
								<Text style={{ 
									fontSize: tokens.font.size.xs,
									color: category.color,
									fontWeight: '600' 
								}}>
									{category.articles} articles
								</Text>
							</View>
						</TouchableOpacity>
					))}
				</View>

				{/* Recent Articles */}
				<Text weight="semibold" style={{ 
					fontSize: tokens.font.size.lg,
					marginBottom: tokens.spacing.gap.md 
				}}>
					Recent Articles
				</Text>

				{recentArticles.map((article, index) => (
					<TouchableOpacity
						key={index}
						style={{
							backgroundColor: tokens.color.surface,
							borderRadius: tokens.radius.lg,
							padding: tokens.spacing.gap.md,
							marginBottom: tokens.spacing.gap.sm,
							flexDirection: 'row',
							alignItems: 'center'
						}}
					>
						<View style={{ flex: 1 }}>
							<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
								{article.isNew && (
									<View style={{
										backgroundColor: '#10B981',
										paddingHorizontal: 6,
										paddingVertical: 2,
										borderRadius: tokens.radius.xs,
										marginRight: tokens.spacing.gap.xs
									}}>
										<Text style={{ 
											color: 'white', 
											fontSize: 10, 
											fontWeight: '600' 
										}}>
											NEW
										</Text>
									</View>
								)}
								<Text style={{ 
									fontSize: tokens.font.size.xs,
									color: tokens.color.text.tertiary 
								}}>
									{article.category}
								</Text>
							</View>
							<Text weight="medium" style={{ marginBottom: 2 }}>
								{article.title}
							</Text>
							<Text color="secondary" style={{ fontSize: tokens.font.size.sm }}>
								{article.readTime}
							</Text>
						</View>
						<Ionicons name="chevron-forward" size={20} color={tokens.color.text.secondary} />
					</TouchableOpacity>
				))}

				{/* Quick Links */}
				<View style={{
					backgroundColor: 'rgba(59, 130, 246, 0.05)',
					borderRadius: tokens.radius.xl,
					padding: tokens.spacing.gap.lg,
					marginTop: tokens.spacing.gap.lg
				}}>
					<Text weight="semibold" style={{ marginBottom: tokens.spacing.gap.md }}>
						Quick Links
					</Text>
					<TouchableOpacity style={{ 
						flexDirection: 'row',
						alignItems: 'center',
						marginBottom: tokens.spacing.gap.sm 
					}}>
						<Ionicons name="download-outline" size={20} color="#3B82F6" />
						<Text style={{ 
							marginLeft: tokens.spacing.gap.sm,
							color: '#3B82F6',
							fontWeight: '500' 
						}}>
							Download GLP Guide PDF
						</Text>
					</TouchableOpacity>
					<TouchableOpacity style={{ 
						flexDirection: 'row',
						alignItems: 'center',
						marginBottom: tokens.spacing.gap.sm 
					}}>
						<Ionicons name="videocam-outline" size={20} color="#3B82F6" />
						<Text style={{ 
							marginLeft: tokens.spacing.gap.sm,
							color: '#3B82F6',
							fontWeight: '500' 
						}}>
							Watch Video Tutorials
						</Text>
					</TouchableOpacity>
					<TouchableOpacity style={{ 
						flexDirection: 'row',
						alignItems: 'center' 
					}}>
						<Ionicons name="people-outline" size={20} color="#3B82F6" />
						<Text style={{ 
							marginLeft: tokens.spacing.gap.sm,
							color: '#3B82F6',
							fontWeight: '500' 
						}}>
							Join Parent Community
						</Text>
						</TouchableOpacity>
					</View>
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

			<BottomNavigation />
		</LinearGradient>
	);
}