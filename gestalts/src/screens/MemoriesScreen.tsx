import React, { useState } from 'react';
import { ScrollView, TextInput, View, TouchableOpacity } from 'react-native';
import { Text, useTheme } from '../theme';
import { GradientButton } from '../components/GradientButton';
import { useMemoriesStore, JournalEntry } from '../state/useStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import dayjs from 'dayjs';
import { useDrawer } from '../navigation/SimpleDrawer';

type MemoryTab = 'journal' | 'milestones' | 'appointments';

export default function MemoriesScreen() {
	const { tokens } = useTheme();
	const { openDrawer } = useDrawer();
	const { journal, milestones, appointmentNotes, addJournal, addMilestone, addAppointmentNote, profile } = useMemoriesStore();
	const [activeTab, setActiveTab] = useState<MemoryTab>('journal');
	const [journalText, setJournalText] = useState('');
	const [selectedMood, setSelectedMood] = useState<JournalEntry['mood']>(undefined);
	const [milestoneText, setMilestoneText] = useState('');
	const [appointmentText, setAppointmentText] = useState('');
	const [selectedSpecialist, setSelectedSpecialist] = useState('');
	const [searchQuery, setSearchQuery] = useState('');

	const moods = [
		{ key: 'good', label: 'Good Day', icon: '😊', color: '#22C55E' },
		{ key: 'neutral', label: 'Neutral', icon: '😐', color: '#6B7280' },
		{ key: 'tough', label: 'Tough Day', icon: '😔', color: '#EF4444' }
	] as const;

	const tabs = [
		{ key: 'journal', label: 'Journal', icon: 'journal-outline', count: journal.length },
		{ key: 'milestones', label: 'Milestones', icon: 'flag-outline', count: milestones.length },
		{ key: 'appointments', label: 'Appointments', icon: 'calendar-outline', count: appointmentNotes.length }
	] as const;

	const handleAddJournal = () => {
		if (!journalText.trim()) return;
		addJournal(journalText.trim(), selectedMood);
		setJournalText('');
		setSelectedMood(undefined);
	};

	const handleAddMilestone = () => {
		if (!milestoneText.trim()) return;
		addMilestone(milestoneText.trim());
		setMilestoneText('');
	};

	const handleAddAppointment = () => {
		if (!appointmentText.trim()) return;
		addAppointmentNote(appointmentText.trim(), selectedSpecialist || undefined);
		setAppointmentText('');
		setSelectedSpecialist('');
	};

	const filterEntries = (entries: any[], searchField: string) => {
		if (!searchQuery.trim()) return entries;
		return entries.filter(entry => 
			entry[searchField]?.toLowerCase().includes(searchQuery.toLowerCase())
		);
	};


	return (
		<View style={{ flex: 1, backgroundColor: 'white' }}>
			<ScrollView 
				style={{ flex: 1 }}
				contentContainerStyle={{ paddingBottom: 100 }}
				showsVerticalScrollIndicator={false}
			>
				{/* Header Section */}
				<LinearGradient
					colors={[tokens.color.brand.gradient.start, tokens.color.brand.gradient.mid]}
					style={{ paddingTop: 60, paddingBottom: 40, paddingHorizontal: tokens.spacing.containerX }}
				>
					<Text style={{
						fontSize: tokens.font.size.h2,
						fontWeight: '700',
						color: 'white',
						marginBottom: tokens.spacing.gap.xs
					}}>Your Family's Journey</Text>
					<Text style={{
						fontSize: tokens.font.size.body,
						color: 'rgba(255,255,255,0.9)',
						lineHeight: tokens.font.size.body * 1.5
					}}>Track {profile?.childName ? `${profile.childName}'s` : 'your child\'s'} progress, celebrate milestones, and prepare for specialist visits.</Text>
				</LinearGradient>

				{/* Tab Navigation */}
				<View style={{
					backgroundColor: 'white',
					borderTopLeftRadius: 24,
					borderTopRightRadius: 24,
					marginTop: -24,
					paddingTop: 24,
					paddingHorizontal: tokens.spacing.containerX,
					shadowColor: tokens.color.brand.gradient.start,
					shadowOffset: { width: 0, height: -4 },
					shadowOpacity: 0.1,
					shadowRadius: 12,
					elevation: 8
				}}>
					<ScrollView 
						horizontal 
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{ gap: 8, marginBottom: tokens.spacing.gap.lg }}
					>
						{tabs.map((tab) => (
							<TouchableOpacity
								key={tab.key}
								onPress={() => setActiveTab(tab.key)}
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									gap: 8,
									paddingHorizontal: 16,
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
											fontSize: 10,
											fontWeight: '600'
										}}>{tab.count}</Text>
									</View>
								)}
							</TouchableOpacity>
						))}
					</ScrollView>

					{/* Search Bar */}
					<View style={{
						flexDirection: 'row',
						alignItems: 'center',
						backgroundColor: tokens.color.bg.muted,
						borderRadius: tokens.radius.lg,
						paddingHorizontal: 12,
						paddingVertical: 8,
						borderWidth: 1,
						borderColor: tokens.color.border.default,
						marginBottom: tokens.spacing.gap.lg
					}}>
						<Ionicons name="search" size={16} color={tokens.color.text.secondary} style={{ marginRight: 8 }} />
						<TextInput
							placeholder={`Search ${activeTab}...`}
							value={searchQuery}
							onChangeText={setSearchQuery}
							style={{
								flex: 1,
								fontSize: tokens.font.size.small,
								color: tokens.color.text.primary
							}}
							placeholderTextColor={tokens.color.text.secondary}
						/>
						{searchQuery ? (
							<TouchableOpacity onPress={() => setSearchQuery('')}>
								<Ionicons name="close-circle" size={16} color={tokens.color.text.secondary} />
							</TouchableOpacity>
						) : null}
					</View>

					{/* Content based on active tab */}
					{activeTab === 'journal' && (
						<View>
							{/* Journal Input */}
							<View style={{
								backgroundColor: 'rgba(255,255,255,0.8)',
								borderRadius: tokens.radius['2xl'],
								padding: tokens.spacing.gap.lg,
								marginBottom: tokens.spacing.gap.lg,
								borderWidth: 1,
								borderColor: tokens.color.border.default,
								shadowColor: tokens.color.brand.gradient.start,
								shadowOffset: { width: 0, height: 2 },
								shadowOpacity: 0.05,
								shadowRadius: 8,
								elevation: 2
							}}>
								<Text style={{
									fontSize: tokens.font.size.body,
									fontWeight: '600',
									color: tokens.color.text.primary,
									marginBottom: tokens.spacing.gap.sm
								}}>How was today?</Text>
								
								{/* Mood Selector */}
								<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: tokens.spacing.gap.md }}>
									<View style={{ flexDirection: 'row', gap: 8 }}>
										{moods.map((mood) => (
											<TouchableOpacity
												key={mood.key}
												onPress={() => setSelectedMood(selectedMood === mood.key ? undefined : mood.key)}
												style={{
													flexDirection: 'row',
													alignItems: 'center',
													gap: 6,
													paddingHorizontal: 12,
													paddingVertical: 8,
													borderRadius: tokens.radius.pill,
													backgroundColor: selectedMood === mood.key ? mood.color + '15' : tokens.color.bg.muted,
													borderWidth: 1,
													borderColor: selectedMood === mood.key ? mood.color + '50' : tokens.color.border.default
												}}
											>
												<Text style={{ fontSize: 16 }}>{mood.icon}</Text>
												<Text style={{
													fontSize: tokens.font.size.small,
													fontWeight: selectedMood === mood.key ? '600' : '500',
													color: selectedMood === mood.key ? mood.color : tokens.color.text.secondary
												}}>{mood.label}</Text>
											</TouchableOpacity>
										))}
									</View>
								</ScrollView>

								<TextInput
									value={journalText}
									onChangeText={setJournalText}
									placeholder="Share your thoughts about today..."
									multiline
									style={{
										backgroundColor: tokens.color.bg.muted,
										borderRadius: tokens.radius.lg,
										padding: 12,
										minHeight: 80,
										textAlignVertical: 'top',
										fontSize: tokens.font.size.body,
										color: tokens.color.text.primary,
										borderWidth: 1,
										borderColor: tokens.color.border.default,
										marginBottom: tokens.spacing.gap.md
									}}
									placeholderTextColor={tokens.color.text.secondary}
								/>
								
								<GradientButton 
									title="Add Journal Entry" 
									onPress={handleAddJournal}
									disabled={!journalText.trim()}
								/>
							</View>

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
							{/* Milestone Input */}
							<View style={{
								backgroundColor: 'rgba(255,255,255,0.8)',
								borderRadius: tokens.radius['2xl'],
								padding: tokens.spacing.gap.lg,
								marginBottom: tokens.spacing.gap.lg,
								borderWidth: 1,
								borderColor: tokens.color.border.default,
								shadowColor: tokens.color.brand.gradient.start,
								shadowOffset: { width: 0, height: 2 },
								shadowOpacity: 0.05,
								shadowRadius: 8,
								elevation: 2
							}}>
								<Text style={{
									fontSize: tokens.font.size.body,
									fontWeight: '600',
									color: tokens.color.text.primary,
									marginBottom: tokens.spacing.gap.sm
								}}>🎉 Celebrate a milestone</Text>
								
								<TextInput
									value={milestoneText}
									onChangeText={setMilestoneText}
									placeholder="E.g., First two-word sentence, Started waving goodbye"
									style={{
										backgroundColor: tokens.color.bg.muted,
										borderRadius: tokens.radius.lg,
										padding: 12,
										fontSize: tokens.font.size.body,
										color: tokens.color.text.primary,
										borderWidth: 1,
										borderColor: tokens.color.border.default,
										marginBottom: tokens.spacing.gap.md
									}}
									placeholderTextColor={tokens.color.text.secondary}
								/>
								
								<GradientButton 
									title="Add Milestone" 
									onPress={handleAddMilestone}
									disabled={!milestoneText.trim()}
								/>
							</View>

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
							{/* Appointment Note Input */}
							<View style={{
								backgroundColor: 'rgba(255,255,255,0.8)',
								borderRadius: tokens.radius['2xl'],
								padding: tokens.spacing.gap.lg,
								marginBottom: tokens.spacing.gap.lg,
								borderWidth: 1,
								borderColor: tokens.color.border.default,
								shadowColor: tokens.color.brand.gradient.start,
								shadowOffset: { width: 0, height: 2 },
								shadowOpacity: 0.05,
								shadowRadius: 8,
								elevation: 2
							}}>
								<Text style={{
									fontSize: tokens.font.size.body,
									fontWeight: '600',
									color: tokens.color.text.primary,
									marginBottom: tokens.spacing.gap.sm
								}}>📋 Specialist Questions</Text>
								
								{/* Specialist Input */}
								<TextInput
									value={selectedSpecialist}
									onChangeText={setSelectedSpecialist}
									placeholder="Specialist name (optional)"
									style={{
										backgroundColor: tokens.color.bg.muted,
										borderRadius: tokens.radius.lg,
										padding: 12,
										fontSize: tokens.font.size.body,
										color: tokens.color.text.primary,
										borderWidth: 1,
										borderColor: tokens.color.border.default,
										marginBottom: tokens.spacing.gap.sm
									}}
									placeholderTextColor={tokens.color.text.secondary}
								/>

								<TextInput
									value={appointmentText}
									onChangeText={setAppointmentText}
									placeholder="What would you like to ask or discuss?"
									multiline
									style={{
										backgroundColor: tokens.color.bg.muted,
										borderRadius: tokens.radius.lg,
										padding: 12,
										minHeight: 80,
										textAlignVertical: 'top',
										fontSize: tokens.font.size.body,
										color: tokens.color.text.primary,
										borderWidth: 1,
										borderColor: tokens.color.border.default,
										marginBottom: tokens.spacing.gap.md
									}}
									placeholderTextColor={tokens.color.text.secondary}
								/>
								
								<GradientButton 
									title="Add Question" 
									onPress={handleAddAppointment}
									disabled={!appointmentText.trim()}
								/>
							</View>

							{/* Appointment Notes */}
							{filterEntries(appointmentNotes, 'question').map((note) => (
								<View key={note.id} style={{
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
											<Ionicons name="calendar-outline" size={16} color={tokens.color.support.teal} />
											<Text style={{
												fontSize: tokens.font.size.small,
												color: tokens.color.text.secondary,
												fontWeight: '500'
											}}>{dayjs(note.createdAtISO).format('MMM DD, YYYY')}</Text>
										</View>
										{note.specialist && (
											<View style={{
												paddingHorizontal: 8,
												paddingVertical: 4,
												borderRadius: 12,
												backgroundColor: tokens.color.support.teal + '15'
											}}>
												<Text style={{
													fontSize: 10,
													fontWeight: '600',
													color: tokens.color.support.teal
												}}>{note.specialist}</Text>
											</View>
										)}
									</View>
									<Text style={{
										fontSize: tokens.font.size.body,
										color: tokens.color.text.primary,
										lineHeight: tokens.font.size.body * 1.5
									}}>{note.question}</Text>
								</View>
							))}
						</View>
					)}
				</View>
			</ScrollView>

			{/* Center Microphone Button - Same as DashboardScreen */}
			<TouchableOpacity style={{ 
				position: 'absolute',
				bottom: 35,
				left: '50%',
				marginLeft: -28,
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

			{/* Bottom Navigation - Same as DashboardScreen */}
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
				paddingBottom: tokens.spacing.gap.sm + 10,
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
					
					{/* View Memories Button - Highlighted since we're on memories screen */}
					<TouchableOpacity style={{ alignItems: 'center', width: 60 }}>
						<Ionicons name="book" size={22} color={tokens.color.brand.gradient.start} />
						<Text style={{ 
							fontSize: 10, 
							color: tokens.color.brand.gradient.start, 
							marginTop: 3,
							fontWeight: '600'
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
		</View>
	);
}