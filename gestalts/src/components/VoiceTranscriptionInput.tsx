import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, TextInput, Alert, TextInputProps } from 'react-native';
import { Text, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import OpenAI from 'openai';

interface VoiceTranscriptionInputProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  showCharacterCount?: boolean;
  minHeight?: number;
}

export const VoiceTranscriptionInput: React.FC<VoiceTranscriptionInputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  showCharacterCount = false,
  minHeight = 150,
  ...textInputProps
}) => {
  const { tokens } = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Initialize OpenAI client (you'll need to set up your API key)
  const openai = new OpenAI({
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY, // Set this in your .env file
  });

  const startRecording = async () => {
    try {
      console.log('Requesting permissions...');
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow microphone access to use voice transcription.');
        return;
      }

      console.log('Starting recording...');
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    console.log('Stopping recording...');
    
    if (!recordingRef.current) return;
    
    setIsRecording(false);
    setIsTranscribing(true);
    
    try {
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      
      if (uri) {
        await transcribeAudio(uri);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
      setIsTranscribing(false);
    }
  };

  const transcribeAudio = async (audioUri: string) => {
    try {
      console.log('Starting transcription...');
      
      // Read the audio file
      const audioFile = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Convert base64 to blob for OpenAI API
      const audioBlob = new Blob([Uint8Array.from(atob(audioFile), c => c.charCodeAt(0))], {
        type: 'audio/m4a'
      });
      
      // Create a File object from the blob
      const audioFileForAPI = new File([audioBlob], 'recording.m4a', { type: 'audio/m4a' });
      
      // Call OpenAI Whisper API
      const transcription = await openai.audio.transcriptions.create({
        file: audioFileForAPI,
        model: 'whisper-1',
        language: 'en', // You can make this configurable
      });
      
      console.log('Transcription completed:', transcription.text);
      
      // Append the transcription to existing text
      const newText = value ? `${value}\n${transcription.text}` : transcription.text;
      onChangeText(newText);
      
    } catch (error) {
      console.error('Transcription error:', error);
      Alert.alert('Error', 'Failed to transcribe audio. Please try again or type your message.');
    } finally {
      setIsTranscribing(false);
      
      // Clean up the temporary file
      try {
        await FileSystem.deleteAsync(audioUri, { idempotent: true });
      } catch (cleanupError) {
        console.warn('Failed to clean up audio file:', cleanupError);
      }
    }
  };

  const handleMicrophonePress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <View>
      {label && (
        <Text weight="medium" style={{ 
          fontSize: tokens.font.size.sm,
          color: tokens.color.text.secondary,
          marginBottom: tokens.spacing.gap.sm 
        }}>
          {label}
        </Text>
      )}
      
      <View style={{
        borderColor: tokens.color.border.default,
        borderWidth: 1,
        borderRadius: tokens.radius.lg,
        backgroundColor: 'white',
        overflow: 'hidden'
      }}>
        <TextInput
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          style={{
            padding: tokens.spacing.gap.md,
            paddingRight: tokens.spacing.gap.xl * 2,
            minHeight,
            textAlignVertical: 'top',
            fontSize: tokens.font.size.body
          }}
          multiline
          {...textInputProps}
        />
        
        {/* Microphone Button */}
        <TouchableOpacity
          onPress={handleMicrophonePress}
          disabled={isTranscribing}
          style={{
            position: 'absolute',
            right: tokens.spacing.gap.md,
            bottom: tokens.spacing.gap.md,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: isRecording ? '#EF4444' : tokens.color.brand.gradient.start,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isTranscribing ? 0.5 : 1
          }}
        >
          {isTranscribing ? (
            <Ionicons name="hourglass" size={20} color="white" />
          ) : (
            <Ionicons 
              name={isRecording ? "stop" : "mic"} 
              size={20} 
              color="white" 
            />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Status Text */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: tokens.spacing.gap.xs
      }}>
        <Text style={{ 
          fontSize: tokens.font.size.xs,
          color: tokens.color.text.secondary
        }}>
          {isRecording 
            ? "Recording... Tap mic to stop" 
            : isTranscribing 
            ? "Transcribing audio..." 
            : "Tap mic to record or type below"
          }
        </Text>
        
        {showCharacterCount && (
          <Text style={{ 
            fontSize: tokens.font.size.xs,
            color: tokens.color.text.secondary
          }}>
            {value.length} characters
          </Text>
        )}
      </View>
    </View>
  );
};