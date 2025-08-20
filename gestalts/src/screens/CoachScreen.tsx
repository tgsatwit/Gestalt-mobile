import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, Animated } from 'react-native';
import { Text, useTheme } from '../theme';
import { useMemoriesStore } from '../state/useStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDrawer } from '../navigation/SimpleDrawer';
import { useRoute, RouteProp } from '@react-navigation/native';
import type { MainStackParamList } from '../navigation/MainNavigator';
import Constants from 'expo-constants';
import { 
  ElevenLabsConversationalAI, 
  ConversationMessage, 
  AGENT_CONFIGS, 
  AgentConfig 
} from '../services/elevenLabsService';

const MODES = ['Language Coach', 'Parent Support', 'Child Mode'] as const;
type Mode = typeof MODES[number];

type CoachScreenRouteProp = RouteProp<MainStackParamList, 'Coach'>;

export default function CoachScreen() {
	const { tokens } = useTheme();
	const { openDrawer } = useDrawer();
	const route = useRoute<CoachScreenRouteProp>();
	const addJournal = useMemoriesStore((s) => s.addJournal);
	const addAppointmentNote = useMemoriesStore((s) => s.addAppointmentNote);
	const profile = useMemoriesStore((s) => s.profile);
	
	// State management
	const [mode, setMode] = useState<Mode>('Language Coach');
	const [input, setInput] = useState('');
	const [isVoiceMode, setIsVoiceMode] = useState(true); // Default to voice mode
	const [isConnecting, setIsConnecting] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	const [conversation, setConversation] = useState<ConversationMessage[]>([]);
	const [streamingContent, setStreamingContent] = useState('');
	const [isStreamingActive, setIsStreamingActive] = useState(false);
	const [showModeSelector, setShowModeSelector] = useState(false);
	const [hasUserInteracted, setHasUserInteracted] = useState(false);
	const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
	const [showConversationHistory, setShowConversationHistory] = useState(false);
	const [conversationHistory, setConversationHistory] = useState<Array<{
		id: string;
		title: string;
		mode: Mode;
		messages: ConversationMessage[];
		lastUpdated: string;
	}>>([]);
	const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
	
	// Refs
	const scrollViewRef = useRef<ScrollView>(null);
	const aiServiceRef = useRef<ElevenLabsConversationalAI | null>(null);
	const historySlideAnim = useRef(new Animated.Value(300)).current; // Start off-screen
	const historyOverlayOpacity = useRef(new Animated.Value(0)).current;
	
	// Audio wave animation refs
	const waveAnimations = useRef([
		new Animated.Value(0.2),
		new Animated.Value(0.4),
		new Animated.Value(0.3),
		new Animated.Value(0.5),
		new Animated.Value(0.2),
		new Animated.Value(0.6),
		new Animated.Value(0.3),
		new Animated.Value(0.4),
	]).current;

	// Set initial mode from navigation params
	useEffect(() => {
		if (route.params?.initialMode) {
			setMode(route.params.initialMode);
		}
	}, [route.params]);

	// Initialize AI service when mode changes
	useEffect(() => {
		initializeAIService();
		return () => {
			// Cleanup on unmount or mode change
			aiServiceRef.current?.cleanup();
		};
	}, [mode]);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		scrollViewRef.current?.scrollToEnd({ animated: true });
	}, [conversation, streamingContent]);


	const initializeAIService = async () => {
		setIsConnecting(true);
		
		try {
			// Get API key from environment variables
			const API_KEY = Constants.expoConfig?.extra?.elevenLabsApiKey || 'your-api-key-here';
			
			const agentConfig = AGENT_CONFIGS[mode];
			
			const config = {
				apiKey: API_KEY,
				agentId: agentConfig.agentId
			};

			aiServiceRef.current = new ElevenLabsConversationalAI(config);
			
			// Set up callbacks
			aiServiceRef.current.setOnMessageCallback((message) => {
				setConversation(prev => [...prev, message]);
			});

			aiServiceRef.current.setOnStreamingCallback((content, isComplete) => {
				if (isComplete) {
					setStreamingContent('');
					setIsStreamingActive(false);
				} else {
					setStreamingContent(content);
					setIsStreamingActive(true);
				}
			});

			await aiServiceRef.current.initializeConnection();
			
			// Send initial greeting
			const greeting = getModeConfig(mode).greeting;
			const greetingMessage: ConversationMessage = {
				id: Date.now().toString(),
				role: 'agent',
				content: greeting,
				timestamp: new Date().toISOString()
			};
			setConversation([greetingMessage]);
			
		} catch (error) {
			console.error('Error initializing AI service:', error);
			Alert.alert('Connection Error', 'Unable to connect to AI coach. Please check your connection and try again.');
		} finally {
			setIsConnecting(false);
		}
	};

	const getModeConfig = (selectedMode: Mode) => {
		switch (selectedMode) {
			case 'Language Coach':
				return {
					greeting: `Hello! I'm your Language Coach. I'm here to help you support ${profile?.childName ? `${profile.childName}'s` : 'your child\'s'} language development. What would you like to explore today?`,
					placeholder: 'Ask me anything...',
				};
			case 'Parent Support':
				return {
					greeting: 'Hi there. I\'m here to listen and support you through this journey. How are you feeling today?',
					placeholder: 'Ask me anything...',
				};
			case 'Child Mode':
				return {
					greeting: `Hello! I\'m excited to chat with ${profile?.childName || 'you'} today. What would you like to talk about or play?`,
					placeholder: 'Ask me anything...',
				};
		}
	};

	const handleSendMessage = async () => {
		if (!input.trim() || !aiServiceRef.current) return;

		// Mark as interacted to hide suggested prompts
		setHasUserInteracted(true);

		try {
			if (isVoiceMode) {
				// Voice mode - this would typically be handled by voice recording
				await aiServiceRef.current.sendTextMessage(input.trim());
			} else {
				// Text mode
				await aiServiceRef.current.sendTextMessage(input.trim());
			}
			
			setInput('');
		} catch (error) {
			console.error('Error sending message:', error);
			Alert.alert('Error', 'Failed to send message. Please try again.');
		}
	};


	// Audio wave animation functions
	const startWaveAnimation = () => {
		const animations = waveAnimations.map((anim, index) => 
			Animated.loop(
				Animated.sequence([
					Animated.timing(anim, {
						toValue: Math.random() * 0.8 + 0.2,
						duration: 300 + Math.random() * 200,
						useNativeDriver: false,
					}),
					Animated.timing(anim, {
						toValue: Math.random() * 0.8 + 0.2,
						duration: 300 + Math.random() * 200,
						useNativeDriver: false,
					}),
				])
			)
		);
		
		animations.forEach(anim => anim.start());
		return animations;
	};

	const stopWaveAnimation = () => {
		waveAnimations.forEach(anim => anim.stopAnimation());
		// Reset to baseline values
		waveAnimations.forEach((anim, index) => {
			anim.setValue([0.2, 0.4, 0.3, 0.5, 0.2, 0.6, 0.3, 0.4][index]);
		});
	};

	const handleVoiceRecording = async () => {
		if (!aiServiceRef.current) return;

		if (isRecording) {
			// Stop recording
			try {
				stopWaveAnimation();
				await aiServiceRef.current.stopVoiceRecording();
				setIsRecording(false);
				// Mark as interacted when voice recording completes
				setHasUserInteracted(true);
			} catch (error) {
				console.error('Error stopping recording:', error);
				Alert.alert('Recording Error', 'Failed to stop recording. Please try again.');
			}
		} else {
			try {
				await aiServiceRef.current.startVoiceRecording();
				setIsRecording(true);
				startWaveAnimation();
			} catch (error) {
				console.error('Error starting recording:', error);
				Alert.alert('Recording Error', 'Failed to start recording. Please check microphone permissions.');
			}
		}
	};


	const handleModeChange = (newMode: Mode) => {
		setMode(newMode);
		setShowModeSelector(false);
		// Clear conversation when switching modes
		setConversation([]);
		setStreamingContent('');
		setIsStreamingActive(false);
		// Reset interaction state when switching modes
		setHasUserInteracted(false);
	};

	const getSuggestedPrompts = (currentMode: Mode) => {
		const prompts = {
			'Language Coach': [
				"What stage is my child at?",
				"How do I respond to echolalia?",
				"Daily language activities?",
				"Supporting gestalt language?",
				"When to see a specialist?"
			],
			'Parent Support': [
				"I'm feeling overwhelmed",
				"How to stay patient?",
				"Building confidence as a parent",
				"Managing daily challenges",
				"Finding support community"
			],
			'Child Mode': [
				"Let's play a game!",
				"Tell me a story",
				"What's your favorite color?",
				"Can you help me count?",
				"Sing a song with me"
			]
		};
		return prompts[currentMode] || prompts['Language Coach'];
	};

	const handleSuggestedPrompt = (prompt: string) => {
		setInput(prompt);
		setHasUserInteracted(true);
		// Auto-send the prompt
		setTimeout(() => {
			handleSendMessage();
		}, 100);
	};

	const saveCurrentConversation = () => {
		if (conversation.length === 0) return;

		const conversationTitle = conversation[0]?.content.slice(0, 30) + "..." || `${mode} conversation`;
		const newConversation = {
			id: currentConversationId || Date.now().toString(),
			title: conversationTitle,
			mode,
			messages: [...conversation],
			lastUpdated: new Date().toISOString()
		};

		setConversationHistory(prev => {
			const existing = prev.find(c => c.id === newConversation.id);
			if (existing) {
				return prev.map(c => c.id === newConversation.id ? newConversation : c);
			}
			return [newConversation, ...prev];
		});
	};

	const loadConversation = (conversationId: string) => {
		const conv = conversationHistory.find(c => c.id === conversationId);
		if (conv) {
			setConversation(conv.messages);
			setMode(conv.mode);
			setCurrentConversationId(conversationId);
			closeConversationHistory();
			setHasUserInteracted(true);
		}
	};

	const deleteConversation = (conversationId: string) => {
		setConversationHistory(prev => prev.filter(c => c.id !== conversationId));
		if (currentConversationId === conversationId) {
			setCurrentConversationId(null);
		}
	};

	const renameConversation = (conversationId: string, newTitle: string) => {
		setConversationHistory(prev => 
			prev.map(c => c.id === conversationId ? { ...c, title: newTitle } : c)
		);
	};

	const openConversationHistory = () => {
		setShowConversationHistory(true);
		Animated.parallel([
			Animated.timing(historySlideAnim, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
				easing: (t) => {
					const p = t - 1;
					return p * p * p + 1; // Same easing as drawer
				}
			}),
			Animated.timing(historyOverlayOpacity, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			})
		]).start();
	};

	const closeConversationHistory = () => {
		Animated.parallel([
			Animated.timing(historySlideAnim, {
				toValue: 300,
				duration: 250,
				useNativeDriver: true,
				easing: (t) => t * t * t // Same easing as drawer
			}),
			Animated.timing(historyOverlayOpacity, {
				toValue: 0,
				duration: 250,
				useNativeDriver: true,
			})
		]).start(() => {
			setShowConversationHistory(false);
		});
	};

	const startNewConversation = () => {
		saveCurrentConversation();
		setConversation([]);
		setStreamingContent('');
		setIsStreamingActive(false);
		setHasUserInteracted(false);
		setCurrentConversationId(null);
		closeConversationHistory();
	};

	const settingsOptions = [
		{ label: 'Export Chat', action: () => console.log('Export chat') },
		{ label: 'Clear History', action: () => setConversationHistory([]) },
		{ label: 'Settings', action: () => console.log('Open settings') },
	];

	// Save conversation when messages change
	useEffect(() => {
		if (conversation.length > 0) {
			const timeoutId = setTimeout(() => {
				saveCurrentConversation();
			}, 2000); // Auto-save after 2 seconds of inactivity
			
			return () => clearTimeout(timeoutId);
		}
	}, [conversation, mode]);

	const currentConfig = getModeConfig(mode);

	const renderMessage = (message: ConversationMessage, index: number) => {
		const isUser = message.role === 'user';
		
		return (
			<View key={message.id} style={{
				alignSelf: isUser ? 'flex-end' : 'flex-start',
				maxWidth: '80%',
				marginBottom: tokens.spacing.gap.sm,
				marginHorizontal: tokens.spacing.containerX
			}}>
				{/* Message bubble */}
				<View style={{
					backgroundColor: isUser ? tokens.color.brand.gradient.start : 'white',
					borderRadius: tokens.radius['2xl'],
					padding: tokens.spacing.gap.sm,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 1 },
					shadowOpacity: 0.1,
					shadowRadius: 4,
					elevation: 2,
					...(isUser ? {} : { borderWidth: 1, borderColor: tokens.color.border.default })
				}}>
					<Text style={{
						color: isUser ? 'white' : tokens.color.text.primary,
						fontSize: tokens.font.size.sm,
						lineHeight: tokens.font.size.sm * 1.4
					}}>
						{message.content}
					</Text>
					
					{/* Audio indicator for voice messages */}
					{message.audioUrl && (
						<View style={{ 
							flexDirection: 'row', 
							alignItems: 'center', 
							marginTop: 4,
							gap: 4
						}}>
							<Ionicons 
								name="volume-high" 
								size={10} 
								color={isUser ? 'rgba(255,255,255,0.8)' : tokens.color.text.secondary} 
							/>
							<Text style={{
								color: isUser ? 'rgba(255,255,255,0.8)' : tokens.color.text.secondary,
								fontSize: tokens.font.size.xs
							}}>
								Voice message
							</Text>
						</View>
					)}
				</View>
				
				{/* Timestamp */}
				<Text style={{
					fontSize: tokens.font.size.xs,
					color: tokens.color.text.secondary,
					marginTop: 2,
					textAlign: isUser ? 'right' : 'left'
				}}>
					{new Date(message.timestamp).toLocaleTimeString([], { 
						hour: '2-digit', 
						minute: '2-digit' 
					})}
				</Text>
			</View>
		);
	};

	return (
		<KeyboardAvoidingView 
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={{ flex: 1 }}
		>
			<LinearGradient
				colors={['#7C3AED', '#EC4899', '#FB923C']}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={{ flex: 1 }}
			>
				{/* Enhanced Header with New Controls */}
				<View style={{
					paddingTop: 60,
					paddingHorizontal: tokens.spacing.containerX,
					paddingBottom: tokens.spacing.gap.lg
				}}>
					{/* Settings Dropdown */}
					{showSettingsDropdown && (
						<View style={{
							position: 'absolute',
							top: 100,
							right: tokens.spacing.containerX,
							width: 120,
							backgroundColor: 'white',
							borderRadius: tokens.radius.lg,
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.08,
							shadowRadius: 12,
							elevation: 6,
							zIndex: 1000
						}}>
							{settingsOptions.map((option, index) => (
								<TouchableOpacity
									key={option.label}
									onPress={() => {
										option.action();
										setShowSettingsDropdown(false);
									}}
									activeOpacity={0.7}
									style={{
										paddingVertical: tokens.spacing.gap.xs,
										paddingHorizontal: tokens.spacing.gap.sm,
										borderBottomWidth: index !== settingsOptions.length - 1 ? 0.5 : 0,
										borderBottomColor: 'rgba(0,0,0,0.08)'
									}}
								>
									<Text style={{
										fontSize: tokens.font.size.xs,
										color: tokens.color.text.secondary,
										fontWeight: '400'
									}}>
										{option.label}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					)}

					{/* Header Row */}
					<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
						{/* Left Side: Menu + Title */}
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.gap.md, flex: 1 }}>
							<TouchableOpacity onPress={openDrawer}>
								<Ionicons name="menu" size={24} color="white" />
							</TouchableOpacity>
							<Text style={{ color: 'white', fontSize: tokens.font.size.h3, fontWeight: '600' }}>
								Ask Jessie
							</Text>
						</View>
						
						{/* Right Side Controls - Reordered */}
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.gap.sm }}>
							{/* Settings Button - Far Left */}
							<TouchableOpacity
								onPress={() => setShowSettingsDropdown(!showSettingsDropdown)}
								activeOpacity={0.7}
								style={{
									padding: 6,
									borderRadius: tokens.radius.lg,
									backgroundColor: 'rgba(255,255,255,0.2)'
								}}
							>
								<Ionicons name="ellipsis-horizontal" size={18} color="white" />
							</TouchableOpacity>

							{/* AI Recommendations Button - Middle */}
							<TouchableOpacity
								activeOpacity={0.7}
								style={{
									padding: 6,
									borderRadius: tokens.radius.lg,
									backgroundColor: 'rgba(255,255,255,0.2)'
								}}
							>
								<Ionicons name="sparkles" size={18} color="white" />
							</TouchableOpacity>

							{/* Conversation History Button - Far Right */}
							<TouchableOpacity
								onPress={openConversationHistory}
								activeOpacity={0.7}
								style={{
									padding: 6,
									borderRadius: tokens.radius.lg,
									backgroundColor: 'rgba(255,255,255,0.2)'
								}}
							>
								<Ionicons name="chatbubbles" size={18} color="white" />
							</TouchableOpacity>
						</View>
					</View>
				</View>

				{/* Conversation Container */}
				<View style={{ 
					flex: 1, 
					backgroundColor: 'white', 
					borderTopLeftRadius: 24, 
					borderTopRightRadius: 24
				}}>
					{/* Conversation ScrollView */}
					<ScrollView
						ref={scrollViewRef}
						style={{ flex: 1 }}
						contentContainerStyle={{ paddingVertical: tokens.spacing.gap.lg }}
						showsVerticalScrollIndicator={false}
					>
						{conversation.map((message, index) => renderMessage(message, index))}
						
						{/* Streaming message */}
						{isStreamingActive && streamingContent && (
							<View style={{
								alignSelf: 'flex-start',
								maxWidth: '80%',
								marginBottom: tokens.spacing.gap.sm,
								marginHorizontal: tokens.spacing.containerX
							}}>
								<View style={{
									backgroundColor: 'white',
									borderRadius: tokens.radius['2xl'],
									padding: tokens.spacing.gap.sm,
									borderWidth: 1,
									borderColor: tokens.color.border.default,
									shadowColor: '#000',
									shadowOffset: { width: 0, height: 1 },
									shadowOpacity: 0.1,
									shadowRadius: 4,
									elevation: 2
								}}>
									<Text style={{
										color: tokens.color.text.primary,
										fontSize: tokens.font.size.sm,
										lineHeight: tokens.font.size.sm * 1.4
									}}>
										{streamingContent}
										<Text style={{ opacity: 0.5 }}>▋</Text>
									</Text>
								</View>
							</View>
						)}
					</ScrollView>
				</View>

				{/* Bottom Container */}
				<View style={{ 
					backgroundColor: 'white',
					paddingHorizontal: tokens.spacing.containerX,
					paddingTop: tokens.spacing.gap.md,
					paddingBottom: 40
				}}>
					{/* Mode Selector Dropdown - Small and Subtle */}
					{showModeSelector && (
						<View style={{
							position: 'absolute',
							bottom: 110,
							left: tokens.spacing.containerX + tokens.spacing.gap.md,
							width: 140, // Fixed small width instead of full screen
							backgroundColor: 'white',
							borderRadius: tokens.radius.lg,
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.08,
							shadowRadius: 12,
							elevation: 6,
							zIndex: 1000
						}}>
							{MODES.map((m, index) => (
								<TouchableOpacity
									key={m}
									onPress={() => handleModeChange(m)}
									activeOpacity={0.7}
									style={{
										paddingVertical: tokens.spacing.gap.xs,
										paddingHorizontal: tokens.spacing.gap.sm,
										borderBottomWidth: index !== MODES.length - 1 ? 0.5 : 0,
										borderBottomColor: 'rgba(0,0,0,0.08)',
										backgroundColor: mode === m ? 'rgba(124,58,237,0.05)' : 'transparent'
									}}
								>
									<Text style={{
										fontSize: tokens.font.size.xs,
										color: mode === m ? tokens.color.brand.gradient.start : tokens.color.text.secondary,
										fontWeight: mode === m ? '500' : '400'
									}}>
										{m}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					)}

					{/* Suggested Prompts - Only shown before first interaction */}
					{!hasUserInteracted && (
						<View style={{ marginBottom: tokens.spacing.gap.md }}>
							<ScrollView 
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={{
									paddingHorizontal: tokens.spacing.gap.xs,
									gap: tokens.spacing.gap.sm
								}}
								decelerationRate="fast"
								snapToInterval={undefined}
								snapToAlignment="start"
							>
								{getSuggestedPrompts(mode).map((prompt, index) => (
									<TouchableOpacity
										key={index}
										onPress={() => handleSuggestedPrompt(prompt)}
										activeOpacity={0.7}
										style={{
											backgroundColor: 'rgba(124,58,237,0.08)',
											paddingHorizontal: tokens.spacing.gap.sm,
											paddingVertical: 6,
											borderRadius: tokens.radius.pill
										}}
									>
										<Text style={{
											fontSize: tokens.font.size.xs,
											color: tokens.color.text.secondary,
											fontWeight: '400'
										}}>
											{prompt}
										</Text>
									</TouchableOpacity>
								))}
							</ScrollView>
						</View>
					)}

					{/* Rounded Container with Shadow and Border Radius */}
					<View style={{
						backgroundColor: 'white',
						borderRadius: 20,
						shadowColor: '#000',
						shadowOffset: { width: 0, height: 4 },
						shadowOpacity: 0.12,
						shadowRadius: 16,
						elevation: 8,
						paddingHorizontal: tokens.spacing.gap.md,
						paddingVertical: tokens.spacing.gap.md
					}}>
						{/* Top Row: Mode Selector and Controls */}
						<View style={{
							flexDirection: 'row',
							alignItems: 'center',
							justifyContent: 'space-between',
							marginBottom: tokens.spacing.gap.sm
						}}>
							{/* Mode Selector Button - Subtle */}
							<TouchableOpacity
								onPress={() => setShowModeSelector(!showModeSelector)}
								activeOpacity={0.7}
								style={{
									flexDirection: 'row',
									alignItems: 'center',
									backgroundColor: 'rgba(124,58,237,0.05)',
									paddingHorizontal: tokens.spacing.gap.sm,
									paddingVertical: tokens.spacing.gap.xs,
									borderRadius: tokens.radius.lg
								}}
							>
								<Text style={{
									fontSize: tokens.font.size.xs,
									color: tokens.color.text.secondary,
									marginRight: 4,
									fontWeight: '500'
								}}>
									{mode}
								</Text>
								<Ionicons 
									name={showModeSelector ? "chevron-up" : "chevron-down"} 
									size={12} 
									color={tokens.color.text.secondary} 
								/>
							</TouchableOpacity>

							{/* Right Side: Talk/Chat Toggle */}
							<View style={{
								flexDirection: 'row',
								alignItems: 'center',
								backgroundColor: 'rgba(124,58,237,0.05)',
								borderRadius: tokens.radius.pill,
								padding: 2
							}}>
								<TouchableOpacity
									onPress={() => {
										if (isRecording && aiServiceRef.current) {
											aiServiceRef.current.stopVoiceRecording().catch(console.error);
											setIsRecording(false);
										}
										setIsVoiceMode(true);
									}}
									activeOpacity={0.7}
									style={{
										paddingHorizontal: 8,
										paddingVertical: 3,
										borderRadius: tokens.radius.pill,
										backgroundColor: isVoiceMode ? tokens.color.brand.gradient.start : 'transparent'
									}}
								>
									<Text style={{
										color: isVoiceMode ? 'white' : tokens.color.text.secondary,
										fontSize: 10,
										fontWeight: isVoiceMode ? '600' : '400'
									}}>
										Talk
									</Text>
								</TouchableOpacity>
								
								<TouchableOpacity
									onPress={() => {
										if (isRecording && aiServiceRef.current) {
											aiServiceRef.current.stopVoiceRecording().catch(console.error);
											setIsRecording(false);
										}
										setIsVoiceMode(false);
									}}
									activeOpacity={0.7}
									style={{
										paddingHorizontal: 8,
										paddingVertical: 3,
										borderRadius: tokens.radius.pill,
										backgroundColor: !isVoiceMode ? tokens.color.brand.gradient.start : 'transparent'
									}}
								>
									<Text style={{
										color: !isVoiceMode ? 'white' : tokens.color.text.secondary,
										fontSize: 10,
										fontWeight: !isVoiceMode ? '600' : '400'
									}}>
										Chat
									</Text>
								</TouchableOpacity>
							</View>
						</View>

						{/* Input Row */}
						<View style={{ 
							flexDirection: 'row', 
							alignItems: 'flex-end',
							gap: tokens.spacing.gap.sm
						}}>
							{isVoiceMode ? (
								<>
									{/* Audio Wave Visualization */}
									<View style={{ 
										flex: 1,
										height: 44,
										backgroundColor: 'rgba(124,58,237,0.05)',
										borderRadius: tokens.radius.lg,
										flexDirection: 'row',
										alignItems: 'center',
										justifyContent: 'center',
										paddingHorizontal: tokens.spacing.gap.md,
										gap: 4
									}}>
										{!isRecording ? (
											<Text style={{
												fontSize: tokens.font.size.sm,
												color: tokens.color.text.secondary,
												textAlign: 'center'
											}}>
												Tap to speak
											</Text>
										) : (
											waveAnimations.map((anim, index) => (
												<Animated.View
													key={index}
													style={{
														width: 3,
														backgroundColor: tokens.color.brand.gradient.start,
														borderRadius: 1.5,
														height: anim.interpolate({
															inputRange: [0, 1],
															outputRange: [8, 32]
														})
													}}
												/>
											))
										)}
									</View>

									{/* Voice Mode - Microphone Button - Right Aligned */}
									<TouchableOpacity
										onPress={handleVoiceRecording}
										activeOpacity={0.8}
										style={{
											width: 44,
											height: 44,
											borderRadius: 22,
											backgroundColor: isRecording ? '#EF4444' : tokens.color.brand.gradient.start,
											alignItems: 'center',
											justifyContent: 'center',
											shadowColor: isRecording ? '#EF4444' : tokens.color.brand.gradient.start,
											shadowOffset: { width: 0, height: 2 },
											shadowOpacity: 0.25,
											shadowRadius: 8,
											elevation: 4
										}}
									>
										<Ionicons 
											name={isRecording ? "stop" : "mic"} 
											size={20} 
											color="white" 
										/>
									</TouchableOpacity>
								</>
							) : (
								<>
									{/* Text Input */}
									<View style={{ flex: 1 }}>
										<TextInput
											placeholder={currentConfig.placeholder}
											value={input}
											onChangeText={setInput}
											multiline
											style={{
												fontSize: tokens.font.size.sm,
												color: tokens.color.text.secondary,
												maxHeight: 80,
												minHeight: 44,
												paddingHorizontal: tokens.spacing.gap.md,
												paddingVertical: tokens.spacing.gap.sm,
												backgroundColor: 'rgba(124,58,237,0.05)',
												borderRadius: tokens.radius.lg
											}}
											placeholderTextColor={tokens.color.text.secondary}
										/>
									</View>

									{/* Send Button */}
									<TouchableOpacity
										onPress={handleSendMessage}
										disabled={!input.trim() || isConnecting}
										activeOpacity={0.8}
										style={{
											width: 44,
											height: 44,
											borderRadius: 22,
											backgroundColor: (input.trim() && !isConnecting) ? tokens.color.brand.gradient.start : tokens.color.border.default,
											alignItems: 'center',
											justifyContent: 'center'
										}}
									>
										<Ionicons name="send" size={18} color="white" />
									</TouchableOpacity>
								</>
							)}
						</View>
					</View>
				</View>

				{/* Conversation History Sidebar with Animation */}
				{showConversationHistory && (
					<Animated.View style={{
						position: 'absolute',
						top: 0,
						right: 0,
						bottom: 0,
						width: 300,
						backgroundColor: 'white',
						shadowColor: '#000',
						shadowOffset: { width: -2, height: 0 },
						shadowOpacity: 0.15,
						shadowRadius: 8,
						elevation: 10,
						zIndex: 2000,
						transform: [{ translateX: historySlideAnim }]
					}}>
						{/* History Header */}
						<View style={{
							paddingTop: 60,
							paddingHorizontal: tokens.spacing.gap.lg,
							paddingBottom: tokens.spacing.gap.lg,
							borderBottomWidth: 1,
							borderBottomColor: tokens.color.border.default,
							backgroundColor: tokens.color.bg.muted
						}}>
							<View style={{ 
								flexDirection: 'row', 
								alignItems: 'center', 
								justifyContent: 'space-between',
								marginBottom: tokens.spacing.gap.lg
							}}>
								<Text style={{
									fontSize: tokens.font.size.lg,
									fontWeight: '600',
									color: tokens.color.text.primary
								}}>
									Chat History
								</Text>
								<TouchableOpacity
									onPress={closeConversationHistory}
									style={{
										padding: 4,
										borderRadius: tokens.radius.lg,
										backgroundColor: 'white'
									}}
								>
									<Ionicons name="close" size={20} color={tokens.color.text.secondary} />
								</TouchableOpacity>
							</View>
							
							{/* New Chat Button - More Subtle */}
							<TouchableOpacity
								onPress={startNewConversation}
								style={{
									backgroundColor: 'white',
									paddingVertical: tokens.spacing.gap.xs,
									paddingHorizontal: tokens.spacing.gap.md,
									borderRadius: tokens.radius.lg,
									borderWidth: 1,
									borderColor: tokens.color.brand.gradient.start,
									alignItems: 'center'
								}}
							>
								<Text style={{
									color: tokens.color.brand.gradient.start,
									fontSize: tokens.font.size.sm,
									fontWeight: '500'
								}}>
									New Chat
								</Text>
							</TouchableOpacity>
						</View>

						{/* Conversation List */}
						<ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: tokens.spacing.gap.md }}>
							{conversationHistory.length === 0 ? (
								<View style={{ alignItems: 'center', marginTop: 40 }}>
									<Ionicons name="chatbubbles-outline" size={48} color={tokens.color.text.secondary} />
									<Text style={{
										marginTop: tokens.spacing.gap.sm,
										fontSize: tokens.font.size.sm,
										color: tokens.color.text.secondary,
										textAlign: 'center'
									}}>
										No conversations yet.{'\n'}Start chatting to see your history here.
									</Text>
								</View>
							) : (
								conversationHistory.map((conv) => (
									<TouchableOpacity
										key={conv.id}
										onPress={() => loadConversation(conv.id)}
										style={{
											backgroundColor: currentConversationId === conv.id ? tokens.color.bg.muted : 'white',
											paddingHorizontal: tokens.spacing.gap.sm,
											paddingVertical: tokens.spacing.gap.xs,
											borderRadius: tokens.radius.lg,
											marginBottom: tokens.spacing.gap.xs,
											borderWidth: 1,
											borderColor: currentConversationId === conv.id ? tokens.color.brand.gradient.start : tokens.color.border.default
										}}
									>
										<View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
											<View style={{ flex: 1, marginRight: tokens.spacing.gap.sm }}>
												<Text style={{
													fontSize: tokens.font.size.xs,
													fontWeight: '500',
													color: tokens.color.text.primary,
													marginBottom: 2
												}}>
													{conv.title}
												</Text>
												<Text style={{
													fontSize: 10,
													color: tokens.color.text.secondary,
													marginBottom: 2
												}}>
													{conv.mode} • {new Date(conv.lastUpdated).toLocaleDateString()}
												</Text>
												<Text style={{
													fontSize: 10,
													color: tokens.color.text.secondary
												}}>
													{conv.messages.length} messages
												</Text>
											</View>
											
											{/* Action Buttons */}
											<View style={{ flexDirection: 'row', gap: 4 }}>
												<TouchableOpacity
													onPress={(e) => {
														e.stopPropagation();
														// Here you could implement rename functionality
														// For now, just show an alert
														Alert.alert('Rename', 'Rename functionality to be implemented');
													}}
													style={{
														padding: 4,
														borderRadius: tokens.radius.sm,
														backgroundColor: tokens.color.bg.muted
													}}
												>
													<Ionicons name="pencil" size={12} color={tokens.color.text.secondary} />
												</TouchableOpacity>
												
												<TouchableOpacity
													onPress={(e) => {
														e.stopPropagation();
														Alert.alert(
															'Delete Conversation',
															'Are you sure you want to delete this conversation?',
															[
																{ text: 'Cancel', style: 'cancel' },
																{ text: 'Delete', style: 'destructive', onPress: () => deleteConversation(conv.id) }
															]
														);
													}}
													style={{
														padding: 4,
														borderRadius: tokens.radius.sm,
														backgroundColor: tokens.color.bg.muted
													}}
												>
													<Ionicons name="trash" size={12} color="#EF4444" />
												</TouchableOpacity>
											</View>
										</View>
									</TouchableOpacity>
								))
							)}
						</ScrollView>
					</Animated.View>
				)}

				{/* Animated Overlay for conversation history */}
				{showConversationHistory && (
					<Animated.View
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							backgroundColor: 'rgba(0,0,0,0.5)',
							opacity: historyOverlayOpacity,
							zIndex: 1500
						}}
					>
						<TouchableOpacity 
							style={{ flex: 1 }}
							onPress={closeConversationHistory}
							activeOpacity={1}
						/>
					</Animated.View>
				)}
			</LinearGradient>
		</KeyboardAvoidingView>
	);
}