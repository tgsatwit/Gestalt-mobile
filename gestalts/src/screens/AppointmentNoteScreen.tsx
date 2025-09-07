import React, { useMemo, useState, useEffect } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '../components/GradientButton';
import { VoiceTranscriptionInput } from '../components/VoiceTranscriptionInput';
import { DatePickerField } from '../components/DatePickerField';
import { useMemoriesStore, type AppointmentNote } from '../state/useStore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BottomNavigation } from '../navigation/BottomNavigation';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import SpecialistService from '../services/specialistService';
import { Specialist } from '../types/specialist';
import { useAuth } from '../contexts/AuthContext';

type RouteParams = {
  id?: string; // if present, editing existing note
};

export default function AppointmentNoteScreen() {
  const { tokens } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = (route.params || {}) as RouteParams;

  const { appointmentNotes, addAppointmentNoteFull, updateAppointmentNote, profiles } = useMemoriesStore((s) => ({
    appointmentNotes: s.appointmentNotes,
    addAppointmentNoteFull: s.addAppointmentNoteFull,
    updateAppointmentNote: s.updateAppointmentNote,
    profiles: s.profiles,
  }));
  
  // Get available children from all profiles
  const availableChildren = profiles.map(profile => profile.childName);

  const existing = useMemo(() => appointmentNotes.find((n) => n.id === id), [appointmentNotes, id]);
  const { user } = useAuth();

  // Form state
  const [question, setQuestion] = useState(existing?.question ?? '');
  const [specialist, setSpecialist] = useState(existing?.specialist ?? '');
  const [details, setDetails] = useState(existing?.details ?? '');
  const [appointmentDate, setAppointmentDate] = useState<Date>(existing?.appointmentDateISO ? new Date(existing.appointmentDateISO) : new Date());

  // Specialist profiles
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loadingSpecialists, setLoadingSpecialists] = useState(false);

  const [imageUris, setImageUris] = useState<string[]>(existing?.imageUris ?? []);
  const [audioUri, setAudioUri] = useState<string | undefined>(existing?.audioUri);

  const [isClosed, setIsClosed] = useState<boolean>(existing?.isClosed ?? false);
  
  // Child selection state
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [showChildrenDropdown, setShowChildrenDropdown] = useState(false);
  const [closureResponse, setClosureResponse] = useState(existing?.closureResponse ?? '');
  const [closedAt, setClosedAt] = useState<Date>(existing?.closedAtISO ? new Date(existing.closedAtISO) : new Date());

  // Initialize selected child when component mounts
  useEffect(() => {
    if (availableChildren.length === 1 && selectedChild === '' && !existing) {
      setSelectedChild(availableChildren[0]);
    }
  }, [availableChildren.length, selectedChild, existing]);

  // Audio recording state (similar to AddGestaltScreen)
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(audioUri || null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [playbackSound, setPlaybackSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Audio recording permissions (no special setup needed for expo-av)
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (playbackSound) {
        playbackSound.unloadAsync();
      }
    };
  }, [recording, playbackSound]);

  // Load specialist profiles
  useEffect(() => {
    const loadSpecialists = async () => {
      if (!user) return;
      
      setLoadingSpecialists(true);
      try {
        const specialistService = SpecialistService;
        const specialistProfiles = await specialistService.getUserSpecialists(user.email || 'anonymous');
        setSpecialists(specialistProfiles);
      } catch (error) {
        console.error('Failed to load specialists:', error);
      } finally {
        setLoadingSpecialists(false);
      }
    };

    loadSpecialists();
  }, [user?.email]);

  // Audio recording functions (from AddGestaltScreen)
  const startRecording = async () => {
    try {
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.error('Permission needed', 'Please grant audio recording permission');
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);

      // Update duration every second
      recording.setOnRecordingStatusUpdate((status) => {
        if (status.isRecording) {
          setRecordingDuration(Math.floor(status.durationMillis / 1000));
        }
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setRecordingUri(uri);
      setRecordingDuration(0);

      // Configure audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const playRecording = async () => {
    if (!recordingUri) return;

    try {
      if (playbackSound) {
        // Stop current playback
        await playbackSound.stopAsync();
        await playbackSound.unloadAsync();
        setPlaybackSound(null);
        setIsPlaying(false);
      } else {
        // Start playback
        const { sound } = await Audio.Sound.createAsync(
          { uri: recordingUri },
          { shouldPlay: true }
        );
        setPlaybackSound(sound);
        setIsPlaying(true);

        // Listen for playback finish
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPlaybackSound(null);
          }
        });
      }
    } catch (error) {
      console.error('Failed to play recording:', error);
    }
  };

  const deleteRecording = () => {
    if (playbackSound) {
      playbackSound.unloadAsync();
      setPlaybackSound(null);
    }
    setRecordingUri(null);
    setIsPlaying(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ allowsMultipleSelection: true, mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!result.canceled) {
      const uris = result.assets?.map((asset: { uri: string }) => asset.uri).filter(Boolean) as string[];
      if (uris.length) setImageUris((prev) => [...prev, ...uris]);
    }
  };

  const handleSave = () => {
    const selectedProfile = profiles.find(p => p.childName === selectedChild);
    const payload: Omit<AppointmentNote, 'id' | 'createdAtISO'> & { createdAtISO?: string } = {
      question: question.trim(),
      specialist: specialist.trim() || undefined,
      details: details.trim() || undefined,
      imageUris,
      audioUri: recordingUri || undefined,
      appointmentDateISO: appointmentDate.toISOString(),
      isClosed,
      closedAtISO: isClosed ? closedAt.toISOString() : undefined,
      closureResponse: isClosed ? (closureResponse.trim() || undefined) : undefined,
    };

    if (existing && existing.id) {
      updateAppointmentNote(existing.id, payload);
    } else {
      addAppointmentNoteFull(payload);
    }
    navigation.goBack();
  };


  const [showSpecialistDropdown, setShowSpecialistDropdown] = useState(false);

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.gap.md, flex: 1 }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={{ color: 'white', fontSize: tokens.font.size.h3, fontWeight: '600' }}>
              Appointment Note
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={{ 
        flex: 1, 
        backgroundColor: 'white', 
        borderTopLeftRadius: 24, 
        borderTopRightRadius: 24
      }}>
        <ScrollView 
          contentContainerStyle={{ padding: tokens.spacing.containerX, paddingBottom: 120 }}
          onScrollBeginDrag={() => {
            setShowSpecialistDropdown(false);
          }}
        >
          {/* Auto-capture date banner - reduced visual hierarchy */}
          <View style={{
            marginBottom: tokens.spacing.gap.md
          }}>
            <Text style={{
              fontSize: tokens.font.size.xs,
              color: tokens.color.text.secondary,
              textAlign: 'center'
            }}>
              Created on {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>

          {/* Specialist */}
          <View style={{ marginBottom: tokens.spacing.gap.lg, position: 'relative' }}>
            <Text weight="medium" style={{ fontSize: tokens.font.size.sm, color: tokens.color.text.secondary, marginBottom: tokens.spacing.gap.xs }}>Specialist</Text>
            <TouchableOpacity
              onPress={() => setShowSpecialistDropdown(!showSpecialistDropdown)}
              style={{
                backgroundColor: tokens.color.surface,
                borderRadius: tokens.radius.lg,
                padding: tokens.spacing.gap.md,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: showSpecialistDropdown ? tokens.color.brand.gradient.start + '30' : tokens.color.border.default
              }}
            >
              <Ionicons name="medkit" size={20} color={tokens.color.text.secondary} />
              <Text style={{ 
                marginLeft: tokens.spacing.gap.sm, 
                flex: 1,
                color: specialist ? tokens.color.text.primary : tokens.color.text.secondary
              }}>
                {specialist || (loadingSpecialists ? 'Loading specialists...' : specialists.length > 0 ? 'Select specialist' : 'No specialists found')}
              </Text>
              <Ionicons name={showSpecialistDropdown ? "chevron-up" : "chevron-down"} size={16} color={tokens.color.text.secondary} />
            </TouchableOpacity>

            {showSpecialistDropdown && !loadingSpecialists && (
              <View style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, backgroundColor: 'white', borderRadius: tokens.radius.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 6, zIndex: 1000 }}>
                <ScrollView style={{ maxHeight: 180 }}>
                  {/* Clear selection option */}
                  {specialist && (
                    <TouchableOpacity 
                      onPress={() => { setSpecialist(''); setShowSpecialistDropdown(false); }} 
                      style={{ paddingVertical: tokens.spacing.gap.xs, paddingHorizontal: tokens.spacing.gap.sm, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.08)', backgroundColor: 'transparent', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <Text style={{ fontSize: tokens.font.size.sm, color: tokens.color.text.secondary, fontWeight: '400', fontStyle: 'italic' }}>Clear selection</Text>
                      <Ionicons name="close" size={12} color={tokens.color.text.secondary} />
                    </TouchableOpacity>
                  )}
                  {specialists.map((s, idx) => (
                    <TouchableOpacity 
                      key={s.id} 
                      onPress={() => { setSpecialist(s.name); setShowSpecialistDropdown(false); }} 
                      style={{ paddingVertical: tokens.spacing.gap.xs, paddingHorizontal: tokens.spacing.gap.sm, borderBottomWidth: idx !== specialists.length - 1 ? 0.5 : 0, borderBottomColor: 'rgba(0,0,0,0.08)', backgroundColor: specialist === s.name ? tokens.color.bg.muted : 'transparent', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <View>
                        <Text style={{ fontSize: tokens.font.size.sm, color: specialist === s.name ? tokens.color.brand.gradient.start : tokens.color.text.secondary, fontWeight: '600' }}>
                          {s.name}
                        </Text>
                        {s.title && (
                          <Text style={{ fontSize: tokens.font.size.xs, color: tokens.color.text.secondary, marginTop: 1 }}>
                            {s.title}
                          </Text>
                        )}
                      </View>
                      {specialist === s.name && <Ionicons name="checkmark" size={12} color={tokens.color.brand.gradient.start} />}
                    </TouchableOpacity>
                  ))}
                  {specialists.length === 0 && (
                    <View style={{ paddingVertical: tokens.spacing.gap.md, paddingHorizontal: tokens.spacing.gap.sm, alignItems: 'center' }}>
                      <Text style={{ fontSize: tokens.font.size.sm, color: tokens.color.text.secondary, textAlign: 'center' }}>
                        No specialists found. Add specialists in your profile.
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Question / Note details with transcription */}
          <View style={{ marginBottom: tokens.spacing.gap.lg }}>
            <VoiceTranscriptionInput
              label="Question / Purpose"
              placeholder="What do you want to ask or note for this appointment?"
              value={question}
              onChangeText={setQuestion}
              minHeight={80}
              showCharacterCount={false}
            />
          </View>

          <View style={{ marginBottom: tokens.spacing.gap.lg }}>
            <VoiceTranscriptionInput
              label="Details"
              placeholder="Add any background info, symptoms, observations..."
              value={details}
              onChangeText={setDetails}
              minHeight={120}
              showCharacterCount={true}
            />
          </View>

          {/* Attachments */}
          <View style={{ marginBottom: tokens.spacing.gap.lg }}>
            <Text weight="medium" style={{ fontSize: tokens.font.size.sm, color: tokens.color.text.secondary, marginBottom: tokens.spacing.gap.xs }}>Attachments</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: tokens.spacing.gap.sm }}>
              {imageUris.map((uri) => (
                <Image key={uri} source={{ uri }} style={{ width: 72, height: 72, borderRadius: 8, marginRight: 8, marginBottom: 8 }} />
              ))}
            </View>
            <TouchableOpacity onPress={handlePickImage} style={{ backgroundColor: tokens.color.surface, borderRadius: tokens.radius.lg, padding: tokens.spacing.gap.lg, alignItems: 'center', borderWidth: 1, borderColor: tokens.color.border.default, borderStyle: 'dashed' }}>
              <Ionicons name="camera-outline" size={32} color={tokens.color.text.secondary} />
              <Text color="secondary" style={{ marginTop: tokens.spacing.gap.sm, fontSize: tokens.font.size.sm }}>Add photos</Text>
            </TouchableOpacity>
          </View>

          {/* Audio Recording */}
          <View style={{ marginBottom: tokens.spacing.gap.lg }}>
            <Text weight="medium" style={{ 
              fontSize: tokens.font.size.sm,
              color: tokens.color.text.secondary,
              marginBottom: tokens.spacing.gap.sm 
            }}>
              Record Audio (Optional)
            </Text>
            
            {!recordingUri ? (
              <TouchableOpacity
                onPress={isRecording ? stopRecording : startRecording}
                style={{
                  backgroundColor: isRecording ? '#EF4444' + '20' : tokens.color.surface,
                  borderRadius: tokens.radius.lg,
                  padding: tokens.spacing.gap.lg,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: isRecording ? '#EF4444' : tokens.color.border.default
                }}
              >
                <View style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: isRecording ? '#EF4444' : tokens.color.brand.gradient.start,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: tokens.spacing.gap.sm
                }}>
                  <Ionicons 
                    name={isRecording ? "stop" : "mic"} 
                    size={28} 
                    color="white" 
                  />
                </View>
                <Text style={{ 
                  color: isRecording ? '#EF4444' : tokens.color.text.primary,
                  fontWeight: '600',
                  fontSize: tokens.font.size.body
                }}>
                  {isRecording ? `Recording... ${formatDuration(recordingDuration)}` : 'Tap to Record'}
                </Text>
                {!isRecording && (
                  <Text style={{ 
                    color: tokens.color.text.secondary,
                    fontSize: tokens.font.size.sm,
                    marginTop: 4
                  }}>
                    Record your notes or observations
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <View style={{
                backgroundColor: tokens.color.surface,
                borderRadius: tokens.radius.lg,
                padding: tokens.spacing.gap.md,
                borderWidth: 1,
                borderColor: tokens.color.border.default
              }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: tokens.font.size.body,
                      fontWeight: '600',
                      marginBottom: 4
                    }}>
                      Audio Recording
                    </Text>
                    <Text style={{
                      fontSize: tokens.font.size.sm,
                      color: tokens.color.text.secondary
                    }}>
                      Tap play to listen
                    </Text>
                  </View>
                  <View style={{
                    flexDirection: 'row',
                    gap: tokens.spacing.gap.sm
                  }}>
                    <TouchableOpacity
                      onPress={playRecording}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: tokens.color.brand.gradient.start,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Ionicons 
                        name={isPlaying ? "pause" : "play"} 
                        size={20} 
                        color="white" 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={deleteRecording}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: '#EF4444',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Ionicons name="trash" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>


          {/* Appointment Date - moved to bottom */}
          <View style={{ marginBottom: tokens.spacing.gap.lg }}>
            <DatePickerField
              selectedDate={appointmentDate}
              onDateSelect={setAppointmentDate}
              label="Appointment Date"
            />
          </View>

          {/* Mark as closed - moved after appointment date */}
          <View style={{ marginBottom: tokens.spacing.gap.lg }}>
            <TouchableOpacity onPress={() => setIsClosed(!isClosed)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name={isClosed ? 'checkbox' : 'square-outline'} size={20} color={tokens.color.brand.gradient.start} />
              <Text style={{ marginLeft: 8, fontWeight: '600' }}>Mark as closed</Text>
            </TouchableOpacity>

            {isClosed && (
              <View style={{ marginTop: tokens.spacing.gap.sm }}>
                <VoiceTranscriptionInput
                  placeholder="Response / outcome from appointment"
                  value={closureResponse}
                  onChangeText={setClosureResponse}
                  minHeight={80}
                  showCharacterCount={false}
                  style={{ marginBottom: tokens.spacing.gap.sm }}
                />

                <DatePickerField
                  selectedDate={closedAt}
                  onDateSelect={setClosedAt}
                  label="Closed Date"
                />
              </View>
            )}
          </View>

          {/* Save with extra padding */}
          <View style={{ marginBottom: tokens.spacing.gap.xl * 2 }}>
            <GradientButton title={existing ? 'Save Changes' : 'Save Note'} onPress={handleSave} />
          </View>
        </ScrollView>
      </View>

      {/* Floating mic button (decorative) */}
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
            style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
          >
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 28 }} />
            <Ionicons name="mic" size={28} color="white" style={{ zIndex: 1 }} />
          </LinearGradient>
        </View>
      </TouchableOpacity>

      <BottomNavigation />
    </LinearGradient>
  );
}


