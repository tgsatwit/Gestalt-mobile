import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '../navigation/SimpleDrawer';
import { useNavigation } from '@react-navigation/native';
import { BottomNavigation } from '../navigation/BottomNavigation';
import { useFirebaseMemoriesStore } from '../state/useFirebaseMemoriesStore';
import { useMemoriesStore } from '../state/useStore';
import { getAuth } from 'firebase/auth';
import dayjs from 'dayjs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export default function GestaltListsScreen() {
	const { tokens } = useTheme();
	const { openDrawer } = useDrawer();
	const navigation = useNavigation<NavigationProp>();
	const [searchQuery, setSearchQuery] = useState('');
	
	// Firebase memories store
	const {
		gestalts,
		gestaltsLoading,
		gestaltsError,
		loadAllMemories
	} = useFirebaseMemoriesStore();
	
	// Profile from main store
	const { currentProfile } = useMemoriesStore();
	
	// Filter states
	const [selectedStages, setSelectedStages] = useState<string[]>([]);
	const [selectedSources, setSelectedSources] = useState<string[]>([]);
	const [showStageFilter, setShowStageFilter] = useState(false);
	const [showSourceFilter, setShowSourceFilter] = useState(false);
	const [isInitialLoad, setIsInitialLoad] = useState(true);

	// Load memories from Firebase on mount
	useEffect(() => {
		const auth = getAuth();
		const currentUser = auth.currentUser;
		if (currentUser) {
			loadAllMemories(currentProfile?.id).finally(() => {
				setIsInitialLoad(false);
			});
		} else {
			setIsInitialLoad(false);
		}
	}, [currentProfile?.id]);

	// Get unique stages and sources for filtering
	const availableStages = [...new Set(gestalts.map(g => g.stage).filter((stage): stage is string => !!stage))];
	const availableSources = [...new Set(gestalts.map(g => g.sourceType).filter((sourceType): sourceType is string => !!sourceType))];

	// Initialize filters
	useEffect(() => {
		if (availableStages.length > 0 && selectedStages.length === 0) {
			setSelectedStages(availableStages);
		}
		if (availableSources.length > 0 && selectedSources.length === 0) {
			setSelectedSources(availableSources);
		}
	}, [availableStages.length, availableSources.length]);

	// Filter gestalts
	const filteredGestalts = gestalts.filter(gestalt => {
		// Text search
		if (searchQuery.trim() && !gestalt.phrase?.toLowerCase().includes(searchQuery.toLowerCase())) {
			return false;
		}

		// Stage filter
		if (selectedStages.length > 0 && selectedStages.length < availableStages.length) {
			if (!gestalt.stage || !selectedStages.includes(gestalt.stage)) {
				return false;
			}
		}

		// Source filter
		if (selectedSources.length > 0 && selectedSources.length < availableSources.length) {
			if (!gestalt.sourceType || !selectedSources.includes(gestalt.sourceType)) {
				return false;
			}
		}

		return true;
	}).sort((a, b) => {
		// Sort by most recently added
		return new Date(b.createdAtISO || '').getTime() - new Date(a.createdAtISO || '').getTime();
	});

	// Filter helper functions
	const toggleStageSelection = (stage: string) => {
		setSelectedStages(prev => {
			if (prev.includes(stage)) {
				return prev.filter(s => s !== stage);
			} else {
				return [...prev, stage];
			}
		});
	};

	const toggleSourceSelection = (source: string) => {
		setSelectedSources(prev => {
			if (prev.includes(source)) {
				return prev.filter(s => s !== source);
			} else {
				return [...prev, source];
			}
		});
	};

	const getSelectedStagesText = () => {
		if (selectedStages.length === 0 || selectedStages.length === availableStages.length) {
			return 'All Stages';
		}
		if (selectedStages.length === 1) {
			return selectedStages[0];
		}
		return `${selectedStages.length} Selected`;
	};

	const getSelectedSourcesText = () => {
		if (selectedSources.length === 0 || selectedSources.length === availableSources.length) {
			return 'All Sources';
		}
		if (selectedSources.length === 1) {
			return selectedSources[0];
		}
		return `${selectedSources.length} Selected`;
	};

	// Close dropdowns when switching or scrolling
	const closeAllDropdowns = () => {
		setShowStageFilter(false);
		setShowSourceFilter(false);
	};

	// Check authentication
	const auth = getAuth();
	const currentUser = auth.currentUser;
	if (!currentUser) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
				<Text style={{ fontSize: tokens.font.size.h3, color: tokens.color.text.secondary }}>
					Please sign in to view gestalts
				</Text>
				<TouchableOpacity
					onPress={() => navigation.navigate('Dashboard')}
					style={{
						marginTop: tokens.spacing.gap.lg,
						paddingHorizontal: tokens.spacing.gap.lg,
						paddingVertical: tokens.spacing.gap.md,
						backgroundColor: tokens.color.brand.gradient.start,
						borderRadius: tokens.radius.lg
					}}
				>
					<Text style={{ color: 'white', fontWeight: '600' }}>Go to Dashboard</Text>
				</TouchableOpacity>
			</View>
		);
	}

	// Loading state for initial load
	if (isInitialLoad) {
		return (
			<LinearGradient
				colors={['#7C3AED', '#EC4899', '#FB923C']}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={{ flex: 1 }}
			>
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
					<ActivityIndicator size="large" color="white" />
					<Text style={{ color: 'white', marginTop: tokens.spacing.gap.md }}>
						Loading gestalts...
					</Text>
				</View>
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
				<ScrollView 
					contentContainerStyle={{ padding: tokens.spacing.containerX, paddingBottom: 120 }}
					onScrollBeginDrag={closeAllDropdowns}
				>
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

					{/* Filters Row */}
					{(availableStages.length > 0 || availableSources.length > 0) && (
						<View style={{
							flexDirection: 'row',
							gap: tokens.spacing.gap.sm,
							marginBottom: tokens.spacing.gap.lg
						}}>
							{/* Stage Filter */}
							{availableStages.length > 0 && (
								<View style={{ flex: 1, position: 'relative' }}>
									<TouchableOpacity
										onPress={() => setShowStageFilter(!showStageFilter)}
										style={{
											backgroundColor: tokens.color.bg.muted,
											borderRadius: tokens.radius.lg,
											padding: tokens.spacing.gap.sm,
											flexDirection: 'row',
											alignItems: 'center',
											justifyContent: 'space-between'
										}}
									>
										<Text style={{
											fontSize: tokens.font.size.sm,
											color: tokens.color.text.secondary
										}}>
											{getSelectedStagesText()}
										</Text>
										<Ionicons 
											name={showStageFilter ? "chevron-up" : "chevron-down"} 
											size={16} 
											color={tokens.color.text.secondary}
										/>
									</TouchableOpacity>

									{/* Stage Dropdown */}
									{showStageFilter && (
										<View style={{
											position: 'absolute',
											top: '100%',
											left: 0,
											right: 0,
											marginTop: 4,
											backgroundColor: 'white',
											borderRadius: tokens.radius.lg,
											shadowColor: '#000',
											shadowOffset: { width: 0, height: 2 },
											shadowOpacity: 0.08,
											shadowRadius: 12,
											elevation: 6,
											zIndex: 1000,
											maxHeight: 150
										}}>
											<ScrollView style={{ maxHeight: 150 }}>
												{availableStages.map((stage, index) => (
													<TouchableOpacity
														key={stage}
														onPress={() => toggleStageSelection(stage)}
														style={{
															paddingVertical: tokens.spacing.gap.xs,
															paddingHorizontal: tokens.spacing.gap.sm,
															borderBottomWidth: index !== availableStages.length - 1 ? 0.5 : 0,
															borderBottomColor: 'rgba(0,0,0,0.08)',
															flexDirection: 'row',
															alignItems: 'center',
															justifyContent: 'space-between'
														}}
													>
														<Text style={{
															fontSize: tokens.font.size.sm,
															color: selectedStages.includes(stage) ? tokens.color.brand.gradient.start : tokens.color.text.secondary,
															fontWeight: '400'
														}}>
															{stage}
														</Text>
														{selectedStages.includes(stage) && (
															<Ionicons name="checkmark" size={12} color={tokens.color.brand.gradient.start} />
														)}
													</TouchableOpacity>
												))}
											</ScrollView>
										</View>
									)}
								</View>
							)}

							{/* Source Filter */}
							{availableSources.length > 0 && (
								<View style={{ flex: 1, position: 'relative' }}>
									<TouchableOpacity
										onPress={() => setShowSourceFilter(!showSourceFilter)}
										style={{
											backgroundColor: tokens.color.bg.muted,
											borderRadius: tokens.radius.lg,
											padding: tokens.spacing.gap.sm,
											flexDirection: 'row',
											alignItems: 'center',
											justifyContent: 'space-between'
										}}
									>
										<Text style={{
											fontSize: tokens.font.size.sm,
											color: tokens.color.text.secondary
										}}>
											{getSelectedSourcesText()}
										</Text>
										<Ionicons 
											name={showSourceFilter ? "chevron-up" : "chevron-down"} 
											size={16} 
											color={tokens.color.text.secondary}
										/>
									</TouchableOpacity>

									{/* Source Dropdown */}
									{showSourceFilter && (
										<View style={{
											position: 'absolute',
											top: '100%',
											left: 0,
											right: 0,
											marginTop: 4,
											backgroundColor: 'white',
											borderRadius: tokens.radius.lg,
											shadowColor: '#000',
											shadowOffset: { width: 0, height: 2 },
											shadowOpacity: 0.08,
											shadowRadius: 12,
											elevation: 6,
											zIndex: 1000,
											maxHeight: 150
										}}>
											<ScrollView style={{ maxHeight: 150 }}>
												{availableSources.map((source, index) => (
													<TouchableOpacity
														key={source}
														onPress={() => toggleSourceSelection(source)}
														style={{
															paddingVertical: tokens.spacing.gap.xs,
															paddingHorizontal: tokens.spacing.gap.sm,
															borderBottomWidth: index !== availableSources.length - 1 ? 0.5 : 0,
															borderBottomColor: 'rgba(0,0,0,0.08)',
															flexDirection: 'row',
															alignItems: 'center',
															justifyContent: 'space-between'
														}}
													>
														<Text style={{
															fontSize: tokens.font.size.sm,
															color: selectedSources.includes(source) ? tokens.color.brand.gradient.start : tokens.color.text.secondary,
															fontWeight: '400'
														}}>
															{source}
														</Text>
														{selectedSources.includes(source) && (
															<Ionicons name="checkmark" size={12} color={tokens.color.brand.gradient.start} />
														)}
													</TouchableOpacity>
												))}
											</ScrollView>
										</View>
									)}
								</View>
							)}
						</View>
					)}

					{/* Add New Gestalt */}
					<TouchableOpacity 
						onPress={() => navigation.navigate('AddGestalt' as never)}
						style={{
							backgroundColor: 'rgba(124, 58, 237, 0.1)',
							borderColor: '#7C3AED',
							borderWidth: 1,
							borderRadius: tokens.radius.lg,
							padding: tokens.spacing.gap.lg,
							flexDirection: 'row',
							alignItems: 'center',
							marginBottom: tokens.spacing.gap.lg
						}}
					>
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

					{/* Loading/Error State */}
					{gestaltsLoading && (
						<View style={{ padding: tokens.spacing.gap.lg, alignItems: 'center' }}>
							<ActivityIndicator size="small" color={tokens.color.brand.gradient.start} />
						</View>
					)}
					
					{gestaltsError && (
						<View style={{ 
							padding: tokens.spacing.gap.md, 
							backgroundColor: '#FEE2E2', 
							borderRadius: tokens.radius.lg, 
							marginBottom: tokens.spacing.gap.md 
						}}>
							<Text style={{ color: '#DC2626', fontSize: tokens.font.size.sm }}>
								{gestaltsError}
							</Text>
						</View>
					)}

					{/* Gestalts List */}
					{filteredGestalts.length > 0 ? (
						<>
							<Text weight="semibold" style={{ 
								fontSize: tokens.font.size.lg,
								marginBottom: tokens.spacing.gap.md 
							}}>
								Your Gestalts ({filteredGestalts.length})
							</Text>

							{filteredGestalts.map((gestalt) => (
								<TouchableOpacity
									key={gestalt.id}
									style={{
										backgroundColor: tokens.color.surface,
										borderRadius: tokens.radius.lg,
										padding: tokens.spacing.gap.md,
										marginBottom: tokens.spacing.gap.sm,
										borderWidth: 1,
										borderColor: tokens.color.border.default
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
											<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
												<Text color="secondary" style={{ fontSize: tokens.font.size.sm }}>
													From: {gestalt.source}
												</Text>
												{gestalt.stage && (
													<View style={{
														backgroundColor: tokens.color.brand.gradient.start + '20',
														paddingHorizontal: 8,
														paddingVertical: 2,
														borderRadius: tokens.radius.sm,
														marginLeft: tokens.spacing.gap.sm
													}}>
														<Text style={{ 
															fontSize: tokens.font.size.xs,
															color: tokens.color.brand.gradient.start,
															fontWeight: '600'
														}}>
															{gestalt.stage}
														</Text>
													</View>
												)}
												{gestalt.sourceType && (
													<View style={{
														backgroundColor: tokens.color.support.teal + '20',
														paddingHorizontal: 8,
														paddingVertical: 2,
														borderRadius: tokens.radius.sm,
														marginLeft: tokens.spacing.gap.sm
													}}>
														<Text style={{ 
															fontSize: tokens.font.size.xs,
															color: tokens.color.support.teal,
															fontWeight: '600'
														}}>
															{gestalt.sourceType}
														</Text>
													</View>
												)}
											</View>
											<Text color="secondary" style={{ 
												fontSize: tokens.font.size.xs,
												marginBottom: 4
											}}>
												Added {dayjs(gestalt.createdAtISO).format('MMM DD, YYYY')}
											</Text>
											{gestalt.contexts && gestalt.contexts.length > 0 && (
												<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
													{gestalt.contexts.map((context: string, i: number) => (
														<Text
															key={i}
															style={{
																fontSize: tokens.font.size.xs,
																color: tokens.color.text.secondary,
																backgroundColor: tokens.color.border.default,
																paddingHorizontal: 6,
																paddingVertical: 2,
																borderRadius: tokens.radius.sm,
																marginRight: tokens.spacing.gap.xs,
																marginBottom: 2
															}}
														>
															{context}
														</Text>
													))}
												</View>
											)}
										</View>
										<TouchableOpacity>
											<Ionicons name="ellipsis-vertical" size={20} color={tokens.color.text.secondary} />
										</TouchableOpacity>
									</View>

									{/* Audio playback if available */}
									{gestalt.audioData && (
										<View style={{
											marginTop: tokens.spacing.gap.sm,
											paddingTop: tokens.spacing.gap.sm,
											borderTopWidth: 1,
											borderTopColor: tokens.color.border.default,
											flexDirection: 'row',
											alignItems: 'center'
										}}>
											<Ionicons name="volume-high" size={16} color={tokens.color.text.secondary} />
											<Text style={{
												marginLeft: tokens.spacing.gap.xs,
												fontSize: tokens.font.size.xs,
												color: tokens.color.text.secondary
											}}>
												Audio recording available
											</Text>
										</View>
									)}
								</TouchableOpacity>
							))}
						</>
					) : (
						/* Empty State */
						<View style={{
							padding: tokens.spacing.gap.lg * 1.5,
							alignItems: 'center'
						}}>
							<Ionicons name="chatbubble-outline" size={48} color={tokens.color.text.secondary} />
							<Text style={{
								fontSize: tokens.font.size.body,
								color: tokens.color.text.secondary,
								textAlign: 'center',
								marginTop: tokens.spacing.gap.sm
							}}>
								{searchQuery || selectedStages.length < availableStages.length || selectedSources.length < availableSources.length 
									? 'No gestalts match your search' 
									: 'No gestalts recorded yet'
								}
							</Text>
							<Text style={{
								fontSize: tokens.font.size.sm,
								color: tokens.color.text.secondary,
								textAlign: 'center',
								marginTop: 4
							}}>
								{searchQuery || selectedStages.length < availableStages.length || selectedSources.length < availableSources.length
									? 'Try adjusting your filters'
									: 'Tap "Add New Gestalt" to get started'
								}
							</Text>
						</View>
					)}
				</ScrollView>
			</View>

			<BottomNavigation />
		</LinearGradient>
	);
}