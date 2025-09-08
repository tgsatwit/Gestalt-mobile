import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, TextInput, View, TouchableOpacity, ActivityIndicator } from 'react-native';
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
import SpecialistService from '../services/specialistService';
import { Specialist } from '../types/specialist';
import { useAuth } from '../contexts/AuthContext';

type MemoryTab = 'journal' | 'milestones' | 'appointments' | 'gestalts';
type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export default function MemoriesScreen() {
	const { tokens } = useTheme();
	const { openDrawer } = useDrawer();
	const navigation = useNavigation<NavigationProp>();
	const { user } = useAuth();
	
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
	const [appointmentFilter, setAppointmentFilter] = useState<'all' | 'open' | 'completed'>('open');
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
	const [showMilestoneChildrenFilter, setShowMilestoneChildrenFilter] = useState(false);
	const [selectedMilestoneChildren, setSelectedMilestoneChildren] = useState<string[]>([]);
	
	// Collapsible search/filter state
	const [isSearchFiltersExpanded, setIsSearchFiltersExpanded] = useState(false);
	const [isGestaltsFiltersExpanded, setIsGestaltsFiltersExpanded] = useState(false);
	
	// Menu dropdown state
	const [openMenuId, setOpenMenuId] = useState<string | null>(null);
	
	// Specialist profiles state
	const [specialistProfiles, setSpecialistProfiles] = useState<Specialist[]>([]);
	const [loadingSpecialistProfiles, setLoadingSpecialistProfiles] = useState(false);
	
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

	// Load specialist profiles
	useEffect(() => {
		if (user?.id) {
			setLoadingSpecialistProfiles(true);
			SpecialistService.getUserSpecialists(user.id)
				.then(setSpecialistProfiles)
				.catch((error: Error) => console.error('Failed to load specialist profiles:', error))
				.finally(() => setLoadingSpecialistProfiles(false));
		}
	}, [user?.id]);
	
	// Get unique specialists and children (combine appointment specialists with specialist profiles)
	const availableSpecialists = [...new Set([
		...appointmentNotes
			.filter(apt => apt.specialist)
			.map(apt => apt.specialist!),
		...specialistProfiles.map(sp => sp.name)
	])];
	
	const availableChildren = currentProfile ? [currentProfile.childName] : [];
	
	// Milestone types for filtering
	const milestoneTypes = ['First Words', 'Communication', 'Social Skills', 'Stage Progress', 'Independence', 'Learning'];
	const availableMilestoneTypes = milestoneTypes;
	
	// Get unique children names from milestones for filtering
	const availableMilestoneChildren = React.useMemo(() => {
		const uniqueChildren = new Set<string>();
		milestones.forEach(milestone => {
			if (milestone.childName) {
				uniqueChildren.add(milestone.childName);
			}
		});
		return Array.from(uniqueChildren);
	}, [milestones]);
	
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
		if (availableChildren.length > 0 && selectedMilestoneChildren.length === 0) {
			setSelectedMilestoneChildren(availableChildren);
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
		
		// Filter by milestone types (note: milestone.type doesn't exist in current schema, so skip type filtering for now)
		// if (selectedMilestoneTypes.length > 0) {
		// 	const milestoneType = milestone.type || 'general';
		// 	if (!selectedMilestoneTypes.includes(milestoneType)) {
		// 		return false;
		// 	}
		// }
		
		// Filter by selected children
		if (selectedMilestoneChildren.length > 0) {
			const milestoneChildName = milestone.childName;
			if (!milestoneChildName || !selectedMilestoneChildren.includes(milestoneChildName)) {
				return false;
			}
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
			console.error('Failed to update appointment note:', error);
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
				console.error('Failed to add appointment note:', error);
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
		setShowMilestoneChildrenFilter(false);
		setIsGestaltsFiltersExpanded(false);
	}, [activeTab]);
	
	const closeAllDropdowns = () => {
		setShowSpecialistFilter(false);
		setShowChildrenFilter(false);
		setShowJournalChildrenFilter(false);
		setShowMilestoneTypesFilter(false);
		setShowMilestoneChildrenFilter(false);
		closeMenu();
	};
	
	const toggleSearchFilters = () => {
		setIsSearchFiltersExpanded(!isSearchFiltersExpanded);
		if (isSearchFiltersExpanded) {
			closeAllDropdowns();
		}
	};

	// Menu management functions
	const toggleMenu = (id: string) => {
		setOpenMenuId(openMenuId === id ? null : id);
	};

	const closeMenu = () => {
		setOpenMenuId(null);
	};

	const handleMenuAction = (action: string, item: any, type: 'journal' | 'milestone' | 'appointment' | 'gestalt') => {
		closeMenu();
		if (action === 'view') {
			// Navigate to appropriate edit screen
			switch (type) {
				case 'journal':
					(navigation as any).navigate('AddJournal', { id: item.id });
					break;
				case 'milestone':
					(navigation as any).navigate('AddMilestone', { id: item.id });
					break;
				case 'appointment':
					(navigation as any).navigate('AppointmentNote', { id: item.id });
					break;
				case 'gestalt':
					(navigation as any).navigate('AddGestalt', { id: item.id });
					break;
			}
		} else if (action === 'delete') {
			// TODO: Implement delete functionality
			console.log('Delete', type, item.id);
		}
	};

	// Dropdown Menu Component
	const DropdownMenu = ({ isVisible, onClose, item, type }: { 
		isVisible: boolean; 
		onClose: () => void; 
		item: any; 
		type: 'journal' | 'milestone' | 'appointment' | 'gestalt' 
	}) => {
		if (!isVisible) return null;

		return (
			<>
				{/* Overlay */}
				<TouchableOpacity
					style={{
						position: 'absolute',
						top: -20,
						left: -20,
						right: -20,
						bottom: -20,
						zIndex: 998
					}}
					onPress={onClose}
					activeOpacity={1}
				/>
				{/* Menu Dropdown */}
				<View
					style={{
						position: 'absolute',
						top: 35,
						right: -5,
						backgroundColor: 'white',
						borderRadius: tokens.radius.xl,
						borderWidth: 1,
						borderColor: 'rgba(0,0,0,0.05)',
						shadowColor: '#000',
						shadowOffset: { width: 0, height: 12 },
						shadowOpacity: 0.25,
						shadowRadius: 25,
						elevation: 20,
						overflow: 'hidden',
						minWidth: 130,
						zIndex: 1001
					}}
				>
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
					
					<TouchableOpacity
						onPress={() => handleMenuAction('view', item, type)}
						activeOpacity={0.7}
						style={{
							alignItems: 'center',
							justifyContent: 'center',
							paddingHorizontal: tokens.spacing.gap.md,
							paddingVertical: tokens.spacing.gap.sm,
							borderBottomWidth: 0.5,
							borderBottomColor: 'rgba(124,58,237,0.1)',
							backgroundColor: 'transparent'
						}}
					>
						<Text style={{
							fontSize: tokens.font.size.sm,
							color: tokens.color.text.primary,
							fontWeight: '600',
							textAlign: 'center'
						}}>
							View/Edit
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						onPress={() => handleMenuAction('delete', item, type)}
						activeOpacity={0.7}
						style={{
							alignItems: 'center',
							justifyContent: 'center',
							paddingHorizontal: tokens.spacing.gap.md,
							paddingVertical: tokens.spacing.gap.sm,
							backgroundColor: 'transparent'
						}}
					>
						<Text style={{
							fontSize: tokens.font.size.sm,
							color: '#EF4444',
							fontWeight: '600',
							textAlign: 'center'
						}}>
							Delete
						</Text>
					</TouchableOpacity>
				</View>
			</>
		);
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

	// Milestone children filter helper functions
	const toggleMilestoneChildSelection = (child: string) => {
		setSelectedMilestoneChildren(prev => {
			if (prev.includes(child)) {
				return prev.filter(c => c !== child);
			} else {
				return [...prev, child];
			}
		});
	};
	
	const getSelectedMilestoneChildrenText = () => {
		if (selectedMilestoneChildren.length === 0 || selectedMilestoneChildren.length === availableMilestoneChildren.length) {
			return 'All Children';
		}
		if (selectedMilestoneChildren.length === 1) {
			return selectedMilestoneChildren[0];
		}
		return `${selectedMilestoneChildren.length} Selected`;
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

							{/* Collapsible Search & Filters */}
							<TouchableOpacity 
								onPress={toggleJournalFilters}
								style={{
									backgroundColor: tokens.color.bg.muted,
									borderRadius: tokens.radius.lg,
									padding: tokens.spacing.gap.md,
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'space-between',
									marginBottom: tokens.spacing.gap.sm
								}}
							>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Ionicons name="search" size={16} color={tokens.color.text.secondary} />
									<Text style={{
										marginLeft: tokens.spacing.gap.sm,
										fontSize: tokens.font.size.sm,
										color: tokens.color.text.secondary
									}}>Search & Filter</Text>
								</View>
								<Ionicons 
									name={isJournalFiltersExpanded ? "chevron-up" : "chevron-down"} 
									size={16} 
									color={tokens.color.text.secondary}
								/>
							</TouchableOpacity>

							{isJournalFiltersExpanded && (
								<View style={{
									backgroundColor: 'white',
									borderRadius: tokens.radius.lg,
									padding: tokens.spacing.gap.md,
									marginBottom: tokens.spacing.gap.md,
									borderWidth: 1,
									borderColor: tokens.color.border.default
								}}>
									{/* Search Input */}
									<View style={{
										backgroundColor: tokens.color.bg.muted,
										borderRadius: tokens.radius.lg,
										padding: tokens.spacing.gap.md,
										flexDirection: 'row',
										alignItems: 'center',
										marginBottom: tokens.spacing.gap.md
									}}>
										<Ionicons name="search" size={20} color={tokens.color.text.secondary} />
										<TextInput
											placeholder="Search journal entries..."
											value={searchQuery}
											onChangeText={setSearchQuery}
											style={{
												flex: 1,
												marginLeft: tokens.spacing.gap.sm,
												fontSize: tokens.font.size.body
											}}
										/>
									</View>

									{/* Journal Type Filter */}
									<View style={{ marginBottom: tokens.spacing.gap.sm }}>
										<Text style={{
											fontSize: tokens.font.size.sm,
											fontWeight: '600',
											color: tokens.color.text.primary,
											marginBottom: tokens.spacing.gap.xs
										}}>Entry Type</Text>
										<View style={{ flexDirection: 'row', gap: tokens.spacing.gap.sm }}>
											{['all', 'personal', 'child'].map(type => (
												<TouchableOpacity
													key={type}
													onPress={() => setJournalTypeFilter(type as any)}
													style={{
														paddingHorizontal: tokens.spacing.gap.sm,
														paddingVertical: tokens.spacing.gap.xs,
														borderRadius: tokens.radius.lg,
														backgroundColor: journalTypeFilter === type ? tokens.color.brand.gradient.start + '15' : tokens.color.bg.muted,
														borderWidth: 1,
														borderColor: journalTypeFilter === type ? tokens.color.brand.gradient.start + '30' : 'transparent'
													}}
												>
													<Text style={{
														fontSize: tokens.font.size.sm,
														color: journalTypeFilter === type ? tokens.color.brand.gradient.start : tokens.color.text.secondary,
														fontWeight: journalTypeFilter === type ? '600' : '500'
													}}>
														{type.charAt(0).toUpperCase() + type.slice(1)}
													</Text>
												</TouchableOpacity>
											))}
										</View>
									</View>
								</View>
							)}

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
										elevation: 1,
										position: 'relative',
										zIndex: openMenuId === `journal-${entry.id}` ? 1000 : 1
									}}>
										<View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: tokens.spacing.gap.sm }}>
											<View style={{ flex: 1 }}>
												{/* Journal Entry Title/Name above date */}
												<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
													<Ionicons name="create-outline" size={16} color={tokens.color.brand.gradient.start} />
													<Text style={{
														fontSize: tokens.font.size.body,
														color: tokens.color.text.primary,
														fontWeight: '600',
														flex: 1
													}}>
														{(entry.type || 'personal') !== 'personal' ? 
															`${entry.childName || 'Child'} Journal` : 
															'Personal Journal'
														}
													</Text>
												</View>
												{/* Date below title */}
												<Text style={{
													fontSize: tokens.font.size.small,
													color: tokens.color.text.secondary,
													fontWeight: '500'
												}}>{dayjs(entry.createdAtISO).format('MMM DD, YYYY • HH:mm')}</Text>
											</View>
											<View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.gap.sm }}>
												{entry.mood && (
													<View style={{
														paddingHorizontal: 8,
														paddingVertical: 4,
														borderRadius: 12,
														backgroundColor: 
															entry.mood === 'good' ? '#10B981' :
															entry.mood === 'tough' ? '#EF4444' : '#F59E0B'
													}}>
														<Text style={{
															fontSize: tokens.font.size.small,
															fontWeight: '600',
															color: 'white',
															textTransform: 'capitalize'
														}}>
															{entry.mood}
														</Text>
													</View>
												)}
												{/* Three dots menu */}
												<View style={{ position: 'relative' }}>
													<TouchableOpacity
														onPress={() => toggleMenu(`journal-${entry.id}`)}
														style={{
															padding: 4
														}}
													>
														<Ionicons name="ellipsis-vertical" size={16} color={tokens.color.text.secondary} />
													</TouchableOpacity>
													<DropdownMenu
														isVisible={openMenuId === `journal-${entry.id}`}
														onClose={closeMenu}
														item={entry}
														type="journal"
													/>
												</View>
											</View>
										</View>
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

							{/* Collapsible Search & Filters */}
							<TouchableOpacity 
								onPress={() => setIsMilestoneFiltersExpanded(!isMilestoneFiltersExpanded)}
								style={{
									backgroundColor: tokens.color.bg.muted,
									borderRadius: tokens.radius.lg,
									padding: tokens.spacing.gap.md,
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'space-between',
									marginBottom: tokens.spacing.gap.sm
								}}
							>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Ionicons name="search" size={16} color={tokens.color.text.secondary} />
									<Text style={{
										marginLeft: tokens.spacing.gap.sm,
										fontSize: tokens.font.size.sm,
										color: tokens.color.text.secondary
									}}>Search & Filter</Text>
								</View>
								<Ionicons 
									name={isMilestoneFiltersExpanded ? "chevron-up" : "chevron-down"} 
									size={16} 
									color={tokens.color.text.secondary}
								/>
							</TouchableOpacity>

							{isMilestoneFiltersExpanded && (
								<View style={{
									backgroundColor: 'white',
									borderRadius: tokens.radius.lg,
									padding: tokens.spacing.gap.md,
									marginBottom: tokens.spacing.gap.md,
									borderWidth: 1,
									borderColor: tokens.color.border.default
								}}>
									{/* Search Input */}
									<View style={{
										backgroundColor: tokens.color.bg.muted,
										borderRadius: tokens.radius.lg,
										padding: tokens.spacing.gap.md,
										flexDirection: 'row',
										alignItems: 'center',
										marginBottom: tokens.spacing.gap.md
									}}>
										<Ionicons name="search" size={20} color={tokens.color.text.secondary} />
										<TextInput
											placeholder="Search milestones..."
											value={searchQuery}
											onChangeText={setSearchQuery}
											style={{
												flex: 1,
												marginLeft: tokens.spacing.gap.sm,
												fontSize: tokens.font.size.body
											}}
										/>
									</View>

									{/* Milestone Type Filter */}
									<View style={{ marginBottom: tokens.spacing.gap.sm }}>
										<Text style={{
											fontSize: tokens.font.size.sm,
											fontWeight: '600',
											color: tokens.color.text.primary,
											marginBottom: tokens.spacing.gap.xs
										}}>Milestone Types</Text>
										<TouchableOpacity
											onPress={() => setShowMilestoneTypesFilter(!showMilestoneTypesFilter)}
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
												{getSelectedMilestoneTypesText()}
											</Text>
											<Ionicons 
												name={showMilestoneTypesFilter ? "chevron-up" : "chevron-down"} 
												size={16} 
												color={tokens.color.text.secondary}
											/>
										</TouchableOpacity>

										{/* Milestone Types Dropdown */}
										{showMilestoneTypesFilter && (
											<View style={{
												backgroundColor: 'white',
												borderRadius: tokens.radius.lg,
												shadowColor: '#000',
												shadowOffset: { width: 0, height: 2 },
												shadowOpacity: 0.08,
												shadowRadius: 12,
												elevation: 6,
												marginTop: 4,
												maxHeight: 150
											}}>
												<ScrollView style={{ maxHeight: 150 }}>
													{availableMilestoneTypes.map((type, index) => (
														<TouchableOpacity
															key={type}
															onPress={() => toggleMilestoneTypeSelection(type)}
															style={{
																paddingVertical: tokens.spacing.gap.xs,
																paddingHorizontal: tokens.spacing.gap.sm,
																borderBottomWidth: index !== availableMilestoneTypes.length - 1 ? 0.5 : 0,
																borderBottomColor: 'rgba(0,0,0,0.08)',
																flexDirection: 'row',
																alignItems: 'center',
																justifyContent: 'space-between'
															}}
														>
															<Text style={{
																fontSize: tokens.font.size.sm,
																color: selectedMilestoneTypes.includes(type) ? tokens.color.brand.gradient.start : tokens.color.text.secondary,
																fontWeight: '400'
															}}>
																{type}
															</Text>
															{selectedMilestoneTypes.includes(type) && (
																<Ionicons name="checkmark" size={12} color={tokens.color.brand.gradient.start} />
															)}
														</TouchableOpacity>
													))}
												</ScrollView>
											</View>
										)}
									</View>
									
									{/* Milestone Children Filter */}
									{availableMilestoneChildren.length > 0 && (
										<View style={{ marginBottom: tokens.spacing.gap.sm }}>
											<Text style={{
												fontSize: tokens.font.size.sm,
												fontWeight: '600',
												color: tokens.color.text.primary,
												marginBottom: tokens.spacing.gap.xs
											}}>Children</Text>
											<TouchableOpacity
												onPress={() => setShowMilestoneChildrenFilter(!showMilestoneChildrenFilter)}
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
													{getSelectedMilestoneChildrenText()}
												</Text>
												<Ionicons 
													name={showMilestoneChildrenFilter ? "chevron-up" : "chevron-down"} 
													size={16} 
													color={tokens.color.text.secondary}
												/>
											</TouchableOpacity>
											{/* Milestone Children Dropdown */}
											{showMilestoneChildrenFilter && (
												<View style={{
													backgroundColor: 'white',
													borderRadius: tokens.radius.lg,
													shadowColor: '#000',
													shadowOffset: { width: 0, height: 2 },
													shadowOpacity: 0.08,
													shadowRadius: 12,
													elevation: 6,
													marginTop: 4,
													maxHeight: 150
												}}>
													<ScrollView style={{ maxHeight: 150 }}>
														{availableMilestoneChildren.map((child, index) => (
															<TouchableOpacity
																key={child}
																onPress={() => toggleMilestoneChildSelection(child)}
																style={{
																	paddingVertical: tokens.spacing.gap.xs,
																	paddingHorizontal: tokens.spacing.gap.sm,
																	borderBottomWidth: index !== availableMilestoneChildren.length - 1 ? 0.5 : 0,
																	borderBottomColor: 'rgba(0,0,0,0.08)',
																	flexDirection: 'row',
																	alignItems: 'center',
																	justifyContent: 'space-between'
																}}
															>
																<Text style={{
																	fontSize: tokens.font.size.sm,
																	color: selectedMilestoneChildren.includes(child) ? tokens.color.brand.gradient.start : tokens.color.text.secondary,
																	fontWeight: '400'
																}}>
																	{child}
																</Text>
																{selectedMilestoneChildren.includes(child) && (
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
									elevation: 1,
									position: 'relative',
									zIndex: openMenuId === `milestone-${milestone.id}` ? 1000 : 1
								}}>
									<View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: tokens.spacing.gap.sm }}>
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
										<View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.gap.sm }}>
											{/* Child badge */}
											{milestone.childName && (
												<View style={{
													paddingHorizontal: 8,
													paddingVertical: 4,
													borderRadius: 12,
													backgroundColor: tokens.color.brand.gradient.start
												}}>
													<Text style={{
														fontSize: tokens.font.size.small,
														fontWeight: '600',
														color: 'white'
													}}>
														{milestone.childName}
													</Text>
												</View>
											)}
											{/* Three dots menu */}
											<View style={{ position: 'relative' }}>
												<TouchableOpacity
													onPress={() => toggleMenu(`milestone-${milestone.id}`)}
													style={{
														padding: 4
													}}
												>
													<Ionicons name="ellipsis-vertical" size={16} color={tokens.color.text.secondary} />
												</TouchableOpacity>
												<DropdownMenu
													isVisible={openMenuId === `milestone-${milestone.id}`}
													onClose={closeMenu}
													item={milestone}
													type="milestone"
												/>
											</View>
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

							{/* Collapsible Search & Filters */}
							<TouchableOpacity 
								onPress={toggleSearchFilters}
								style={{
									backgroundColor: tokens.color.bg.muted,
									borderRadius: tokens.radius.lg,
									padding: tokens.spacing.gap.md,
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'space-between',
									marginBottom: tokens.spacing.gap.sm
								}}
							>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Ionicons name="search" size={16} color={tokens.color.text.secondary} />
									<Text style={{
										marginLeft: tokens.spacing.gap.sm,
										fontSize: tokens.font.size.sm,
										color: tokens.color.text.secondary
									}}>Search & Filter</Text>
								</View>
								<Ionicons 
									name={isSearchFiltersExpanded ? "chevron-up" : "chevron-down"} 
									size={16} 
									color={tokens.color.text.secondary}
								/>
							</TouchableOpacity>

							{isSearchFiltersExpanded && (
								<View style={{
									backgroundColor: 'white',
									borderRadius: tokens.radius.lg,
									padding: tokens.spacing.gap.md,
									marginBottom: tokens.spacing.gap.md,
									borderWidth: 1,
									borderColor: tokens.color.border.default
								}}>
									{/* Search Input */}
									<View style={{
										backgroundColor: tokens.color.bg.muted,
										borderRadius: tokens.radius.lg,
										padding: tokens.spacing.gap.md,
										flexDirection: 'row',
										alignItems: 'center',
										marginBottom: tokens.spacing.gap.md
									}}>
										<Ionicons name="search" size={20} color={tokens.color.text.secondary} />
										<TextInput
											placeholder="Search appointment notes..."
											value={searchQuery}
											onChangeText={setSearchQuery}
											style={{
												flex: 1,
												marginLeft: tokens.spacing.gap.sm,
												fontSize: tokens.font.size.body
											}}
										/>
									</View>

									{/* Status Filter */}
									<View style={{ marginBottom: tokens.spacing.gap.md }}>
										<Text style={{
											fontSize: tokens.font.size.sm,
											fontWeight: '600',
											color: tokens.color.text.primary,
											marginBottom: tokens.spacing.gap.xs
										}}>Status</Text>
										<View style={{ flexDirection: 'row', gap: tokens.spacing.gap.sm }}>
											{(['all', 'open', 'completed'] as const).map(status => (
												<TouchableOpacity
													key={status}
													onPress={() => setAppointmentFilter(status)}
													style={{
														paddingHorizontal: tokens.spacing.gap.sm,
														paddingVertical: tokens.spacing.gap.xs,
														borderRadius: tokens.radius.lg,
														backgroundColor: appointmentFilter === status ? tokens.color.brand.gradient.start + '15' : tokens.color.bg.muted,
														borderWidth: 1,
														borderColor: appointmentFilter === status ? tokens.color.brand.gradient.start + '30' : 'transparent'
													}}
												>
													<Text style={{
														fontSize: tokens.font.size.sm,
														color: appointmentFilter === status ? tokens.color.brand.gradient.start : tokens.color.text.secondary,
														fontWeight: appointmentFilter === status ? '600' : '500'
													}}>
														{status.charAt(0).toUpperCase() + status.slice(1)}
													</Text>
												</TouchableOpacity>
											))}
										</View>
									</View>

									{/* Specialist Filter */}
									{availableSpecialists.length > 1 && (
										<View style={{ marginBottom: tokens.spacing.gap.sm }}>
											<Text style={{
												fontSize: tokens.font.size.sm,
												fontWeight: '600',
												color: tokens.color.text.primary,
												marginBottom: tokens.spacing.gap.xs
											}}>Specialists</Text>
											<TouchableOpacity
												onPress={() => setShowSpecialistFilter(!showSpecialistFilter)}
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
													{getSelectedSpecialistsText()}
												</Text>
												<Ionicons 
													name={showSpecialistFilter ? "chevron-up" : "chevron-down"} 
													size={16} 
													color={tokens.color.text.secondary}
												/>
											</TouchableOpacity>

											{/* Specialist Dropdown */}
											{showSpecialistFilter && (
												<View style={{
													backgroundColor: 'white',
													borderRadius: tokens.radius.lg,
													shadowColor: '#000',
													shadowOffset: { width: 0, height: 2 },
													shadowOpacity: 0.08,
													shadowRadius: 12,
													elevation: 6,
													marginTop: 4,
													maxHeight: 150
												}}>
													<ScrollView style={{ maxHeight: 150 }}>
														{availableSpecialists.map((specialist, index) => (
															<TouchableOpacity
																key={specialist}
																onPress={() => toggleSpecialistSelection(specialist)}
																style={{
																	paddingVertical: tokens.spacing.gap.xs,
																	paddingHorizontal: tokens.spacing.gap.sm,
																	borderBottomWidth: index !== availableSpecialists.length - 1 ? 0.5 : 0,
																	borderBottomColor: 'rgba(0,0,0,0.08)',
																	flexDirection: 'row',
																	alignItems: 'center',
																	justifyContent: 'space-between'
																}}
															>
																<Text style={{
																	fontSize: tokens.font.size.sm,
																	color: selectedSpecialists.includes(specialist) ? tokens.color.brand.gradient.start : tokens.color.text.secondary,
																	fontWeight: '400'
																}}>
																	{specialist}
																</Text>
																{selectedSpecialists.includes(specialist) && (
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
									position: 'relative',
									zIndex: openMenuId === `appointment-${appointment.id}` ? 1000 : 1
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

										{/* Three dots menu */}
										<View style={{ position: 'relative' }}>
											<TouchableOpacity
												onPress={() => toggleMenu(`appointment-${appointment.id}`)}
												style={{
													padding: 4
												}}
											>
												<Ionicons name="ellipsis-vertical" size={16} color={tokens.color.text.secondary} />
											</TouchableOpacity>
											<DropdownMenu
												isVisible={openMenuId === `appointment-${appointment.id}`}
												onClose={closeMenu}
												item={appointment}
												type="appointment"
											/>
										</View>
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
								onPress={() => (navigation as any).navigate('AddGestalt')}
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
								}}>Add New Gestalt</Text>
							</TouchableOpacity>

							{/* Collapsible Search & Filters */}
							<TouchableOpacity 
								onPress={() => setIsGestaltsFiltersExpanded(!isGestaltsFiltersExpanded)}
								style={{
									backgroundColor: tokens.color.bg.muted,
									borderRadius: tokens.radius.lg,
									padding: tokens.spacing.gap.md,
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'space-between',
									marginBottom: tokens.spacing.gap.sm
								}}
							>
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Ionicons name="search" size={16} color={tokens.color.text.secondary} />
									<Text style={{
										marginLeft: tokens.spacing.gap.sm,
										fontSize: tokens.font.size.sm,
										color: tokens.color.text.secondary
									}}>Search & Filter</Text>
								</View>
								<Ionicons 
									name={isGestaltsFiltersExpanded ? "chevron-up" : "chevron-down"} 
									size={16} 
									color={tokens.color.text.secondary}
								/>
							</TouchableOpacity>

							{isGestaltsFiltersExpanded && (
								<View style={{
									backgroundColor: 'white',
									borderRadius: tokens.radius.lg,
									padding: tokens.spacing.gap.md,
									marginBottom: tokens.spacing.gap.md,
									borderWidth: 1,
									borderColor: tokens.color.border.default
								}}>
									{/* Search Input */}
									<View style={{
										backgroundColor: tokens.color.bg.muted,
										borderRadius: tokens.radius.lg,
										padding: tokens.spacing.gap.md,
										flexDirection: 'row',
										alignItems: 'center',
										marginBottom: tokens.spacing.gap.md
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

								</View>
							)}

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
									elevation: 1,
									position: 'relative',
									zIndex: openMenuId === `gestalt-${gestalt.id}` ? 1000 : 1
								}}>
									<View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: tokens.spacing.gap.sm }}>
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
										<View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.gap.sm }}>
											{/* Three dots menu */}
											<View style={{ position: 'relative' }}>
												<TouchableOpacity
													onPress={() => toggleMenu(`gestalt-${gestalt.id}`)}
													style={{
														padding: 4
													}}
												>
													<Ionicons name="ellipsis-vertical" size={16} color={tokens.color.text.secondary} />
												</TouchableOpacity>
												<DropdownMenu
													isVisible={openMenuId === `gestalt-${gestalt.id}`}
													onClose={closeMenu}
													item={gestalt}
													type="gestalt"
												/>
											</View>
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