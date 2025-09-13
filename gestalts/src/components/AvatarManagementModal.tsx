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
import { useMemoriesStore } from '../state/useStore';
import { useAuth } from '../contexts/AuthContext';

interface AvatarManagementModalProps {
  visible: boolean;
  onClose: () => void;
  profile: ChildProfile | any; // Support both ChildProfile and Character
  onProfileUpdate?: (updatedProfile: ChildProfile | any) => void;
  isChildProfile?: boolean; // Flag to indicate if this is a child profile (not deletable)
}

export const AvatarManagementModal: React.FC<AvatarManagementModalProps> = ({
  visible,
  onClose,
  profile,
  onProfileUpdate,
  isChildProfile = false
}) => {
  const themeContext = useTheme();
  const { pickImageFromGallery, takePhoto, updateCharacterAvatar, updateCharacterName, updateCharacterMetadata, deleteCharacter, createCharacterFromPhoto } = useStorybookStore();
  const { createChildAvatar } = useMemoriesStore();
  const { getCurrentUserId } = useAuth();
  
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
  const currentAvatarType = 'animated'; // Always use animated
  
  // Character metadata editing (only for custom characters, not child profiles)
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [newRole, setNewRole] = useState<'Mum' | 'Dad' | 'Brother' | 'Sister' | 'Grandparent' | 'Friend'>(profile.role || 'Friend');
  const [newAge, setNewAge] = useState(profile.age || '');
  
  // Get current animated avatar URL
  const getCurrentAvatarUrl = () => {
    if (profile.avatars) {
      return profile.avatars.animated || profile.avatarUrl; // Fallback to legacy avatarUrl for animated
    }
    return profile.avatarUrl;
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

  const handleUpdateMetadata = async () => {
    try {
      setIsProcessing(true);
      
      // Update character metadata in Firebase
      await updateCharacterMetadata(profile.id, newRole, newAge.trim() || undefined);
      
      // Update the profile locally
      const updatedProfile = {
        ...profile,
        role: newRole,
        age: newAge.trim() || undefined,
        updatedAt: new Date()
      };
      
      onProfileUpdate?.(updatedProfile);
      setIsEditingMetadata(false);
      
      Alert.alert('Success', 'Character details updated successfully');
    } catch (error) {
      console.error('Failed to update character metadata:', error);
      Alert.alert('Error', 'Failed to update character details. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectPhoto = async () => {
    try {
      setIsProcessing(true);
      const photoUri = await pickImageFromGallery();
      
      if (photoUri) {
        // Process the photo through the avatar generation pipeline
        await processPhotoForAvatar(photoUri);
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
        // Process the photo through the avatar generation pipeline
        await processPhotoForAvatar(photoUri);
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processPhotoForAvatar = async (photoUri: string) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      if (isChildProfile) {
        // For child profiles, we need to use a different approach
        // The createChildAvatar expects a data URL, not a file URI
        // We need to generate the avatar through the character pipeline first
        
        // Create a temporary character to generate the avatar
        const tempCharacter = await createCharacterFromPhoto(
          photoUri,
          profile.childName || profile.name || 'Child',
          'animated',
          userId
        );

        // Now update the child profile with the generated avatar URL
        if (tempCharacter.avatars?.animated) {
          await createChildAvatar(
            profile.id,
            userId,
            tempCharacter.avatars.animated,
            'animated'
          );
        }

        // Update the local profile
        const updatedProfile = {
          ...profile,
          avatars: {
            ...(profile.avatars || {}),
            animated: tempCharacter.avatars?.animated
          },
          avatarUrl: tempCharacter.avatars?.animated || profile.avatarUrl,
          updatedAt: new Date()
        };
        
        onProfileUpdate?.(updatedProfile);
      } else {
        // For regular characters, use the existing flow
        // This will handle the Gemini generation internally
        const updatedCharacter = await updateCharacterAvatar(
          profile.id,
          'animated',
          photoUri,
          userId
        );
        
        // Convert character back to profile format
        const updatedProfile = {
          ...profile,
          avatars: updatedCharacter.avatars,
          avatarUrl: updatedCharacter.avatarUrl || profile.avatarUrl,
          updatedAt: new Date()
        };
        
        onProfileUpdate?.(updatedProfile);
      }
      
      Alert.alert('Success', 'Avatar updated successfully!');
    } catch (error) {
      console.error('Failed to generate avatar:', error);
      Alert.alert('Error', 'Failed to generate avatar. Please try again.');
    }
  };

  const generateNewAvatar = async (photoUri: string) => {
    // This is now just a wrapper for processPhotoForAvatar
    // Used by the regenerate function
    await processPhotoForAvatar(photoUri);
  };

  const handleRegenerateAvatar = async () => {
    const currentAvatarUrl = getCurrentAvatarUrl();
    if (!currentAvatarUrl) {
      Alert.alert('Error', 'No avatar found to regenerate');
      return;
    }

    Alert.alert(
      'Regenerate Avatar',
      'To regenerate the avatar, please take a new photo or select one from your gallery.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Take Photo', 
          onPress: async () => {
            const photoUri = await takePhoto();
            if (photoUri) {
              await processPhotoForAvatar(photoUri);
            }
          }
        },
        { 
          text: 'Choose from Gallery', 
          onPress: async () => {
            const photoUri = await pickImageFromGallery();
            if (photoUri) {
              await processPhotoForAvatar(photoUri);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAvatar = () => {
    const avatarExists = profile.avatars?.animated || profile.avatarUrl; // Check legacy field too

    if (!avatarExists) {
      Alert.alert('Error', 'No avatar found to delete');
      return;
    }

    Alert.alert(
      'Delete Avatar',
      `Are you sure you want to delete the animated avatar? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);

              // Create updated avatars object without the animated avatar
              const updatedAvatars = { ...(profile.avatars || {}) };
              delete updatedAvatars.animated;

              // Update character with null/empty URL to remove the avatar
              await updateCharacterAvatar(profile.id, 'animated', '');

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
  const hasCurrentAvatar = profile.avatars?.animated || profile.avatarUrl; // Check legacy field too

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

            {/* Edit Character Details - Only for custom characters (not child profiles) */}
            {!isChildProfile && (
              <>
                {isEditingMetadata ? (
                  <View style={{
                    padding: padding.md,
                    backgroundColor: 'white',
                    borderRadius: tokens.radius.md,
                    borderWidth: 1,
                    borderColor: tokens.color.border.default,
                    gap: tokens.spacing.gap.md
                  }}>
                    {/* Relationship Selection */}
                    <View>
                      <Text weight="semibold" style={{ marginBottom: 8 }}>Relationship</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {(['Mum', 'Dad', 'Brother', 'Sister', 'Grandparent', 'Friend'] as const).map((role) => (
                          <TouchableOpacity
                            key={role}
                            onPress={() => setNewRole(role)}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: tokens.radius.md,
                              borderWidth: 1,
                              borderColor: newRole === role ? tokens.color.primary.default : tokens.color.border.default,
                              backgroundColor: newRole === role ? "#F3E8FF" : 'transparent'
                            }}
                          >
                            <Text size="sm" style={{ 
                              color: newRole === role ? tokens.color.primary.default : tokens.color.text.primary,
                              textTransform: 'capitalize'
                            }}>
                              {role}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                    
                    {/* Age Input */}
                    <View>
                      <Text weight="semibold" style={{ marginBottom: 8 }}>Age</Text>
                      <TextInput
                        value={newAge}
                        onChangeText={setNewAge}
                        placeholder="Enter age (e.g., 35, 8 years old)"
                        style={{
                          borderWidth: 1,
                          borderColor: tokens.color.border.default,
                          borderRadius: tokens.radius.md,
                          paddingHorizontal: padding.md,
                          paddingVertical: padding.sm,
                          fontSize: 16,
                          color: tokens.color.text.primary
                        }}
                      />
                    </View>
                    
                    {/* Action Buttons */}
                    <View style={{
                      flexDirection: 'row',
                      gap: tokens.spacing.gap.sm,
                      justifyContent: 'flex-end'
                    }}>
                      <TouchableOpacity
                        onPress={() => {
                          setIsEditingMetadata(false);
                          setNewRole(profile.role || 'friend');
                          setNewAge(profile.age || '');
                        }}
                        style={{
                          paddingHorizontal: padding.md,
                          paddingVertical: padding.sm
                        }}
                      >
                        <Text color="secondary">Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleUpdateMetadata}
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
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setIsEditingMetadata(true)}
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
                      name="person" 
                      size={20} 
                      color={tokens.color.primary.default} 
                      style={{ marginRight: tokens.spacing.gap.sm }} 
                    />
                    <View style={{ flex: 1 }}>
                      <Text weight="medium">Edit Details</Text>
                      <Text size="sm" color="secondary">
                        {profile.role ? `${profile.role}${profile.age ? `, ${profile.age}` : ''}` : 'Add relationship and age'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </>
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

            {/* Action Buttons Row - Small icon buttons */}
            {(hasCurrentAvatar || !isChildProfile) && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: tokens.spacing.gap.md,
                marginTop: tokens.spacing.gap.lg,
                paddingTop: tokens.spacing.gap.md,
                borderTopWidth: 1,
                borderTopColor: tokens.color.border.default
              }}>
                {/* Regenerate Avatar - Far Left */}
                {hasCurrentAvatar && (
                  <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity
                      onPress={handleRegenerateAvatar}
                      disabled={isProcessing}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: tokens.color.bg.muted,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: tokens.color.border.default
                      }}
                    >
                      <Ionicons 
                        name="refresh" 
                        size={20} 
                        color={tokens.color.primary.default} 
                      />
                    </TouchableOpacity>
                    <Text size="xs" color="secondary" style={{ marginTop: 4 }}>
                      Regenerate
                    </Text>
                  </View>
                )}

                {/* Delete Current Avatar - No red badge */}
                {hasCurrentAvatar && (
                  <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity
                      onPress={handleDeleteAvatar}
                      disabled={isProcessing}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: tokens.color.bg.muted,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: tokens.color.border.default
                      }}
                    >
                      <Ionicons 
                        name="close-circle-outline" 
                        size={20} 
                        color={errorColor} 
                      />
                    </TouchableOpacity>
                    <Text size="xs" color="secondary" style={{ marginTop: 4 }}>
                      Remove
                    </Text>
                  </View>
                )}

                {/* Delete Character - Only show for non-child profiles */}
                {!isChildProfile && (
                  <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          'Delete Character',
                          `Are you sure you want to delete "${profile.childName || profile.name}"? This will remove the character and all associated avatars permanently.`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { 
                              text: 'Delete', 
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  setIsProcessing(true);
                                  await deleteCharacter(profile.id);
                                  onClose();
                                  Alert.alert('Success', 'Character deleted successfully');
                                } catch (error) {
                                  console.error('Failed to delete character:', error);
                                  Alert.alert('Error', 'Failed to delete character. Please try again.');
                                } finally {
                                  setIsProcessing(false);
                                }
                              }
                            }
                          ]
                        );
                      }}
                      disabled={isProcessing}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: tokens.color.bg.muted,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: errorColor
                      }}
                    >
                      <Ionicons 
                        name="trash-outline" 
                        size={20} 
                        color={errorColor} 
                      />
                    </TouchableOpacity>
                    <Text size="xs" style={{ color: errorColor, marginTop: 4 }}>
                      Delete
                    </Text>
                  </View>
                )}
              </View>
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