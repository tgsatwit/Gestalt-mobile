import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 
                Constants.manifest?.extra?.apiUrl || 
                process.env.EXPO_PUBLIC_API_URL || 
                'http://localhost:3000';

export async function transcribeAudio(audioBlob: Blob, language: string = 'en'): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.m4a');
    formData.append('language', language);

    const response = await fetch(`${API_URL}/api/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to transcribe audio');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Transcription service error:', error);
    throw error;
  }
}