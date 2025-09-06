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
import { BottomNavigation } from '../navigation/BottomNavigation';

export default function AddMilestoneScreen() {
	const { tokens } = useTheme();
	const navigation = useNavigation();
	const { currentProfile } = useMemoriesStore((s) => ({ currentProfile: s.currentProfile }));
	const { addMilestone } = useFirebaseMemoriesStore();
	
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [category, setCategory] = useState<string>('');
	
	// Date selection state
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());
	
	// Child selection state
	const [selectedChild, setSelectedChild] = useState<string>('');
	const [showChildrenDropdown, setShowChildrenDropdown] = useState(false);
	
	// Get available children from current profile
	const availableChildren = currentProfile ? [currentProfile.childName] : [];

	const milestoneCategories = [
		{ name: 'First Words', icon: 'chatbubble', color: '#7C3AED' },
		{ name: 'Communication', icon: 'people', color: '#7C3AED' },
		{ name: 'Social Skills', icon: 'heart', color: '#7C3AED' },
		{ name: 'Stage Progress', icon: 'trophy', color: '#7C3AED' },
		{ name: 'Independence', icon: 'person', color: '#7C3AED' },
		{ name: 'Learning', icon: 'school', color: '#7C3AED' }
	];

	const milestoneExamples = [
		'First spontaneous phrase',
		'Used a gestalt in new context',
		'Asked for help independently',
		'Started combining gestalts',
		'Showed understanding of emotions',
		'Initiated conversation'
	];

	const handleSave = async () => {
		if (!title.trim()) return;
		
		// Check authentication
		const auth = getAuth();
		const currentUser = auth.currentUser;
		if (!currentUser) {
			alert('Please sign in to save milestones');
			return;
		}
		
		try {
			// Save to Firebase
			await addMilestone(
				title.trim(),
				selectedDate.toISOString(),
				description.trim() || undefined,
				selectedChild || undefined,
				currentProfile?.id
			);
			navigation.goBack();
		} catch (error) {
			console.error('Failed to save milestone:', error);
			alert('Failed to save milestone. Please try again.');
		}
	};

	// Initialize selected child when component mounts
	React.useEffect(() => {
		if (availableChildren.length > 0 && !selectedChild) {
			setSelectedChild(availableChildren[0]);
		}
	}, [availableChildren.length, selectedChild]);

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

	// Child selection helper functions
	const toggleChildSelection = (child: string) => {
		setSelectedChild(child);
		setShowChildrenDropdown(false);
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
							Add Milestone
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
					contentContainerStyle={{ padding: tokens.spacing.containerX, paddingBottom: 150 }}
					onScrollBeginDrag={() => {
						setShowDatePicker(false);
						setShowChildrenDropdown(false);
					}}
				>
				{/* Milestone Category */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						Milestone Category
					</Text>
					<View style={{ 
						flexDirection: 'row',
						flexWrap: 'wrap',
						marginHorizontal: -tokens.spacing.gap.xs
					}}>
						{milestoneCategories.map((cat) => (
							<TouchableOpacity
								key={cat.name}
								onPress={() => setCategory(cat.name)}
								style={{
									width: '50%',
									padding: tokens.spacing.gap.xs
								}}
							>
								<View style={{
									backgroundColor: category === cat.name ? cat.color + '20' : tokens.color.surface,
									borderColor: category === cat.name ? cat.color : tokens.color.border.default,
									borderWidth: category === cat.name ? 2 : 1,
									borderRadius: tokens.radius.lg,
									padding: tokens.spacing.gap.md,
									alignItems: 'center',
									minHeight: 80
								}}>
									<Ionicons 
										name={cat.icon as any} 
										size={24} 
										color={category === cat.name ? cat.color : tokens.color.text.secondary} 
									/>
									<Text style={{ 
										marginTop: tokens.spacing.gap.xs,
										fontSize: tokens.font.size.sm,
										textAlign: 'center',
										color: category === cat.name ? cat.color : tokens.color.text.primary,
										fontWeight: category === cat.name ? '600' : '400'
									}}>
										{cat.name}
									</Text>
								</View>
							</TouchableOpacity>
						))}
					</View>
				</View>

				{/* Child Selection - Only show if there are multiple children */}
				{availableChildren.length > 1 && (
					<View style={{ marginBottom: tokens.spacing.gap.lg, position: 'relative' }}>
						<Text weight="medium" style={{ 
							fontSize: tokens.font.size.sm,
							color: tokens.color.text.secondary,
							marginBottom: tokens.spacing.gap.sm 
						}}>
							Child
						</Text>
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
								zIndex: 9999,
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

				{/* Milestone Title */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						What did they achieve?
					</Text>
					<TextInput
						placeholder="e.g., Said first spontaneous phrase"
						value={title}
						onChangeText={setTitle}
						style={{
							borderColor: tokens.color.border.default,
							borderWidth: 1,
							borderRadius: tokens.radius.lg,
							padding: tokens.spacing.gap.md,
							fontSize: tokens.font.size.body
						}}
					/>
				</View>

				{/* Quick Examples */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						Common Milestones (tap to use)
					</Text>
					<ScrollView horizontal showsHorizontalScrollIndicator={false}>
						{milestoneExamples.map((example, index) => (
							<TouchableOpacity
								key={index}
								onPress={() => setTitle(example)}
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
									{example}
								</Text>
							</TouchableOpacity>
						))}
					</ScrollView>
				</View>

				{/* Description */}
				<View style={{ marginBottom: tokens.spacing.gap.lg }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						Details (optional)
					</Text>
					<TextInput
						placeholder="Tell us more about this milestone. What happened? How did it make you feel?"
						value={description}
						onChangeText={setDescription}
						style={{
							borderColor: tokens.color.border.default,
							borderWidth: 1,
							borderRadius: tokens.radius.lg,
							padding: tokens.spacing.gap.md,
							minHeight: 100,
							textAlignVertical: 'top',
							fontSize: tokens.font.size.body
						}}
						multiline
					/>
				</View>

				{/* Date */}
				<View style={{ marginBottom: tokens.spacing.gap.lg, position: 'relative' }}>
					<Text weight="medium" style={{ 
						fontSize: tokens.font.size.sm,
						color: tokens.color.text.secondary,
						marginBottom: tokens.spacing.gap.sm 
					}}>
						When did this happen?
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
							zIndex: 9999,
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

				{/* Photo Attachment */}
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
					title="Save Milestone" 
					onPress={handleSave}
				/>
				</ScrollView>
			</View>



			<BottomNavigation />
		</LinearGradient>
	);
}