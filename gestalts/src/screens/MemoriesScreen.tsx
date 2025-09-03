import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, TextInput, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Text, useTheme } from '../theme';
import { useFirebaseMemoriesStore } from '../state/useFirebaseMemoriesStore';
import { useMemoriesStore } from '../state/useStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';
import { useDrawer } from '../navigation/SimpleDrawer';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/types';
import { BottomNavigation } from '../navigation/BottomNavigation';
import { getAuth } from 'firebase/auth';

type MemoryTab = 'journal' | 'milestones' | 'appointments' | 'gestalts';
type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export default function MemoriesScreen() {
	const { tokens } = useTheme();
	const { openDrawer } = useDrawer();
	const navigation = useNavigation<NavigationProp>();
	
	// Firebase memories store
	const {
		journal,
		milestones,
		appointmentNotes,
		gestalts,
		journalLoading,
		milestonesLoading,
		appointmentNotesLoading,
		gestaltsLoading,
		journalError,
		milestonesError,
		appointmentNotesError,
		gestaltsError,
		loadAllMemories,
		addJournalEntry,
		addMilestone,
		addAppointmentNote,
		addGestalt,
		updateAppointmentNote
	} = useFirebaseMemoriesStore();
	
	// Profile from main store
	const { currentProfile } = useMemoriesStore();
	
	const [activeTab, setActiveTab] = useState<MemoryTab>('journal');
	const [searchQuery, setSearchQuery] = useState('');
	const [showLeftArrow, setShowLeftArrow] = useState(false);
	const [showRightArrow, setShowRightArrow] = useState(true);
	const scrollViewRef = useRef<any>(null);
	const [isInitialLoad, setIsInitialLoad] = useState(true);
	
	// Appointments state
	const [appointmentFilter, setAppointmentFilter] = useState<'all' | 'open' | 'completed'>('all');
	const [showQuickAdd, setShowQuickAdd] = useState(false);
	const [newAppointmentText, setNewAppointmentText] = useState('');
	
	// Filter dropdown states
	const [showSpecialistFilter, setShowSpecialistFilter] = useState(false);
	const [showChildrenFilter, setShowChildrenFilter] = useState(false);
	const [selectedSpecialists, setSelectedSpecialists] = useState<string[]>([]);
	const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
	
	// Journal filter states
	const [isJournalFiltersExpanded, setIsJournalFiltersExpanded] = useState(false);
	const [journalTypeFilter, setJournalTypeFilter] = useState<'all' | 'personal' | 'child'>('all');
	const [showJournalChildrenFilter, setShowJournalChildrenFilter] = useState(false);
	const [selectedJournalChildren, setSelectedJournalChildren] = useState<string[]>([]);
	
	// Milestone filter states
	const [isMilestoneFiltersExpanded, setIsMilestoneFiltersExpanded] = useState(false);
	const [showMilestoneTypesFilter, setShowMilestoneTypesFilter] = useState(false);
	const [selectedMilestoneTypes, setSelectedMilestoneTypes] = useState<string[]>([]);
	
	// Collapsible search/filter state
	const [isSearchFiltersExpanded, setIsSearchFiltersExpanded] = useState(false);
	const [isGestaltsFiltersExpanded, setIsGestaltsFiltersExpanded] = useState(false);
	
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
	
	// Get unique specialists and children
	const availableSpecialists = [...new Set(
		appointmentNotes
			.filter(apt => apt.specialist)
			.map(apt => apt.specialist!)
	)];
	
	const availableChildren = currentProfile ? [currentProfile.childName] : [];
	
	// Milestone types for filtering
	const milestoneTypes = ['First Words', 'Communication', 'Social Skills', 'Stage Progress', 'Independence', 'Learning'];
	const availableMilestoneTypes = milestoneTypes;
	
	// Initialize filters when specialists/children change
	React.useEffect(() => {
		if (availableSpecialists.length === 1 && selectedSpecialists.length === 0) {
			setSelectedSpecialists(availableSpecialists);
		}
		if (availableChildren.length === 1 && selectedChildren.length === 0) {
			setSelectedChildren(availableChildren);
			setSelectedJournalChildren(availableChildren);
		}
		if (availableMilestoneTypes.length > 0 && selectedMilestoneTypes.length === 0) {
			setSelectedMilestoneTypes(availableMilestoneTypes);
		}
	}, [availableSpecialists.length, availableChildren.length, availableMilestoneTypes.length]);
	
	const filteredAppointments = appointmentNotes.filter(apt => {
		// Filter by completion status
		if (appointmentFilter === 'completed' && !apt.isClosed) return false;
		if (appointmentFilter === 'open' && apt.isClosed) return false;
		
		// Filter by specialist
		if (selectedSpecialists.length > 0 && selectedSpecialists.length < availableSpecialists.length) {
			if (!apt.specialist || !selectedSpecialists.includes(apt.specialist)) return false;
		}
		
		// Filter by search query
		if (searchQuery.trim() && !apt.question?.toLowerCase().includes(searchQuery.toLowerCase())) {
			return false;
		}
		
		return true;
	});
	
	// Filter milestones
	const filteredMilestones = milestones.filter(milestone => {
		// Text search
		if (searchQuery.trim() && !milestone.title?.toLowerCase().includes(searchQuery.toLowerCase())) {
			return false;
		}
		return true;
	});
	
	// Filter journal entries
	const filteredJournalEntries = journal.filter(entry => {
		// Text search
		if (searchQuery.trim() && !entry.content?.toLowerCase().includes(searchQuery.toLowerCase())) {
			return false;
		}
		
		// Filter by journal type
		const entryType = entry.type || 'personal';
		if (journalTypeFilter === 'personal' && entryType !== 'personal') return false;
		if (journalTypeFilter === 'child' && entryType === 'personal') return false;
		
		// Filter by selected children
		if (journalTypeFilter !== 'personal' && entryType !== 'personal') {
			if (selectedJournalChildren.length > 0 && selectedJournalChildren.length < availableChildren.length) {
				if (entry.childName && !selectedJournalChildren.includes(entry.childName)) {
					return false;
				}
			}
		}
		
		return true;
	});
	
	// Filter gestalts
	const filteredGestalts = gestalts.filter(gestalt => {
		if (searchQuery.trim() && !gestalt.phrase?.toLowerCase().includes(searchQuery.toLowerCase())) {
			return false;
		}
		return true;
	});
	
	const moods = [
		{ key: 'good', label: 'Good Day', icon: '😊', color: '#22C55E' },
		{ key: 'neutral', label: 'Neutral', icon: '😐', color: '#6B7280' },
		{ key: 'tough', label: 'Tough Day', icon: '😔', color: '#EF4444' }
	] as const;
	
	const tabs = [
		{ key: 'journal', label: 'Journal', icon: 'create-outline', count: journal.length },
		{ key: 'milestones', label: 'Milestones', icon: 'trophy', count: milestones.length },
		{ key: 'appointments', label: 'Appointments', icon: 'calendar-outline', count: appointmentNotes.length },
		{ key: 'gestalts', label: 'Gestalts', icon: 'list-outline', count: gestalts.length }
	] as const;
	
	const toggleAppointmentComplete = async (apt: any) => {
		try {
			await updateAppointmentNote(apt.id, { 
				isClosed: !apt.isClosed,
				closedAtISO: !apt.isClosed ? dayjs().toISOString() : undefined
			});
		} catch (error) {
			Alert.alert('Error', 'Failed to update appointment note');
		}
	};
	
	const addQuickAppointment = async () => {
		if (newAppointmentText.trim()) {
			try {
				await addAppointmentNote(
					newAppointmentText.trim(),
					undefined,
					currentProfile?.id
				);
				setNewAppointmentText('');
				setShowQuickAdd(false);
			} catch (error) {
				Alert.alert('Error', 'Failed to add appointment note');
			}
		}
	};
	
	// Multi-select helper functions
	const toggleSpecialistSelection = (specialist: string) => {
		setSelectedSpecialists(prev => {
			if (prev.includes(specialist)) {
				return prev.filter(s => s !== specialist);
			} else {
				return [...prev, specialist];
			}
		});
	};
	
	const toggleChildSelection = (child: string) => {
		setSelectedChildren(prev => {
			if (prev.includes(child)) {
				return prev.filter(c => c !== child);
			} else {
				return [...prev, child];
			}
		});
	};
	
	const getSelectedSpecialistsText = () => {
		if (selectedSpecialists.length === 0 || selectedSpecialists.length === availableSpecialists.length) {
			return 'All Specialists';
		}
		if (selectedSpecialists.length === 1) {
			return selectedSpecialists[0];
		}
		return `${selectedSpecialists.length} Selected`;
	};
	
	const getSelectedChildrenText = () => {
		if (selectedChildren.length === 0 || selectedChildren.length === availableChildren.length) {
			return 'All Children';
		}
		if (selectedChildren.length === 1) {
			return selectedChildren[0];
		}
		return `${selectedChildren.length} Selected`;
	};
	
	// Close dropdowns when clicking outside or switching tabs
	React.useEffect(() => {
		setShowSpecialistFilter(false);
		setShowChildrenFilter(false);
		setShowJournalChildrenFilter(false);
		setShowMilestoneTypesFilter(false);
		setIsGestaltsFiltersExpanded(false);
	}, [activeTab]);
	
	const closeAllDropdowns = () => {
		setShowSpecialistFilter(false);
		setShowChildrenFilter(false);
		setShowJournalChildrenFilter(false);
		setShowMilestoneTypesFilter(false);
	};
	
	const toggleSearchFilters = () => {
		setIsSearchFiltersExpanded(!isSearchFiltersExpanded);
		if (isSearchFiltersExpanded) {
			closeAllDropdowns();
		}
	};
	
	const toggleJournalFilters = () => {
		setIsJournalFiltersExpanded(!isJournalFiltersExpanded);
		if (isJournalFiltersExpanded) {
			setShowJournalChildrenFilter(false);
		}
	};
	
	// Journal filter helper functions
	const toggleJournalChildSelection = (child: string) => {
		setSelectedJournalChildren(prev => {
			if (prev.includes(child)) {
				return prev.filter(c => c !== child);
			} else {
				return [...prev, child];
			}
		});
	};
	
	const getSelectedJournalChildrenText = () => {
		if (selectedJournalChildren.length === 0 || selectedJournalChildren.length === availableChildren.length) {
			return 'All Children';
		}
		if (selectedJournalChildren.length === 1) {
			return selectedJournalChildren[0];
		}
		return `${selectedJournalChildren.length} Selected`;
	};
	
	// Milestone filter helper functions
	const toggleMilestoneTypeSelection = (type: string) => {
		setSelectedMilestoneTypes(prev => {
			if (prev.includes(type)) {
				return prev.filter(t => t !== type);
			} else {
				return [...prev, type];
			}
		});
	};
	
	const getSelectedMilestoneTypesText = () => {
		if (selectedMilestoneTypes.length === 0 || selectedMilestoneTypes.length === availableMilestoneTypes.length) {
			return 'All Types';
		}
		if (selectedMilestoneTypes.length === 1) {
			return selectedMilestoneTypes[0];
		}
		return `${selectedMilestoneTypes.length} Selected`;
	};
	
	// Check authentication
	const auth = getAuth();
	const currentUser = auth.currentUser;
	if (!currentUser) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
				<Text style={{ fontSize: tokens.font.size.h3, color: tokens.color.text.secondary }}>
					Please sign in to view memories
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
						Loading memories...
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
							Memories
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
					style={{ flex: 1 }}
					contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: tokens.spacing.containerX }}
					showsVerticalScrollIndicator={false}
					onScrollBeginDrag={closeAllDropdowns}
					>
					{/* Tab Navigation */}
					<View style={{
						paddingTop: 24
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
								{tab.count > 0 && (
									<View style={{
										backgroundColor: tokens.color.brand.gradient.mid,
										borderRadius: 10,
										paddingHorizontal: 6,
										paddingVertical: 2,
										minWidth: 18,
										alignItems: 'center'
									}}>
										<Text style={{
											color: 'white',
											fontSize: 9,
											fontWeight: '600'
										}}>{tab.count}</Text>
									</View>
								)}
							</TouchableOpacity>
						))}
					</ScrollView>

					{/* Content based on active tab */}
					{activeTab === 'journal' && (
						<View>
							{/* Quick Add Button */}
							<TouchableOpacity 
								onPress={() => (navigation as any).navigate('AddJournal')}
								style={{
									backgroundColor: tokens.color.brand.gradient.start + '15',
									borderColor: tokens.color.brand.gradient.start + '30',
									borderWidth: 1,
									borderRadius: tokens.radius.lg,
									padding: tokens.spacing.gap.md,
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'center',
									marginBottom: tokens.spacing.gap.lg
								}}
							>
								<Ionicons name="create-outline" size={20} color={tokens.color.brand.gradient.start} />
								<Text style={{
									marginLeft: tokens.spacing.gap.sm,
									fontSize: tokens.font.size.body,
									fontWeight: '600',
									color: tokens.color.brand.gradient.start
								}}>Add New Journal Entry</Text>
							</TouchableOpacity>

							{/* Loading/Error State */}
							{journalLoading && (
								<View style={{ padding: tokens.spacing.gap.lg, alignItems: 'center' }}>
									<ActivityIndicator size="small" color={tokens.color.brand.gradient.start} />
								</View>
							)}
							
							{journalError && (
								<View style={{ padding: tokens.spacing.gap.md, backgroundColor: '#FEE2E2', borderRadius: tokens.radius.lg, marginBottom: tokens.spacing.gap.md }}>
									<Text style={{ color: '#DC2626', fontSize: tokens.font.size.sm }}>{journalError}</Text>
								</View>
							)}

							{/* Journal Entries */}
							{filteredJournalEntries.length > 0 ? (
								filteredJournalEntries.map((entry) => (
									<View key={entry.id} style={{
										backgroundColor: 'white',
										borderRadius: tokens.radius['2xl'],
										padding: tokens.spacing.gap.lg,
										marginBottom: tokens.spacing.gap.md,
										borderWidth: 1,
										borderColor: tokens.color.border.default,
										shadowColor: '#000',
										shadowOffset: { width: 0, height: 1 },
										shadowOpacity: 0.05,
										shadowRadius: 4,
										elevation: 1
									}}>
										<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing.gap.sm }}>
											<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
												<Ionicons name="create-outline" size={16} color={tokens.color.brand.gradient.start} />
												<Text style={{
													fontSize: tokens.font.size.small,
													color: tokens.color.text.secondary,
													fontWeight: '500',
													flex: 1
												}}>{dayjs(entry.createdAtISO).format('MMM DD, YYYY • HH:mm')}</Text>
												
												{/* Journal Type Badge */}
												{(entry.type || 'personal') !== 'personal' && (
													<View style={{
														paddingHorizontal: 6,
														paddingVertical: 2,
														borderRadius: 8,
														backgroundColor: tokens.color.brand.gradient.start + '15'
													}}>
														<Text style={{
															fontSize: 9,
															fontWeight: '600',
															color: tokens.color.brand.gradient.start
														}}>
															{entry.childName || 'Child'}
														</Text>
													</View>
												)}
											</View>
											{entry.mood && (
												<View style={{
													flexDirection: 'row',
													alignItems: 'center',
													gap: 4,
													paddingHorizontal: 8,
													paddingVertical: 4,
													borderRadius: 12,
													backgroundColor: (moods.find(m => m.key === entry.mood)?.color || '#6B7280') + '15'
												}}>
													<Text style={{ fontSize: 12 }}>{moods.find(m => m.key === entry.mood)?.icon}</Text>
													<Text style={{
														fontSize: 10,
														fontWeight: '600',
														color: moods.find(m => m.key === entry.mood)?.color || '#6B7280'
													}}>{moods.find(m => m.key === entry.mood)?.label}</Text>
												</View>
											)}
										</View>
										<Text style={{
											fontSize: tokens.font.size.body,
											color: tokens.color.text.primary,
											lineHeight: tokens.font.size.body * 1.5
										}}>{entry.content}</Text>
									</View>
								))
							) : (
								/* Empty State */
								<View style={{
									padding: tokens.spacing.gap.lg * 1.5,
									alignItems: 'center'
								}}>
									<Ionicons name="create-outline" size={48} color={tokens.color.text.secondary} />
									<Text style={{
										fontSize: tokens.font.size.body,
										color: tokens.color.text.secondary,
										textAlign: 'center',
										marginTop: tokens.spacing.gap.sm
									}}>
										No journal entries yet
									</Text>
									<Text style={{
										fontSize: tokens.font.size.sm,
										color: tokens.color.text.secondary,
										textAlign: 'center',
										marginTop: 4
									}}>
										Tap "Add New Journal Entry" to get started
									</Text>
								</View>
							)}
						</View>
					)}

					{activeTab === 'milestones' && (
						<View>
							{/* Quick Add Button */}
							<TouchableOpacity 
								onPress={() => (navigation as any).navigate('AddMilestone')}
								style={{
									backgroundColor: tokens.color.brand.gradient.start + '15',
									borderColor: tokens.color.brand.gradient.start + '30',
									borderWidth: 1,
									borderRadius: tokens.radius.lg,
									padding: tokens.spacing.gap.md,
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'center',
									marginBottom: tokens.spacing.gap.lg
								}}
							>
								<Ionicons name="trophy" size={20} color={tokens.color.brand.gradient.start} />
								<Text style={{
									marginLeft: tokens.spacing.gap.sm,
									fontSize: tokens.font.size.body,
									fontWeight: '600',
									color: tokens.color.brand.gradient.start
								}}>Add New Milestone</Text>
							</TouchableOpacity>

							{/* Loading/Error State */}
							{milestonesLoading && (
								<View style={{ padding: tokens.spacing.gap.lg, alignItems: 'center' }}>
									<ActivityIndicator size="small" color={tokens.color.brand.gradient.start} />
								</View>
							)}
							
							{milestonesError && (
								<View style={{ padding: tokens.spacing.gap.md, backgroundColor: '#FEE2E2', borderRadius: tokens.radius.lg, marginBottom: tokens.spacing.gap.md }}>
									<Text style={{ color: '#DC2626', fontSize: tokens.font.size.sm }}>{milestonesError}</Text>
								</View>
							)}

							{/* Milestones */}
							{filteredMilestones.map((milestone) => (
								<View key={milestone.id} style={{
									backgroundColor: 'white',
									borderRadius: tokens.radius['2xl'],
									padding: tokens.spacing.gap.lg,
									marginBottom: tokens.spacing.gap.md,
									borderWidth: 1,
									borderColor: tokens.color.border.default,
									shadowColor: '#000',
									shadowOffset: { width: 0, height: 1 },
									shadowOpacity: 0.05,
									shadowRadius: 4,
									elevation: 1
								}}>
									<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: tokens.spacing.gap.sm }}>
										<View style={{
											width: 32,
											height: 32,
											borderRadius: 16,
											backgroundColor: tokens.color.support.yellow + '20',
											alignItems: 'center',
											justifyContent: 'center'
										}}>
											<Text style={{ fontSize: 16 }}>🏆</Text>
										</View>
										<View style={{ flex: 1 }}>
											<Text style={{
												fontSize: tokens.font.size.body,
												fontWeight: '600',
												color: tokens.color.text.primary,
												marginBottom: 2
											}}>{milestone.title}</Text>
											<Text style={{
												fontSize: tokens.font.size.small,
												color: tokens.color.text.secondary
											}}>{dayjs(milestone.dateISO).format('MMMM DD, YYYY')}</Text>
										</View>
									</View>
									{milestone.notes && (
										<Text style={{
											fontSize: tokens.font.size.small,
											color: tokens.color.text.secondary,
											lineHeight: tokens.font.size.small * 1.4
										}}>{milestone.notes}</Text>
									)}
								</View>
							))}
						</View>
					)}

					{activeTab === 'appointments' && (
						<View>
							{/* Quick Add Input */}
							{showQuickAdd ? (
								<View style={{
									backgroundColor: 'white',
									borderRadius: tokens.radius.lg,
									padding: tokens.spacing.gap.md,
									marginTop: tokens.spacing.gap.md,
									marginBottom: tokens.spacing.gap.md,
									borderWidth: 1,
									borderColor: tokens.color.brand.gradient.start,
									flexDirection: 'row',
									alignItems: 'center',
									gap: tokens.spacing.gap.sm
								}}>
									<View style={{
										width: 20,
										height: 20,
										borderRadius: 10,
										borderWidth: 2,
										borderColor: tokens.color.border.default,
										alignItems: 'center',
										justifyContent: 'center'
									}} />
									<TextInput
										value={newAppointmentText}
										onChangeText={setNewAppointmentText}
										placeholder="Ask specialist about..."
										style={{ flex: 1, fontSize: tokens.font.size.body }}
										autoFocus
										onSubmitEditing={addQuickAppointment}
									/>
									<TouchableOpacity onPress={addQuickAppointment}>
										<Ionicons name="checkmark" size={20} color={tokens.color.brand.gradient.start} />
									</TouchableOpacity>
									<TouchableOpacity onPress={() => { setShowQuickAdd(false); setNewAppointmentText(''); }}>
										<Ionicons name="close" size={20} color={tokens.color.text.secondary} />
									</TouchableOpacity>
								</View>
							) : (
								<TouchableOpacity 
									onPress={() => setShowQuickAdd(true)}
									style={{
										backgroundColor: tokens.color.brand.gradient.start + '15',
										borderColor: tokens.color.brand.gradient.start + '30',
										borderWidth: 1,
										borderRadius: tokens.radius.lg,
										padding: tokens.spacing.gap.md,
										flexDirection: 'row',
										alignItems: 'center',
										justifyContent: 'center',
										marginBottom: tokens.spacing.gap.lg
									}}
								>
									<Ionicons name="add-circle" size={20} color={tokens.color.brand.gradient.start} />
									<Text style={{ 
										marginLeft: tokens.spacing.gap.sm,
										fontSize: tokens.font.size.body,
										fontWeight: '600',
										color: tokens.color.brand.gradient.start
									}}>New Appointment Note</Text>
								</TouchableOpacity>
							)}

							{/* Loading/Error State */}
							{appointmentNotesLoading && (
								<View style={{ padding: tokens.spacing.gap.lg, alignItems: 'center' }}>
									<ActivityIndicator size="small" color={tokens.color.brand.gradient.start} />
								</View>
							)}
							
							{appointmentNotesError && (
								<View style={{ padding: tokens.spacing.gap.md, backgroundColor: '#FEE2E2', borderRadius: tokens.radius.lg, marginBottom: tokens.spacing.gap.md }}>
									<Text style={{ color: '#DC2626', fontSize: tokens.font.size.sm }}>{appointmentNotesError}</Text>
								</View>
							)}

							{/* Appointments List */}
							{filteredAppointments.map((appointment) => (
								<View key={appointment.id} style={{
									backgroundColor: 'white',
									borderRadius: tokens.radius.lg,
									marginBottom: tokens.spacing.gap.sm,
									borderWidth: 1,
									borderColor: tokens.color.border.default,
									overflow: 'hidden'
								}}>
									<View style={{
										flexDirection: 'row',
										alignItems: 'center',
										padding: tokens.spacing.gap.md,
										gap: tokens.spacing.gap.sm
									}}>
										{/* Completion Circle */}
										<TouchableOpacity 
											onPress={() => toggleAppointmentComplete(appointment)}
											style={{
												width: 20,
												height: 20,
												borderRadius: 10,
												borderWidth: 2,
												borderColor: appointment.isClosed ? tokens.color.brand.gradient.start : tokens.color.border.default,
												backgroundColor: appointment.isClosed ? tokens.color.brand.gradient.start : 'transparent',
												alignItems: 'center',
												justifyContent: 'center'
											}}
										>
											{appointment.isClosed && (
												<Ionicons name="checkmark" size={12} color="white" />
											)}
										</TouchableOpacity>

										{/* Question Text */}
										<Text style={{
											flex: 1,
											fontSize: tokens.font.size.body,
											color: appointment.isClosed ? tokens.color.text.secondary : tokens.color.text.primary,
											textDecorationLine: appointment.isClosed ? 'line-through' : 'none'
										}}>
											{appointment.question}
										</Text>

										{/* Specialist Badge */}
										{appointment.specialist && (
											<View style={{
												paddingHorizontal: 6,
												paddingVertical: 2,
												borderRadius: 8,
												backgroundColor: tokens.color.support.teal + '15'
											}}>
												<Text style={{
													fontSize: 10,
													fontWeight: '600',
													color: tokens.color.support.teal
												}}>
													{appointment.specialist}
												</Text>
											</View>
										)}
									</View>

									{/* Completion Notes Preview */}
									{appointment.isClosed && appointment.closureResponse && (
										<View style={{
											paddingHorizontal: tokens.spacing.gap.md,
											paddingBottom: tokens.spacing.gap.md,
											paddingTop: 0
										}}>
											<Text style={{
												fontSize: tokens.font.size.sm,
												color: tokens.color.text.secondary,
												fontStyle: 'italic'
											}}>
												"{appointment.closureResponse}"
											</Text>
										</View>
									)}
								</View>
							))}

							{/* Empty State */}
							{filteredAppointments.length === 0 && !appointmentNotesLoading && (
								<View style={{
									padding: tokens.spacing.gap.lg * 1.5,
									alignItems: 'center'
								}}>
									<Ionicons name="calendar-outline" size={48} color={tokens.color.text.secondary} />
									<Text style={{
										fontSize: tokens.font.size.body,
										color: tokens.color.text.secondary,
										textAlign: 'center',
										marginTop: tokens.spacing.gap.sm
									}}>
										No appointment notes yet
									</Text>
									<Text style={{
										fontSize: tokens.font.size.sm,
										color: tokens.color.text.secondary,
										textAlign: 'center',
										marginTop: 4
									}}>
										Tap "New Appointment Note" to get started
									</Text>
								</View>
							)}
						</View>
					)}

					{activeTab === 'gestalts' && (
						<View>
							{/* Quick Add Button */}
							<TouchableOpacity 
								onPress={() => (navigation as any).navigate('GestaltLists')}
								style={{
									backgroundColor: tokens.color.brand.gradient.start + '15',
									borderColor: tokens.color.brand.gradient.start + '30',
									borderWidth: 1,
									borderRadius: tokens.radius.lg,
									padding: tokens.spacing.gap.md,
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'center',
									marginBottom: tokens.spacing.gap.lg
								}}
							>
								<Ionicons name="list" size={20} color={tokens.color.brand.gradient.start} />
								<Text style={{
									marginLeft: tokens.spacing.gap.sm,
									fontSize: tokens.font.size.body,
									fontWeight: '600',
									color: tokens.color.brand.gradient.start
								}}>Add New Gestalt</Text>
							</TouchableOpacity>

							{/* Loading/Error State */}
							{gestaltsLoading && (
								<View style={{ padding: tokens.spacing.gap.lg, alignItems: 'center' }}>
									<ActivityIndicator size="small" color={tokens.color.brand.gradient.start} />
								</View>
							)}
							
							{gestaltsError && (
								<View style={{ padding: tokens.spacing.gap.md, backgroundColor: '#FEE2E2', borderRadius: tokens.radius.lg, marginBottom: tokens.spacing.gap.md }}>
									<Text style={{ color: '#DC2626', fontSize: tokens.font.size.sm }}>{gestaltsError}</Text>
								</View>
							)}

							{/* Gestalts */}
							{filteredGestalts.map((gestalt) => (
								<View key={gestalt.id} style={{
									backgroundColor: 'white',
									borderRadius: tokens.radius['2xl'],
									padding: tokens.spacing.gap.lg,
									marginBottom: tokens.spacing.gap.md,
									borderWidth: 1,
									borderColor: tokens.color.border.default,
									shadowColor: '#000',
									shadowOffset: { width: 0, height: 1 },
									shadowOpacity: 0.05,
									shadowRadius: 4,
									elevation: 1
								}}>
									<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: tokens.spacing.gap.sm }}>
										<View style={{
											width: 32,
											height: 32,
											borderRadius: 16,
											backgroundColor: tokens.color.brand.gradient.start + '20',
											alignItems: 'center',
											justifyContent: 'center'
										}}>
											<Text style={{ fontSize: 16 }}>💬</Text>
										</View>
										<View style={{ flex: 1 }}>
											<Text style={{
												fontSize: tokens.font.size.body,
												fontWeight: '600',
												color: tokens.color.text.primary,
												marginBottom: 2
											}}>"{gestalt.phrase}"</Text>
											<Text style={{
												fontSize: tokens.font.size.small,
												color: tokens.color.text.secondary
											}}>From: {gestalt.source}</Text>
										</View>
										<View style={{
											backgroundColor: tokens.color.brand.gradient.start + '15',
											paddingHorizontal: 8,
											paddingVertical: 4,
											borderRadius: 12
										}}>
											<Text style={{
												fontSize: 10,
												fontWeight: '600',
												color: tokens.color.brand.gradient.start
											}}>{gestalt.stage}</Text>
										</View>
									</View>
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
														borderRadius: 4,
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
							))}
							
							{/* Empty State */}
							{filteredGestalts.length === 0 && !gestaltsLoading && (
								<View style={{
									padding: tokens.spacing.gap.lg * 1.5,
									alignItems: 'center'
								}}>
									<Ionicons name="list-outline" size={48} color={tokens.color.text.secondary} />
									<Text style={{
										fontSize: tokens.font.size.body,
										color: tokens.color.text.secondary,
										textAlign: 'center',
										marginTop: tokens.spacing.gap.sm
									}}>
										No gestalts tracked yet
									</Text>
									<Text style={{
										fontSize: tokens.font.size.sm,
										color: tokens.color.text.secondary,
										textAlign: 'center',
										marginTop: 4
									}}>
										Tap "Add New Gestalt" to get started
									</Text>
								</View>
							)}
						</View>
					)}
				</View>
				</ScrollView>

			<BottomNavigation />
			</View>
		</LinearGradient>
	);
}