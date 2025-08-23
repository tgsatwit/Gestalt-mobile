import React, { useMemo, useState, useEffect } from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientButton } from '../components/GradientButton';
import { useMemoriesStore, type AppointmentNote } from '../state/useStore';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BottomNavigation } from '../components/BottomNavigation';
import { useAudioRecorder, useAudioPlayer, RecordingPresets, AudioModule, setAudioModeAsync } from 'expo-audio';
import * as ImagePicker from 'expo-image-picker';

type RouteParams = {
  id?: string; // if present, editing existing note
};

export default function AppointmentNoteScreen() {
  const { tokens } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = (route.params || {}) as RouteParams;

  const { appointmentNotes, addAppointmentNoteFull, updateAppointmentNote } = useMemoriesStore((s) => ({
    appointmentNotes: s.appointmentNotes,
    addAppointmentNoteFull: s.addAppointmentNoteFull,
    updateAppointmentNote: s.updateAppointmentNote,
  }));

  const existing = useMemo(() => appointmentNotes.find((n) => n.id === id), [appointmentNotes, id]);

  // Form state
  const [question, setQuestion] = useState(existing?.question ?? '');
  const [specialist, setSpecialist] = useState(existing?.specialist ?? '');
  const [details, setDetails] = useState(existing?.details ?? '');
  const [appointmentDate, setAppointmentDate] = useState<Date>(existing?.appointmentDateISO ? new Date(existing.appointmentDateISO) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [imageUris, setImageUris] = useState<string[]>(existing?.imageUris ?? []);
  const [audioUri, setAudioUri] = useState<string | undefined>(existing?.audioUri);

  const [isClosed, setIsClosed] = useState<boolean>(existing?.isClosed ?? false);
  const [closureResponse, setClosureResponse] = useState(existing?.closureResponse ?? '');
  const [closedAt, setClosedAt] = useState<Date>(existing?.closedAtISO ? new Date(existing.closedAtISO) : new Date());
  const [showClosedDatePicker, setShowClosedDatePicker] = useState(false);

  // Audio: recorder + player
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(audioUri ? { uri: audioUri } : null);

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) return;
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    })();
  }, []);

  const startRecording = async () => {
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const stopRecording = async () => {
    await recorder.stop();
    const uri = recorder.uri ?? undefined;
    if (uri) {
      setAudioUri(uri);
    }
  };

  const togglePlayback = async () => {
    if (!audioUri) return;
    if (player.playing) {
      player.pause();
    } else {
      // ensure source is set
      player.replace({ uri: audioUri });
      player.seekTo(0);
      player.play();
    }
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
    const payload: Omit<AppointmentNote, 'id' | 'createdAtISO'> & { createdAtISO?: string } = {
      question: question.trim(),
      specialist: specialist.trim() || undefined,
      details: details.trim() || undefined,
      imageUris,
      audioUri,
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

  // Simple calendar helpers (reuse pattern from AddJournalScreen)
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date(appointmentDate));
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentCalendarMonth);
    const firstDay = getFirstDayOfMonth(currentCalendarMonth);
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth(), day));
    return days;
  };
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentCalendarMonth);
    newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentCalendarMonth(newMonth);
  };

  // For now, simple list of specialists
  const specialists = ['Pediatrician', 'Speech Therapist', 'Occupational Therapist', 'Psychologist', 'Dentist'];
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
            setShowDatePicker(false);
            setShowSpecialistDropdown(false);
          }}
        >
          {/* Appointment Date */}
          <View style={{ marginBottom: tokens.spacing.gap.lg, position: 'relative' }}>
            <Text weight="medium" style={{ 
              fontSize: tokens.font.size.sm,
              color: tokens.color.text.secondary,
              marginBottom: tokens.spacing.gap.xs 
            }}>
              Appointment Date
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
                {appointmentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
              <Ionicons name={showDatePicker ? "chevron-up" : "chevron-down"} size={16} color={tokens.color.text.secondary} />
            </TouchableOpacity>

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
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing.gap.md }}>
                  <TouchableOpacity onPress={() => navigateMonth('prev')} style={{ padding: tokens.spacing.gap.xs, borderRadius: tokens.radius.lg / 2 }}>
                    <Ionicons name="chevron-back" size={20} color={tokens.color.text.primary} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: tokens.font.size.body, fontWeight: '600', color: tokens.color.text.primary }}>
                    {currentCalendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Text>
                  <TouchableOpacity onPress={() => navigateMonth('next')} style={{ padding: tokens.spacing.gap.xs, borderRadius: tokens.radius.lg / 2 }}>
                    <Ionicons name="chevron-forward" size={20} color={tokens.color.text.primary} />
                  </TouchableOpacity>
                </View>

                {/* Day Names */}
                <View style={{ flexDirection: 'row', marginBottom: tokens.spacing.gap.xs }}>
                  {dayNames.map((d) => (
                    <View key={d} style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ fontSize: tokens.font.size.xs, fontWeight: '600', color: tokens.color.text.secondary }}>{d}</Text>
                    </View>
                  ))}
                </View>

                {/* Grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {generateCalendarDays().map((date, index) => {
                    if (!date) return <View key={`empty-${index}`} style={{ width: '14.28%', height: 40 }} />;
                    const isSelected = date.toDateString() === appointmentDate.toDateString();
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isPastMonth = date.getMonth() !== currentCalendarMonth.getMonth();
                    return (
                      <TouchableOpacity
                        key={date.toISOString()}
                        onPress={() => { setAppointmentDate(date); setShowDatePicker(false); }}
                        style={{
                          width: '14.28%', height: 40, alignItems: 'center', justifyContent: 'center',
                          borderRadius: tokens.radius.lg / 2, backgroundColor: isSelected ? tokens.color.brand.gradient.start : 'transparent',
                          marginBottom: 2
                        }}
                      >
                        <Text style={{
                          fontSize: tokens.font.size.sm,
                          fontWeight: isSelected ? '600' : '400',
                          color: isSelected ? 'white' : isToday ? tokens.color.brand.gradient.start : isPastMonth ? tokens.color.text.secondary + '60' : tokens.color.text.primary
                        }}>{date.getDate()}</Text>
                        {isToday && !isSelected && (
                          <View style={{ position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2, backgroundColor: tokens.color.brand.gradient.start }} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
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
              <Text style={{ marginLeft: tokens.spacing.gap.sm, flex: 1 }}>
                {specialist || 'Select specialist'}
              </Text>
              <Ionicons name={showSpecialistDropdown ? "chevron-up" : "chevron-down"} size={16} color={tokens.color.text.secondary} />
            </TouchableOpacity>

            {showSpecialistDropdown && (
              <View style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, backgroundColor: 'white', borderRadius: tokens.radius.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 6, zIndex: 1000 }}>
                <ScrollView style={{ maxHeight: 180 }}>
                  {specialists.map((s, idx) => (
                    <TouchableOpacity key={s} onPress={() => { setSpecialist(s); setShowSpecialistDropdown(false); }} style={{ paddingVertical: tokens.spacing.gap.xs, paddingHorizontal: tokens.spacing.gap.sm, borderBottomWidth: idx !== specialists.length - 1 ? 0.5 : 0, borderBottomColor: 'rgba(0,0,0,0.08)', backgroundColor: specialist === s ? tokens.color.bg.muted : 'transparent', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: tokens.font.size.sm, color: specialist === s ? tokens.color.brand.gradient.start : tokens.color.text.secondary, fontWeight: '400' }}>{s}</Text>
                      {specialist === s && <Ionicons name="checkmark" size={12} color={tokens.color.brand.gradient.start} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Question / Note details */}
          <View style={{ marginBottom: tokens.spacing.gap.lg }}>
            <Text weight="medium" style={{ fontSize: tokens.font.size.sm, color: tokens.color.text.secondary, marginBottom: tokens.spacing.gap.xs }}>Question / Purpose</Text>
            <TextInput
              placeholder="What do you want to ask or note for this appointment?"
              value={question}
              onChangeText={setQuestion}
              style={{ borderColor: tokens.color.border.default, borderWidth: 1, borderRadius: tokens.radius.lg, padding: tokens.spacing.gap.md, minHeight: 60, textAlignVertical: 'top', fontSize: tokens.font.size.body }}
              multiline
            />
          </View>

          <View style={{ marginBottom: tokens.spacing.gap.lg }}>
            <Text weight="medium" style={{ fontSize: tokens.font.size.sm, color: tokens.color.text.secondary, marginBottom: tokens.spacing.gap.xs }}>Details</Text>
            <TextInput
              placeholder="Add any background info, symptoms, observations..."
              value={details}
              onChangeText={setDetails}
              style={{ borderColor: tokens.color.border.default, borderWidth: 1, borderRadius: tokens.radius.lg, padding: tokens.spacing.gap.md, minHeight: 120, textAlignVertical: 'top', fontSize: tokens.font.size.body }}
              multiline
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

          {/* Audio */}
          <View style={{ marginBottom: tokens.spacing.gap.lg }}>
            <Text weight="medium" style={{ fontSize: tokens.font.size.sm, color: tokens.color.text.secondary, marginBottom: tokens.spacing.gap.xs }}>Audio Note</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.gap.sm }}>
              {!recorder.isRecording ? (
                <TouchableOpacity onPress={startRecording} style={{ backgroundColor: tokens.color.surface, paddingVertical: 10, paddingHorizontal: 14, borderRadius: tokens.radius.lg, borderWidth: 1, borderColor: tokens.color.border.default, flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="mic" size={18} color={tokens.color.text.secondary} />
                  <Text style={{ marginLeft: 6 }}>Record</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={stopRecording} style={{ backgroundColor: '#fee2e2', paddingVertical: 10, paddingHorizontal: 14, borderRadius: tokens.radius.lg, borderWidth: 1, borderColor: '#fecaca', flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="stop" size={18} color="#ef4444" />
                  <Text style={{ marginLeft: 6, color: '#ef4444' }}>Stop</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity disabled={!audioUri} onPress={togglePlayback} style={{ opacity: audioUri ? 1 : 0.5, backgroundColor: tokens.color.surface, paddingVertical: 10, paddingHorizontal: 14, borderRadius: tokens.radius.lg, borderWidth: 1, borderColor: tokens.color.border.default, flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name={player.playing ? 'pause' : 'play'} size={18} color={tokens.color.text.secondary} />
                <Text style={{ marginLeft: 6 }}>{player.playing ? 'Pause' : 'Play'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Close note */}
          <View style={{ marginBottom: tokens.spacing.gap.lg }}>
            <TouchableOpacity onPress={() => setIsClosed(!isClosed)} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name={isClosed ? 'checkbox' : 'square-outline'} size={20} color={tokens.color.brand.gradient.start} />
              <Text style={{ marginLeft: 8, fontWeight: '600' }}>Mark as closed</Text>
            </TouchableOpacity>

            {isClosed && (
              <View style={{ marginTop: tokens.spacing.gap.sm }}>
                <TextInput
                  placeholder="Response / outcome"
                  value={closureResponse}
                  onChangeText={setClosureResponse}
                  style={{ borderColor: tokens.color.border.default, borderWidth: 1, borderRadius: tokens.radius.lg, padding: tokens.spacing.gap.md, minHeight: 80, textAlignVertical: 'top', fontSize: tokens.font.size.body, marginBottom: tokens.spacing.gap.sm }}
                  multiline
                />

                <TouchableOpacity
                  onPress={() => setShowClosedDatePicker(!showClosedDatePicker)}
                  style={{ backgroundColor: tokens.color.surface, borderRadius: tokens.radius.lg, padding: tokens.spacing.gap.md, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: showClosedDatePicker ? tokens.color.brand.gradient.start + '30' : tokens.color.border.default }}
                >
                  <Ionicons name="time" size={20} color={tokens.color.text.secondary} />
                  <Text style={{ marginLeft: tokens.spacing.gap.sm, flex: 1 }}>
                    {closedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </Text>
                  <Ionicons name={showClosedDatePicker ? 'chevron-up' : 'chevron-down'} size={16} color={tokens.color.text.secondary} />
                </TouchableOpacity>
                {showClosedDatePicker && (
                  <View style={{ marginTop: 6 }}>
                    {/* Keep simple: reuse month nav for closed date */}
                    {/* In the interest of time, set closedAt to appointmentDate when toggled. Users can extend later. */}
                    <View style={{ flexDirection: 'row', marginTop: 6 }}>
                      <TouchableOpacity onPress={() => setClosedAt(new Date())} style={{ backgroundColor: tokens.color.surface, paddingVertical: 8, paddingHorizontal: 12, borderRadius: tokens.radius.lg, borderWidth: 1, borderColor: tokens.color.border.default }}>
                        <Text>Set to Today</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Save */}
          <GradientButton title={existing ? 'Save Changes' : 'Save Note'} onPress={handleSave} />
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


