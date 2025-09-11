import React, { useState } from 'react';
import { 
  View, 
  Modal, 
  TouchableOpacity, 
  Alert, 
  TextInput,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { Text } from '../theme';
import { ChildProfile } from '../types/profile';
import { useStorybookStore } from '../state/useStorybookStore-firebase';

interface AvatarManagementModalProps {
  visible: boolean;
  onClose: () => void;
  profile: ChildProfile | any; // Support both ChildProfile and Character
  avatarType: 'animated' | 'real';
  onProfileUpdate?: (updatedProfile: ChildProfile | any) => void;
}

export const AvatarManagementModal: React.FC<AvatarManagementModalProps> = ({
  visible,
  onClose,
  profile,
  avatarType,
  onProfileUpdate
}) => {
  const themeContext = useTheme();
  const { pickImageFromGallery, takePhoto, updateCharacterAvatar, updateCharacterName } = useStorybookStore();
  
  // Provide fallback tokens matching the actual token structure
  const tokens = themeContext?.tokens || {
    color: {
      surface: '#FFFFFF',
      text: { primary: '#111827', secondary: '#4B5563' },
      primary: { default: '#5B21B6' },
      support: { green: '#22C55E' },
      border: { default: '#E5E7EB' },
      bg: { muted: '#F9FAFB' }
    },
    spacing: {
      containerX: 16,
      gap: { xs: 8, sm: 12, md: 16, lg: 24, xl: 32 }
    },
    radius: { md: 10, lg: 12 }
  };
  
  // Create consistent spacing values for padding
  const padding = { sm: 8, md: 12, lg: 16, xl: 24 };
  const errorColor = '#EF4444';
  
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(profile.childName || profile.name);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAvatarType, setCurrentAvatarType] = useState(avatarType);
  
  // Get current avatar URL based on type - no fallback to other type
  const getCurrentAvatarUrl = () => {
    if (profile.avatars) {
      if (currentAvatarType === 'real') {
        return profile.avatars.real; // Only return real avatar, no fallback
      } else {
        return profile.avatars.animated || profile.avatarUrl; // Fallback to legacy avatarUrl for animated
      }
    }
    return currentAvatarType === 'animated' ? profile.avatarUrl : null;
  };

  const handleRename = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      setIsProcessing(true);
      await updateCharacterName(profile.id, newName.trim());
      
      // Update the profile locally
      const updatedProfile = {
        ...profile,
        childName: newName.trim(),
        updatedAt: new Date()
      };
      
      onProfileUpdate?.(updatedProfile);
      setIsRenaming(false);
      
      Alert.alert('Success', 'Name updated successfully');
    } catch (error) {
      console.error('Failed to rename character:', error);
      Alert.alert('Error', 'Failed to update name. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectPhoto = async () => {
    try {
      setIsProcessing(true);
      const photoUri = await pickImageFromGallery();
      
      if (photoUri) {
        // Generate new avatar
        await generateNewAvatar(photoUri);
      }
    } catch (error) {
      console.error('Failed to select photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      setIsProcessing(true);
      const photoUri = await takePhoto();
      
      if (photoUri) {
        // Generate new avatar
        await generateNewAvatar(photoUri);
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateNewAvatar = async (photoUri: string) => {
    try {
      setIsProcessing(true);
      
      // Update the character avatar
      const updatedCharacter = await updateCharacterAvatar(
        profile.id,
        currentAvatarType,
        photoUri
      );
      
      // Convert character back to profile format
      const updatedProfile: ChildProfile = {
        ...profile,
        avatars: updatedCharacter.avatars,
        avatarUrl: updatedCharacter.avatarUrl || profile.avatarUrl,
        updatedAt: new Date()
      };
      
      onProfileUpdate?.(updatedProfile);
      
      Alert.alert('Success', 'Avatar updated successfully!');
    } catch (error) {
      console.error('Failed to generate avatar:', error);
      Alert.alert('Error', 'Failed to generate avatar. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegenerateAvatar = async () => {
    const currentAvatarUrl = getCurrentAvatarUrl();
    if (!currentAvatarUrl) {
      Alert.alert('Error', 'No avatar found to regenerate');
      return;
    }

    Alert.alert(
      'Regenerate Avatar',
      'This will create a new avatar based on the current image. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Regenerate', 
          onPress: () => generateNewAvatar(currentAvatarUrl) 
        }
      ]
    );
  };

  const handleDeleteAvatar = () => {
    const avatarExists = currentAvatarType === 'real' 
      ? profile.avatars?.real 
      : profile.avatars?.animated;

    if (!avatarExists) {
      Alert.alert('Error', 'No avatar found to delete');
      return;
    }

    Alert.alert(
      'Delete Avatar',
      `Are you sure you want to delete the ${currentAvatarType} avatar? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);
              
              // Create updated avatars object without the deleted type
              const updatedAvatars = { ...(profile.avatars || {}) };
              delete updatedAvatars[currentAvatarType];
              
              // Update character with null/empty URL to remove the avatar
              await updateCharacterAvatar(profile.id, currentAvatarType, '');
              
              const updatedProfile: ChildProfile = {
                ...profile,
                avatars: updatedAvatars,
                updatedAt: new Date()
              };
              
              onProfileUpdate?.(updatedProfile);
              
              Alert.alert('Success', 'Avatar deleted successfully');
            } catch (error) {
              console.error('Failed to delete avatar:', error);
              Alert.alert('Error', 'Failed to delete avatar. Please try again.');
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  const currentAvatarUrl = getCurrentAvatarUrl();
  const hasCurrentAvatar = currentAvatarType === 'real' 
    ? profile.avatars?.real 
    : profile.avatars?.animated;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20
      }}>
        <View style={{
          width: '100%',
          maxWidth: 400,
          backgroundColor: tokens.color.surface,
          borderRadius: tokens.radius.lg
        }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: padding.lg,
          paddingTop: padding.xl,
          paddingBottom: padding.md,
          borderBottomWidth: 1,
          borderBottomColor: tokens.color.border.default
        }}>
          <Text size="h2" weight="bold">
            Manage Avatar
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons 
              name="close" 
              size={24} 
              color={tokens.color.text.primary} 
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={{
          paddingHorizontal: padding.lg,
          paddingTop: padding.md,
          paddingBottom: padding.lg
        }}>
          {/* Avatar Preview */}
          <View style={{
            alignItems: 'center',
            marginBottom: tokens.spacing.gap.lg
          }}>
            <View style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: tokens.color.bg.muted,
              borderWidth: 2,
              borderColor: tokens.color.border.default,
              marginBottom: tokens.spacing.gap.sm,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {currentAvatarUrl ? (
                <Image 
                  source={{ uri: currentAvatarUrl }}
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons 
                    name="camera-outline" 
                    size={40} 
                    color={tokens.color.text.secondary} 
                  />
                  <Text size="xs" color="secondary" style={{ marginTop: 4, textAlign: 'center' }}>
                    Add
                  </Text>
                </View>
              )}
            </View>
            <Text size="lg" weight="medium">
              {profile.childName || profile.name}
            </Text>
            
            {/* Avatar Type Toggle */}
            <View style={{
              flexDirection: 'row',
              marginTop: tokens.spacing.gap.sm,
              backgroundColor: tokens.color.bg.muted,
              borderRadius: tokens.radius.lg,
              padding: 4
            }}>
              <TouchableOpacity
                onPress={() => setCurrentAvatarType('animated')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: tokens.radius.md,
                  backgroundColor: currentAvatarType === 'animated' ? tokens.color.primary.default : 'transparent',
                  alignItems: 'center'
                }}
              >
                <Text
                  size="sm"
                  weight="medium"
                  style={{
                    color: currentAvatarType === 'animated' ? 'white' : tokens.color.text.secondary
                  }}
                >
                  Animated
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setCurrentAvatarType('real')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: tokens.radius.md,
                  backgroundColor: currentAvatarType === 'real' ? tokens.color.primary.default : 'transparent',
                  alignItems: 'center'
                }}
              >
                <Text
                  size="sm"
                  weight="medium"
                  style={{
                    color: currentAvatarType === 'real' ? 'white' : tokens.color.text.secondary
                  }}
                >
                  Real-Life
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Actions */}
          <View style={{ gap: tokens.spacing.gap.md }}>
            {/* Rename */}
            {isRenaming ? (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: tokens.spacing.gap.sm
              }}>
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: tokens.color.border.default,
                    borderRadius: tokens.radius.md,
                    paddingHorizontal: padding.md,
                    paddingVertical: padding.sm,
                    fontSize: 16,
                    color: tokens.color.text.primary
                  }}
                  placeholder="Enter new name"
                />
                <TouchableOpacity
                  onPress={handleRename}
                  disabled={isProcessing}
                  style={{
                    backgroundColor: tokens.color.primary.default,
                    paddingHorizontal: padding.md,
                    paddingVertical: padding.sm,
                    borderRadius: tokens.radius.md
                  }}
                >
                  <Text color="white" weight="medium">Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setIsRenaming(false);
                    setNewName(profile.childName);
                  }}
                  style={{
                    paddingHorizontal: padding.md,
                    paddingVertical: padding.sm
                  }}
                >
                  <Text color="secondary">Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setIsRenaming(true)}
                disabled={isProcessing}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: padding.md,
                  backgroundColor: 'white',
                  borderRadius: tokens.radius.md,
                  borderWidth: 1,
                  borderColor: tokens.color.border.default
                }}
              >
                <Ionicons 
                  name="pencil" 
                  size={20} 
                  color={tokens.color.primary.default} 
                  style={{ marginRight: tokens.spacing.gap.sm }} 
                />
                <Text weight="medium">Rename</Text>
              </TouchableOpacity>
            )}

            {/* Select New Photo */}
            <TouchableOpacity
              onPress={handleSelectPhoto}
              disabled={isProcessing}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: padding.md,
                backgroundColor: 'white',
                borderRadius: tokens.radius.md,
                borderWidth: 1,
                borderColor: tokens.color.border.default
              }}
            >
              <Ionicons 
                name="image" 
                size={20} 
                color={tokens.color.primary.default} 
                style={{ marginRight: tokens.spacing.gap.sm }} 
              />
              <Text weight="medium">Select New Photo</Text>
            </TouchableOpacity>

            {/* Take Photo */}
            <TouchableOpacity
              onPress={handleTakePhoto}
              disabled={isProcessing}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: padding.md,
                backgroundColor: 'white',
                borderRadius: tokens.radius.md,
                borderWidth: 1,
                borderColor: tokens.color.border.default
              }}
            >
              <Ionicons 
                name="camera" 
                size={20} 
                color={tokens.color.primary.default} 
                style={{ marginRight: tokens.spacing.gap.sm }} 
              />
              <Text weight="medium">Take Photo</Text>
            </TouchableOpacity>

            {/* Delete Current Photo (only if current avatar exists) */}
            {hasCurrentAvatar && (
              <TouchableOpacity
                onPress={handleDeleteAvatar}
                disabled={isProcessing}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: padding.md,
                  backgroundColor: 'white',
                  borderRadius: tokens.radius.md,
                  borderWidth: 1,
                  borderColor: errorColor
                }}
              >
                <Ionicons 
                  name="trash" 
                  size={20} 
                  color={errorColor} 
                  style={{ marginRight: tokens.spacing.gap.sm }} 
                />
                <Text weight="medium" style={{ color: errorColor }}>
                  Delete Current Photo
                </Text>
              </TouchableOpacity>
            )}

            {/* Regenerate (only if current avatar exists) */}
            {hasCurrentAvatar && (
              <TouchableOpacity
                onPress={handleRegenerateAvatar}
                disabled={isProcessing}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: padding.md,
                  backgroundColor: 'white',
                  borderRadius: tokens.radius.md,
                  borderWidth: 1,
                  borderColor: tokens.color.border.default
                }}
              >
                <Ionicons 
                  name="refresh" 
                  size={20} 
                  color={tokens.color.primary.default} 
                  style={{ marginRight: tokens.spacing.gap.sm }} 
                />
                <Text weight="medium">Regenerate Avatar</Text>
              </TouchableOpacity>
            )}

          </View>
        </View>

          {/* Loading Overlay */}
          {isProcessing && (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <View style={{
                backgroundColor: 'white',
                padding: padding.lg,
                borderRadius: tokens.radius.lg,
                alignItems: 'center'
              }}>
                <ActivityIndicator size="large" color={tokens.color.primary.default} />
                <Text style={{ marginTop: tokens.spacing.gap.sm }}>
                  Processing...
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default AvatarManagementModal;