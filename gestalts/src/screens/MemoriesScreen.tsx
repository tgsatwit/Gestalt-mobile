import React, { useState, useRef } from 'react';
import { ScrollView, TextInput, View, TouchableOpacity } from 'react-native';
import { Text, useTheme } from '../theme';
import { useMemoriesStore } from '../state/useStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';
import { useDrawer } from '../navigation/SimpleDrawer';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../navigation/MainNavigator';
import { BottomNavigation } from '../components/BottomNavigation';

type MemoryTab = 'journal' | 'milestones' | 'appointments' | 'gestalts';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export default function MemoriesScreen() {
	const { tokens } = useTheme();
	const { openDrawer } = useDrawer();
	const navigation = useNavigation<NavigationProp>();
	const { journal, milestones, appointmentNotes, profile } = useMemoriesStore();
	const [activeTab, setActiveTab] = useState<MemoryTab>('journal');
	const [searchQuery, setSearchQuery] = useState('');
	const [showLeftArrow, setShowLeftArrow] = useState(false);
	const [showRightArrow, setShowRightArrow] = useState(true);
	const scrollViewRef = useRef<any>(null);

	// Appointments state
	const [appointmentFilter, setAppointmentFilter] = useState<'all' | 'open' | 'completed'>('all');
	const [editingAppointment, setEditingAppointment] = useState<string | null>(null);
	const [newAppointmentText, setNewAppointmentText] = useState('');
	const [showQuickAdd, setShowQuickAdd] = useState(false);
	
	// Filter dropdown states
	const [showSpecialistFilter, setShowSpecialistFilter] = useState(false);
	const [showChildrenFilter, setShowChildrenFilter] = useState(false);
	const [selectedSpecialists, setSelectedSpecialists] = useState<string[]>([]);
	const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
	
	// Collapsible search/filter state
	const [isSearchFiltersExpanded, setIsSearchFiltersExpanded] = useState(false);

	// Mock gestalts data - this would come from store in real implementation
	const gestalts = [
		{ id: '1', phrase: 'To infinity and beyond!', source: 'Toy Story', stage: 'Stage 1', contexts: ['Playing with toys', 'Expressing excitement'] },
		{ id: '2', phrase: "Let's go on an adventure", source: 'Daily routine', stage: 'Stage 2', contexts: ['Going out', 'Starting activities'] },
		{ id: '3', phrase: "It's gonna be okay", source: 'Parent comfort', stage: 'Stage 3', contexts: ['Self-soothing', 'Comforting others'] }
	];

	// Enhanced appointments data with completion status
	const [appointments, setAppointments] = useState([
		{ 
			id: '1', 
			question: 'Ask about daughter\'s echolalia patterns', 
			specialist: 'Dr. Smith', 
			completed: false, 
			createdAt: new Date().toISOString(),
			details: '',
			photo: null,
			completionNotes: ''
		},
		{ 
			id: '2', 
			question: 'Discuss gestalt stage progression', 
			specialist: 'Dr. Johnson', 
			completed: true, 
			createdAt: new Date().toISOString(),
			details: 'Need to understand timeline better',
			photo: null,
			completionNotes: 'Dr. Johnson said progression is normal, expect 6-12 months for next stage'
		},
		{ 
			id: '3', 
			question: 'Review play therapy options', 
			specialist: 'Sarah Miller', 
			completed: false, 
			createdAt: new Date().toISOString(),
			details: '',
			photo: null,
			completionNotes: ''
		}
	]);

	const specialists = ['Dr. Smith', 'Dr. Johnson', 'Sarah Miller', 'Dr. Brown'];
	
	// Get unique specialists and children from appointments and profile
	const availableSpecialists = [...new Set([
		...specialists,
		...appointments.filter(apt => apt.specialist).map(apt => apt.specialist!)
	])];
	
	// For now, simulate multiple children - in the future this would come from store
	const availableChildren = profile ? [profile.childName] : [];
	// Simulate multiple children for testing (uncomment this line to test multi-child layout)
	// const availableChildren = profile ? [profile.childName, 'Emma', 'Alex'] : [];
	
	// Initialize filters when specialists/children change
	React.useEffect(() => {
		if (availableSpecialists.length === 1 && selectedSpecialists.length === 0) {
			setSelectedSpecialists(availableSpecialists);
		}
		if (availableChildren.length === 1 && selectedChildren.length === 0) {
			setSelectedChildren(availableChildren);
		}
	}, [availableSpecialists.length, availableChildren.length]);

	const filteredAppointments = appointments.filter(apt => {
		// Filter by completion status
		if (appointmentFilter === 'completed' && !apt.completed) return false;
		if (appointmentFilter === 'open' && apt.completed) return false;
		
		// Filter by specialist (if any selected)
		if (selectedSpecialists.length > 0 && selectedSpecialists.length < availableSpecialists.length) {
			if (!apt.specialist || !selectedSpecialists.includes(apt.specialist)) return false;
		}
		
		// Filter by children (placeholder for future multi-child support)
		if (selectedChildren.length > 0 && selectedChildren.length < availableChildren.length) {
			// This would be used when appointments are linked to specific children
			// For now, all appointments belong to the current child
		}
		
		return true;
	});

	const moods = [
		{ key: 'good', label: 'Good Day', icon: '😊', color: '#22C55E' },
		{ key: 'neutral', label: 'Neutral', icon: '😐', color: '#6B7280' },
		{ key: 'tough', label: 'Tough Day', icon: '😔', color: '#EF4444' }
	] as const;

	const tabs = [
		{ key: 'journal', label: 'Journal', icon: 'journal-outline', count: journal.length },
		{ key: 'milestones', label: 'Milestones', icon: 'flag-outline', count: milestones.length },
		{ key: 'appointments', label: 'Appointments', icon: 'calendar-outline', count: appointmentNotes.length },
		{ key: 'gestalts', label: 'Gestalts', icon: 'list-outline', count: gestalts.length }
	] as const;


	const filterEntries = (entries: any[], searchField: string) => {
		if (!searchQuery.trim()) return entries;
		return entries.filter(entry => 
			entry[searchField]?.toLowerCase().includes(searchQuery.toLowerCase())
		);
	};

	const toggleAppointmentComplete = (id: string) => {
		setAppointments(prev => prev.map(apt => 
			apt.id === id ? { ...apt, completed: !apt.completed } : apt
		));
	};

	const addQuickAppointment = () => {
		if (newAppointmentText.trim()) {
			const newAppointment = {
				id: Date.now().toString(),
				question: newAppointmentText.trim(),
				specialist: '',
				completed: false,
				createdAt: new Date().toISOString(),
				details: '',
				photo: null,
				completionNotes: ''
			};
			setAppointments(prev => [newAppointment, ...prev]);
			setNewAppointmentText('');
			setShowQuickAdd(false);
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
	}, [activeTab]);

	const closeAllDropdowns = () => {
		setShowSpecialistFilter(false);
		setShowChildrenFilter(false);
	};

	const toggleSearchFilters = () => {
		setIsSearchFiltersExpanded(!isSearchFiltersExpanded);
		if (isSearchFiltersExpanded) {
			// Close dropdowns when collapsing
			closeAllDropdowns();
		}
	};


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
					contentContainerStyle={{ paddingBottom: 100 }}
					showsVerticalScrollIndicator={false}
					onScrollBeginDrag={closeAllDropdowns}
					>
					{/* Tab Navigation */}
					<View style={{
						paddingTop: 24,
						paddingHorizontal: tokens.spacing.containerX
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

					{/* Left Scroll Indicator */}
					{showLeftArrow && (
						<View style={{
							position: 'absolute',
							left: 0,
							top: 24,
							height: 44,
							width: 60,
							zIndex: 10
						}}>
							{/* White gradient overlay */}
							<LinearGradient
								colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0)']}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									right: 0,
									bottom: 0
								}}
							/>
							
							{/* Rounded arrow button */}
							<TouchableOpacity
								onPress={() => {
									scrollViewRef.current?.scrollTo({ x: 0, animated: true });
								}}
								style={{
									position: 'absolute',
									left: tokens.spacing.containerX,
									top: 12,
									width: 32,
									height: 32,
									borderRadius: 16,
									backgroundColor: 'white',
									alignItems: 'center',
									justifyContent: 'center',
									shadowColor: '#000',
									shadowOffset: { width: 0, height: 2 },
									shadowOpacity: 0.15,
									shadowRadius: 8,
									elevation: 4,
									borderWidth: 1,
									borderColor: 'rgba(0,0,0,0.08)'
								}}
							>
								<Ionicons name="chevron-back" size={16} color={tokens.color.brand.gradient.start} />
							</TouchableOpacity>
						</View>
					)}

					{/* Right Scroll Indicator */}
					{showRightArrow && (
						<View style={{
							position: 'absolute',
							right: 0,
							top: 24,
							height: 44,
							width: 60,
							zIndex: 10
						}}>
							{/* White gradient overlay */}
							<LinearGradient
								colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,1)']}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									right: 0,
									bottom: 0
								}}
							/>
							
							{/* Rounded arrow button */}
							<TouchableOpacity
								onPress={() => {
									scrollViewRef.current?.scrollToEnd({ animated: true });
								}}
								style={{
									position: 'absolute',
									right: tokens.spacing.containerX,
									top: 12,
									width: 32,
									height: 32,
									borderRadius: 16,
									backgroundColor: 'white',
									alignItems: 'center',
									justifyContent: 'center',
									shadowColor: '#000',
									shadowOffset: { width: 0, height: 2 },
									shadowOpacity: 0.15,
									shadowRadius: 8,
									elevation: 4,
									borderWidth: 1,
									borderColor: 'rgba(0,0,0,0.08)'
								}}
							>
								<Ionicons name="chevron-forward" size={16} color={tokens.color.brand.gradient.start} />
							</TouchableOpacity>
						</View>
					)}

					{/* Search Bar - moved to individual tabs that need it */}

					{/* Content based on active tab */}
					{activeTab === 'journal' && (
						<View>
							{/* Search Bar */}
							<View style={{
								flexDirection: 'row',
								alignItems: 'center',
								backgroundColor: tokens.color.bg.muted,
								borderRadius: tokens.radius.lg,
								paddingHorizontal: tokens.spacing.gap.sm,
								paddingVertical: tokens.spacing.gap.sm,
								borderWidth: 1,
								borderColor: tokens.color.border.default,
								marginBottom: tokens.spacing.gap.lg
							}}>
								<Ionicons name="search" size={14} color={tokens.color.text.secondary} style={{ marginRight: 8 }} />
								<TextInput
									placeholder="Search journal..."
									value={searchQuery}
									onChangeText={setSearchQuery}
									style={{
										flex: 1,
										fontSize: tokens.font.size.xs,
										color: tokens.color.text.primary,
										fontWeight: '400'
									}}
									placeholderTextColor={tokens.color.text.secondary}
								/>
								{searchQuery ? (
									<TouchableOpacity onPress={() => setSearchQuery('')}>
										<Ionicons name="close-circle" size={14} color={tokens.color.text.secondary} />
									</TouchableOpacity>
								) : null}
							</View>

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
								<Ionicons name="add-circle" size={20} color={tokens.color.brand.gradient.start} />
								<Text style={{
									marginLeft: tokens.spacing.gap.sm,
									fontSize: tokens.font.size.body,
									fontWeight: '600',
									color: tokens.color.brand.gradient.start
								}}>Add New Journal Entry</Text>
							</TouchableOpacity>


							{/* Journal Entries */}
							{filterEntries(journal, 'content').map((entry) => (
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
										<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
											<Ionicons name="journal-outline" size={16} color={tokens.color.brand.gradient.start} />
											<Text style={{
												fontSize: tokens.font.size.small,
												color: tokens.color.text.secondary,
												fontWeight: '500'
											}}>{dayjs(entry.createdAtISO).format('MMM DD, YYYY • HH:mm')}</Text>
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
							))}
						</View>
					)}

					{activeTab === 'milestones' && (
						<View>
							{/* Search Bar */}
							<View style={{
								flexDirection: 'row',
								alignItems: 'center',
								backgroundColor: tokens.color.bg.muted,
								borderRadius: tokens.radius.lg,
								paddingHorizontal: tokens.spacing.gap.sm,
								paddingVertical: tokens.spacing.gap.sm,
								borderWidth: 1,
								borderColor: tokens.color.border.default,
								marginBottom: tokens.spacing.gap.lg
							}}>
								<Ionicons name="search" size={14} color={tokens.color.text.secondary} style={{ marginRight: 8 }} />
								<TextInput
									placeholder="Search milestones..."
									value={searchQuery}
									onChangeText={setSearchQuery}
									style={{
										flex: 1,
										fontSize: tokens.font.size.xs,
										color: tokens.color.text.primary,
										fontWeight: '400'
									}}
									placeholderTextColor={tokens.color.text.secondary}
								/>
								{searchQuery ? (
									<TouchableOpacity onPress={() => setSearchQuery('')}>
										<Ionicons name="close-circle" size={14} color={tokens.color.text.secondary} />
									</TouchableOpacity>
								) : null}
							</View>

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


							{/* Milestones */}
							{filterEntries(milestones, 'title').map((milestone) => (
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
							{/* Search & Filter Toggle */}
							<TouchableOpacity
								onPress={toggleSearchFilters}
								activeOpacity={0.7}
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									justifyContent: 'space-between',
									backgroundColor: tokens.color.bg.muted,
									borderRadius: tokens.radius.lg,
									borderWidth: 1,
									borderColor: tokens.color.border.default,
									paddingHorizontal: tokens.spacing.gap.sm,
									paddingVertical: tokens.spacing.gap.sm,
									marginBottom: tokens.spacing.gap.sm
								}}
							>
								<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
									<Ionicons name="funnel-outline" size={14} color={tokens.color.text.secondary} />
									<Text style={{
										fontSize: tokens.font.size.sm,
										color: tokens.color.text.secondary,
										fontWeight: '400'
									}}>
										Search & Filters
									</Text>
								</View>
								<Ionicons 
									name={isSearchFiltersExpanded ? "chevron-up" : "chevron-down"} 
									size={14} 
									color={tokens.color.text.secondary} 
								/>
							</TouchableOpacity>

							{/* Collapsible Search & Filter Section */}
							{isSearchFiltersExpanded && (
								<View style={{ marginBottom: tokens.spacing.gap.md }}>
								{/* Search Bar */}
								<View style={{
									flexDirection: 'row',
									alignItems: 'center',
									backgroundColor: tokens.color.bg.muted,
									borderRadius: tokens.radius.lg,
									paddingHorizontal: tokens.spacing.gap.sm,
									paddingVertical: tokens.spacing.gap.sm,
									borderWidth: 1,
									borderColor: tokens.color.border.default,
									marginBottom: tokens.spacing.gap.sm
								}}>
									<Ionicons name="search" size={14} color={tokens.color.text.secondary} style={{ marginRight: 8 }} />
									<TextInput
										placeholder="Search appointments..."
										value={searchQuery}
										onChangeText={setSearchQuery}
										onFocus={closeAllDropdowns}
										style={{
											flex: 1,
											fontSize: tokens.font.size.sm,
											color: tokens.color.text.primary,
											fontWeight: '400'
										}}
										placeholderTextColor={tokens.color.text.secondary}
									/>
									{searchQuery ? (
										<TouchableOpacity onPress={() => setSearchQuery('')}>
											<Ionicons name="close-circle" size={14} color={tokens.color.text.secondary} />
										</TouchableOpacity>
									) : null}
								</View>

								{/* Status Filter Tabs */}
								<View style={{ 
									flexDirection: 'row', 
									marginBottom: tokens.spacing.gap.sm,
									backgroundColor: tokens.color.bg.muted,
									borderRadius: tokens.radius.lg,
									borderWidth: 1,
									borderColor: tokens.color.border.default,
									padding: 4
								}}>
									{(['all', 'open', 'completed'] as const).map((filter) => (
										<TouchableOpacity
											key={filter}
											onPress={() => setAppointmentFilter(filter)}
											style={{
												flex: 1,
												paddingVertical: tokens.spacing.gap.sm,
												paddingHorizontal: tokens.spacing.gap.sm,
												borderRadius: tokens.radius.lg - 4,
												backgroundColor: appointmentFilter === filter ? 'white' : 'transparent',
												alignItems: 'center'
											}}
										>
											<Text style={{
												fontSize: tokens.font.size.sm,
												fontWeight: '400',
												color: appointmentFilter === filter ? tokens.color.text.primary : tokens.color.text.secondary
											}}>
												{filter.charAt(0).toUpperCase() + filter.slice(1)}
											</Text>
										</TouchableOpacity>
									))}
								</View>

								{/* Dropdown Filters Row */}
								{(availableChildren.length > 1 || availableSpecialists.length > 1) && (
									<View style={{ 
										flexDirection: 'row', 
										gap: tokens.spacing.gap.sm,
										position: 'relative'
									}}>
									{/* Children Filter Dropdown - Left Side */}
									{availableChildren.length > 1 && (
										<View style={{ 
											flex: availableSpecialists.length > 1 ? 1 : 2,
											position: 'relative' 
										}}>
											<TouchableOpacity
												onPress={() => {
													setShowChildrenFilter(!showChildrenFilter);
													setShowSpecialistFilter(false);
												}}
												activeOpacity={0.7}
												style={{
													flexDirection: 'row',
													alignItems: 'center',
													backgroundColor: tokens.color.bg.muted,
													paddingHorizontal: tokens.spacing.gap.sm,
													paddingVertical: tokens.spacing.gap.sm,
													borderRadius: tokens.radius.lg,
													borderWidth: 1,
													borderColor: tokens.color.border.default
												}}
											>
												<Text style={{
													fontSize: tokens.font.size.sm,
													color: tokens.color.text.secondary,
													marginRight: 4,
													fontWeight: '400',
													flex: 1
												}}>
													{getSelectedChildrenText()}
												</Text>
												<Ionicons 
													name={showChildrenFilter ? "chevron-up" : "chevron-down"} 
													size={12} 
													color={tokens.color.text.secondary} 
												/>
											</TouchableOpacity>

											{/* Children Dropdown */}
											{showChildrenFilter && (
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
														{availableChildren.map((child, index) => (
															<TouchableOpacity
																key={child}
																onPress={() => toggleChildSelection(child)}
																activeOpacity={0.7}
																style={{
																	paddingVertical: tokens.spacing.gap.xs,
																	paddingHorizontal: tokens.spacing.gap.sm,
																	borderBottomWidth: index !== availableChildren.length - 1 ? 0.5 : 0,
																	borderBottomColor: 'rgba(0,0,0,0.08)',
																	backgroundColor: selectedChildren.includes(child) ? tokens.color.bg.muted : 'transparent',
																	flexDirection: 'row',
																	alignItems: 'center',
																	justifyContent: 'space-between'
																}}
															>
																<Text style={{
																	fontSize: tokens.font.size.sm,
																	color: selectedChildren.includes(child) ? tokens.color.brand.gradient.start : tokens.color.text.secondary,
																	fontWeight: '400'
																}}>
																	{child}
																</Text>
																{selectedChildren.includes(child) && (
																	<Ionicons name="checkmark" size={12} color={tokens.color.brand.gradient.start} />
																)}
															</TouchableOpacity>
														))}
													</ScrollView>
												</View>
											)}
										</View>
									)}

									{/* Specialists Filter Dropdown - Right Side */}
									{availableSpecialists.length > 1 && (
										<View style={{ 
											flex: availableChildren.length > 1 ? 1 : 2,
											position: 'relative' 
										}}>
											<TouchableOpacity
												onPress={() => {
													setShowSpecialistFilter(!showSpecialistFilter);
													setShowChildrenFilter(false);
												}}
												activeOpacity={0.7}
												style={{
													flexDirection: 'row',
													alignItems: 'center',
													backgroundColor: tokens.color.bg.muted,
													paddingHorizontal: tokens.spacing.gap.sm,
													paddingVertical: tokens.spacing.gap.sm,
													borderRadius: tokens.radius.lg,
													borderWidth: 1,
													borderColor: tokens.color.border.default
												}}
											>
												<Text style={{
													fontSize: tokens.font.size.sm,
													color: tokens.color.text.secondary,
													marginRight: 4,
													fontWeight: '400',
													flex: 1
												}}>
													{getSelectedSpecialistsText()}
												</Text>
												<Ionicons 
													name={showSpecialistFilter ? "chevron-up" : "chevron-down"} 
													size={12} 
													color={tokens.color.text.secondary} 
												/>
											</TouchableOpacity>

											{/* Specialist Dropdown */}
											{showSpecialistFilter && (
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
														{availableSpecialists.map((specialist, index) => (
															<TouchableOpacity
																key={specialist}
																onPress={() => toggleSpecialistSelection(specialist)}
																activeOpacity={0.7}
																style={{
																	paddingVertical: tokens.spacing.gap.xs,
																	paddingHorizontal: tokens.spacing.gap.sm,
																	borderBottomWidth: index !== availableSpecialists.length - 1 ? 0.5 : 0,
																	borderBottomColor: 'rgba(0,0,0,0.08)',
																	backgroundColor: selectedSpecialists.includes(specialist) ? tokens.color.bg.muted : 'transparent',
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
								</View>
							)}

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
										blurOnSubmit={false}
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
										marginTop: tokens.spacing.gap.md,
										marginBottom: tokens.spacing.gap.lg,
										flexDirection: 'row',
										alignItems: 'center',
										justifyContent: 'center'
									}}
								>
									<Ionicons name="add-circle" size={20} color={tokens.color.brand.gradient.start} />
									<Text style={{ 
										marginLeft: tokens.spacing.gap.sm,
										fontSize: tokens.font.size.body,
										fontWeight: '600',
										color: tokens.color.brand.gradient.start
									}}>New Reminder</Text>
								</TouchableOpacity>
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
											onPress={() => toggleAppointmentComplete(appointment.id)}
											style={{
												width: 20,
												height: 20,
												borderRadius: 10,
												borderWidth: 2,
												borderColor: appointment.completed ? tokens.color.brand.gradient.start : tokens.color.border.default,
												backgroundColor: appointment.completed ? tokens.color.brand.gradient.start : 'transparent',
												alignItems: 'center',
												justifyContent: 'center'
											}}
										>
											{appointment.completed && (
												<Ionicons name="checkmark" size={12} color="white" />
											)}
										</TouchableOpacity>

										{/* Question Text */}
										<Text style={{
											flex: 1,
											fontSize: tokens.font.size.body,
											color: appointment.completed ? tokens.color.text.secondary : tokens.color.text.primary,
											textDecorationLine: appointment.completed ? 'line-through' : 'none'
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

										{/* Options Menu */}
										<TouchableOpacity 
											onPress={() => setEditingAppointment(appointment.id)}
											style={{ padding: 4 }}
										>
											<Ionicons name="ellipsis-horizontal" size={16} color={tokens.color.text.secondary} />
										</TouchableOpacity>
									</View>

									{/* Completion Notes Preview */}
									{appointment.completed && appointment.completionNotes && (
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
												"{appointment.completionNotes}"
											</Text>
										</View>
									)}
								</View>
							))}

							{/* Empty State */}
							{filteredAppointments.length === 0 && (
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
										{appointmentFilter === 'completed' ? 'No completed reminders' :
										 appointmentFilter === 'open' ? 'No open reminders' : 'No reminders yet'}
									</Text>
									<Text style={{
										fontSize: tokens.font.size.sm,
										color: tokens.color.text.secondary,
										textAlign: 'center',
										marginTop: 4
									}}>
										{appointmentFilter === 'all' ? 'Tap "New Reminder" to get started' : ''}
									</Text>
								</View>
							)}
						</View>
					)}


					{activeTab === 'gestalts' && (
						<View>
							{/* Search Bar */}
							<View style={{
								flexDirection: 'row',
								alignItems: 'center',
								backgroundColor: tokens.color.bg.muted,
								borderRadius: tokens.radius.lg,
								paddingHorizontal: tokens.spacing.gap.sm,
								paddingVertical: tokens.spacing.gap.sm,
								borderWidth: 1,
								borderColor: tokens.color.border.default,
								marginBottom: tokens.spacing.gap.lg
							}}>
								<Ionicons name="search" size={14} color={tokens.color.text.secondary} style={{ marginRight: 8 }} />
								<TextInput
									placeholder="Search gestalts..."
									value={searchQuery}
									onChangeText={setSearchQuery}
									style={{
										flex: 1,
										fontSize: tokens.font.size.xs,
										color: tokens.color.text.primary,
										fontWeight: '400'
									}}
									placeholderTextColor={tokens.color.text.secondary}
								/>
								{searchQuery ? (
									<TouchableOpacity onPress={() => setSearchQuery('')}>
										<Ionicons name="close-circle" size={14} color={tokens.color.text.secondary} />
									</TouchableOpacity>
								) : null}
							</View>

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

							{/* Gestalts */}
							{filterEntries(gestalts, 'phrase').map((gestalt) => (
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
									{gestalt.contexts && (
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
						</View>
					)}
				</View>
				</ScrollView>


			<BottomNavigation />
			</View>
		</LinearGradient>
	);
}