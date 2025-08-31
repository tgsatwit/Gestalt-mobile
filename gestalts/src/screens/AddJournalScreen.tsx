import React, { useState } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '../components/GradientButton';
import { useMemoriesStore } from '../state/useStore';
import { useFirebaseMemoriesStore } from '../state/useFirebaseMemoriesStore';
import { getAuth } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { BottomNavigation } from '../components/BottomNavigation';

export default function AddJournalScreen() {
	const { tokens } = useTheme();
	const navigation = useNavigation();
	const { currentProfile } = useMemoriesStore((s) => ({ currentProfile: s.currentProfile }));
	const { addJournalEntry } = useFirebaseMemoriesStore();
	
	const [entry, setEntry] = useState('');
	const [mood, setMood] = useState<'good' | 'neutral' | 'tough' | null>(null);
	const [tags, setTags] = useState<string[]>([]);
	const [newTag, setNewTag] = useState('');
	
	// Journal type and child selection state
	const [journalType, setJournalType] = useState<'personal' | 'child'>('child');
	const [selectedChild, setSelectedChild] = useState<string>('');
	const [showChildrenDropdown, setShowChildrenDropdown] = useState(false);
	
	// Date selection state
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
	
	// Get available children from current profile
	const availableChildren = currentProfile ? [currentProfile.name] : [];

	const moods = [
		{ type: 'good' as const, icon: 'happy', color: '#10B981', label: 'Good Day' },
		{ type: 'neutral' as const, icon: 'remove-circle', color: '#F59E0B', label: 'Neutral' },
		{ type: 'tough' as const, icon: 'sad', color: '#EF4444', label: 'Tough Day' }
	];

	const suggestedTags = [
		'milestone', 'breakthrough', 'challenge', 'progress', 
		'communication', 'play', 'social', 'sensory', 'school'
	];

	const handleSave = async () => {
		if (!entry.trim()) return;
		
		// Check authentication
		const auth = getAuth();
		const currentUser = auth.currentUser;
		if (!currentUser) {
			alert('Please sign in to save journal entries');
			return;
		}
		
		const childName = journalType === 'child' ? selectedChild : undefined;
		const childProfileId = journalType === 'child' && currentProfile ? currentProfile.id : undefined;
		
		try {
			// Save to Firebase
			await addJournalEntry(
				entry,
				mood || undefined,
				journalType,
				childName,
				childProfileId,
				selectedDate.toISOString()
			);
			navigation.goBack();
		} catch (error) {
			console.error('Failed to save journal entry:', error);
			alert('Failed to save journal entry. Please try again.');
		}
	};

	// Calendar helper functions
	const getDaysInMonth = (date: Date) => {
		return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
	};

	const getFirstDayOfMonth = (date: Date) => {
		return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
	};

	const generateCalendarDays = () => {
		const daysInMonth = getDaysInMonth(currentCalendarMonth);
		const firstDay = getFirstDayOfMonth(currentCalendarMonth);
		const days = [];

		// Add empty cells for days before the first day of the month
		for (let i = 0; i < firstDay; i++) {
			days.push(null);
		}

		// Add all days of the month
		for (let day = 1; day <= daysInMonth; day++) {
			days.push(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), day));
		}

		return days;
	};

	const navigateMonth = (direction: 'prev' | 'next') => {
		const newMonth = new Date(currentCalendarMonth);
		if (direction === 'prev') {
			newMonth.setMonth(newMonth.getMonth() - 1);
		} else {
			newMonth.setMonth(newMonth.getMonth() + 1);
		}
		setCurrentCalendarMonth(newMonth);
	};

	const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	
	// Initialize selected child when switching to child type or when component mounts
	React.useEffect(() => {
		if (journalType === 'child' && availableChildren.length > 0 && !selectedChild) {
			setSelectedChild(availableChildren[0]);
		}
	}, [journalType, availableChildren.length, selectedChild]);

	const addTag = (tag: string) => {
		if (!tags.includes(tag)) {
			setTags([...tags, tag]);
		}
	};

	const removeTag = (tag: string) => {
		setTags(tags.filter(t => t !== tag));
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
					{/* Left Side: Back Arrow + Title */}
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.gap.md, flex: 1 }}>
						<TouchableOpacity onPress={() => navigation.goBack()}>
							<Ionicons name="arrow-back" size={24} color="white" />
						</TouchableOpacity>
						<Text style={{ color: 'white', fontSize: tokens.font.size.h3, fontWeight: '600' }}>
							Add Journal Entry
						</Text>
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
					onScrollBeginDrag={() => setShowDatePicker(false)}
				>
				{/* Date */}
				<View style={{ marginBottom: tokens.spacing.gap.lg, position: 'relative' }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.xs 
					}}>
						Date
					</Text>
					<TouchableOpacity
						onPress={() => setShowDatePicker(!showDatePicker)}
						style={{
							backgroundColor: tokens.color.surface,
							borderRadius: tokens.radius.lg,
							padding: tokens.spacing.gap.md,
							flexDirection: 'row',
							alignItems: 'center',
							borderWidth: 1,
							borderColor: showDatePicker ? tokens.color.brand.gradient.start + '30' : tokens.color.border.default
						}}
					>
						<Ionicons name="calendar" size={20} color={tokens.color.text.secondary} />
						<Text style={{ marginLeft: tokens.spacing.gap.sm, flex: 1 }}>
							{selectedDate.toLocaleDateString('en-US', { 
								weekday: 'long', 
								year: 'numeric', 
								month: 'long', 
								day: 'numeric' 
							})}
						</Text>
						<Ionicons 
							name={showDatePicker ? "chevron-up" : "chevron-down"} 
							size={16} 
							color={tokens.color.text.secondary} 
						/>
					</TouchableOpacity>

					{/* Calendar Picker Dropdown */}
					{showDatePicker && (
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
							padding: tokens.spacing.gap.md
						}}>
							{/* Calendar Header */}
							<View style={{
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'space-between',
								marginBottom: tokens.spacing.gap.md
							}}>
								<TouchableOpacity
									onPress={() => navigateMonth('prev')}
									style={{
										padding: tokens.spacing.gap.xs,
										borderRadius: tokens.radius.lg / 2
									}}
								>
									<Ionicons name="chevron-back" size={20} color={tokens.color.text.primary} />
								</TouchableOpacity>
								
								<Text style={{
									fontSize: tokens.font.size.body,
									fontWeight: '600',
									color: tokens.color.text.primary
								}}>
									{currentCalendarMonth.toLocaleDateString('en-US', { 
										month: 'long', 
										year: 'numeric' 
									})}
								</Text>
								
								<TouchableOpacity
									onPress={() => navigateMonth('next')}
									style={{
										padding: tokens.spacing.gap.xs,
										borderRadius: tokens.radius.lg / 2
									}}
								>
									<Ionicons name="chevron-forward" size={20} color={tokens.color.text.primary} />
								</TouchableOpacity>
							</View>

							{/* Day Names Header */}
							<View style={{
								flexDirection: 'row',
								marginBottom: tokens.spacing.gap.xs
							}}>
								{dayNames.map((dayName) => (
									<View key={dayName} style={{ flex: 1, alignItems: 'center' }}>
										<Text style={{
											fontSize: tokens.font.size.xs,
											fontWeight: '600',
											color: tokens.color.text.secondary
										}}>
											{dayName}
										</Text>
									</View>
								))}
							</View>

							{/* Calendar Grid */}
							<View style={{
								flexDirection: 'row',
								flexWrap: 'wrap'
							}}>
								{generateCalendarDays().map((date, index) => {
									if (!date) {
										// Empty cell for days before the first day of the month
										return <View key={`empty-${index}`} style={{ width: '14.28%', height: 40 }} />;
									}

									const isSelected = date.toDateString() === selectedDate.toDateString();
									const isToday = date.toDateString() === new Date().toDateString();
									const isPastMonth = date.getMonth() !== currentCalendarMonth.getMonth();

									return (
										<TouchableOpacity
											key={date.toISOString()}
											onPress={() => {
												setSelectedDate(date);
												setShowDatePicker(false);
											}}
											style={{
												width: '14.28%',
												height: 40,
												alignItems: 'center',
												justifyContent: 'center',
												borderRadius: tokens.radius.lg / 2,
												backgroundColor: isSelected ? tokens.color.brand.gradient.start : 'transparent',
												marginBottom: 2
											}}
										>
											<Text style={{
												fontSize: tokens.font.size.sm,
												fontWeight: isSelected ? '600' : '400',
												color: isSelected ? 'white' : 
													   isToday ? tokens.color.brand.gradient.start :
													   isPastMonth ? tokens.color.text.secondary + '60' :
													   tokens.color.text.primary
											}}>
												{date.getDate()}
											</Text>
											{isToday && !isSelected && (
												<View style={{
													position: 'absolute',
													bottom: 4,
													width: 4,
													height: 4,
													borderRadius: 2,
													backgroundColor: tokens.color.brand.gradient.start
												}} />
											)}
										</TouchableOpacity>
									);
								})}
							</View>
						</View>
					)}
				</View>

				{/* Journal Type Selection */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						Journal Type
					</Text>
					
					{/* Journal Type Filter Tabs */}
					<View style={{ 
						flexDirection: 'row', 
						marginBottom: tokens.spacing.gap.sm,
						backgroundColor: tokens.color.bg.muted,
						borderRadius: tokens.radius.lg,
						borderWidth: 1,
						borderColor: tokens.color.border.default,
						padding: 4
					}}>
						{/* Child Tab (Left) */}
						<TouchableOpacity
							onPress={() => setJournalType('child')}
							style={{
								flex: 1,
								paddingVertical: tokens.spacing.gap.sm,
								paddingHorizontal: tokens.spacing.gap.sm,
								borderRadius: tokens.radius.lg - 4,
								backgroundColor: journalType === 'child' ? 'white' : 'transparent',
								alignItems: 'center'
							}}
						>
							<Text style={{
								fontSize: tokens.font.size.sm,
								fontWeight: '400',
								color: journalType === 'child' ? tokens.color.text.primary : tokens.color.text.secondary
							}}>
								{availableChildren.length === 1 ? availableChildren[0] : 'Child'}
							</Text>
						</TouchableOpacity>
						
						{/* Personal Tab (Right) */}
						<TouchableOpacity
							onPress={() => setJournalType('personal')}
							style={{
								flex: 1,
								paddingVertical: tokens.spacing.gap.sm,
								paddingHorizontal: tokens.spacing.gap.sm,
								borderRadius: tokens.radius.lg - 4,
								backgroundColor: journalType === 'personal' ? 'white' : 'transparent',
								alignItems: 'center'
							}}
						>
							<Text style={{
								fontSize: tokens.font.size.sm,
								fontWeight: '400',
								color: journalType === 'personal' ? tokens.color.text.primary : tokens.color.text.secondary
							}}>
								Personal
							</Text>
						</TouchableOpacity>
					</View>

					{/* Child Selection Dropdown - Only show if there are multiple children */}
					{availableChildren.length > 1 && journalType === 'child' && (
						<View style={{ position: 'relative' }}>
							<TouchableOpacity
								onPress={() => setShowChildrenDropdown(!showChildrenDropdown)}
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
									{selectedChild || 'Select Child'}
								</Text>
								<Ionicons 
									name={showChildrenDropdown ? "chevron-up" : "chevron-down"} 
									size={12} 
									color={tokens.color.text.secondary} 
								/>
							</TouchableOpacity>

							{/* Children Dropdown */}
							{showChildrenDropdown && (
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
												onPress={() => {
													setSelectedChild(child);
													setShowChildrenDropdown(false);
												}}
												activeOpacity={0.7}
												style={{
													paddingVertical: tokens.spacing.gap.xs,
													paddingHorizontal: tokens.spacing.gap.sm,
													borderBottomWidth: index !== availableChildren.length - 1 ? 0.5 : 0,
													borderBottomColor: 'rgba(0,0,0,0.08)',
													backgroundColor: selectedChild === child ? tokens.color.bg.muted : 'transparent',
													flexDirection: 'row',
													alignItems: 'center',
													justifyContent: 'space-between'
												}}
											>
												<Text style={{
													fontSize: tokens.font.size.sm,
													color: selectedChild === child ? tokens.color.brand.gradient.start : tokens.color.text.secondary,
													fontWeight: '400'
												}}>
													{child}
												</Text>
												{selectedChild === child && (
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

				{/* Mood Selection */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						How was today?
					</Text>
					<View style={{ 
						flexDirection: 'row',
						justifyContent: 'space-around'
					}}>
						{moods.map((m) => (
							<TouchableOpacity
								key={m.type}
								onPress={() => setMood(m.type)}
								style={{
									alignItems: 'center',
									padding: tokens.spacing.gap.md,
									borderRadius: tokens.radius.lg,
									backgroundColor: mood === m.type ? m.color + '20' : tokens.color.surface,
									borderWidth: mood === m.type ? 2 : 1,
									borderColor: mood === m.type ? m.color : tokens.color.border.default,
									flex: 1,
									marginHorizontal: tokens.spacing.gap.xs
								}}
							>
								<Ionicons 
									name={m.icon as any} 
									size={32} 
									color={mood === m.type ? m.color : tokens.color.text.secondary} 
								/>
								<Text style={{ 
									marginTop: tokens.spacing.gap.xs,
									color: mood === m.type ? m.color : tokens.color.text.secondary,
									fontWeight: mood === m.type ? '600' : '400'
								}}>
									{m.label}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* Journal Entry */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						Today's Observations
					</Text>
					<TextInput
						placeholder="What happened today? Any progress, challenges, or special moments?"
						value={entry}
						onChangeText={setEntry}
						style={{
							borderColor: tokens.color.border.default,
							borderWidth: 1,
							borderRadius: tokens.radius.lg,
							padding: tokens.spacing.gap.md,
							minHeight: 150,
							textAlignVertical: 'top',
							fontSize: tokens.font.size.body
						}}
						multiline
					/>
					<Text style={{ 
						fontSize: tokens.font.size.xs,
						color: tokens.color.text.secondary,
						marginTop: tokens.spacing.gap.xs,
						textAlign: 'right'
					}}>
						{entry.length} characters
					</Text>
				</View>

				{/* Tags */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						Tags
					</Text>
					
					{/* Selected Tags */}
					{tags.length > 0 && (
						<View style={{ 
							flexDirection: 'row',
							flexWrap: 'wrap',
							marginBottom: tokens.spacing.gap.sm
						}}>
							{tags.map((tag) => (
								<TouchableOpacity
									key={tag}
									onPress={() => removeTag(tag)}
									style={{
										backgroundColor: tokens.color.brand.gradient.start + '15',
										borderColor: tokens.color.brand.gradient.start + '30',
										borderWidth: 1,
										borderRadius: tokens.radius.pill,
										paddingHorizontal: 12,
										paddingVertical: 8,
										marginRight: tokens.spacing.gap.xs,
										marginBottom: tokens.spacing.gap.xs,
										flexDirection: 'row',
										alignItems: 'center'
									}}
								>
									<Text style={{ 
										color: tokens.color.brand.gradient.start,
										fontSize: tokens.font.size.small,
										fontWeight: '500'
									}}>
										{tag}
									</Text>
									<Ionicons 
										name="close" 
										size={14} 
										color={tokens.color.brand.gradient.start}
										style={{ marginLeft: 6 }}
									/>
								</TouchableOpacity>
							))}
						</View>
					)}

					{/* Suggested Tags */}
					<ScrollView horizontal showsHorizontalScrollIndicator={false}>
						{suggestedTags.filter(t => !tags.includes(t)).map((tag) => (
							<TouchableOpacity
								key={tag}
								onPress={() => addTag(tag)}
								style={{
									backgroundColor: tokens.color.bg.muted,
									borderColor: tokens.color.border.default,
									borderWidth: 1,
									borderRadius: tokens.radius.pill,
									paddingHorizontal: 12,
									paddingVertical: 8,
									marginRight: tokens.spacing.gap.xs
								}}
							>
								<Text style={{ 
									color: tokens.color.text.secondary,
									fontSize: tokens.font.size.small,
									fontWeight: '500'
								}}>
									+ {tag}
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>

				{/* Attachments */}
				<TouchableOpacity style={{
					backgroundColor: tokens.color.surface,
					borderRadius: tokens.radius.lg,
					padding: tokens.spacing.gap.lg,
					alignItems: 'center',
					marginBottom: tokens.spacing.gap.lg,
					borderWidth: 1,
					borderColor: tokens.color.border.default,
					borderStyle: 'dashed'
				}}>
					<Ionicons name="camera-outline" size={32} color={tokens.color.text.secondary} />
					<Text color="secondary" style={{ 
						marginTop: tokens.spacing.gap.sm,
						fontSize: tokens.font.size.sm 
					}}>
						Add photos or videos
					</Text>
				</TouchableOpacity>

				{/* Save Button */}
				<GradientButton 
					title="Save Entry" 
					onPress={handleSave}
				/>
				</ScrollView>
			</View>



			<BottomNavigation />
		</LinearGradient>
	);
}