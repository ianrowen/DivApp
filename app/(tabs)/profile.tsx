// app/(tabs)/profile.tsx
import React from 'react';
import ProfileScreenComponent from '../../src/screens/ProfileScreen';

// ProfileScreen uses navigation prop but doesn't actually call it
// We'll pass a mock navigation object
const mockNavigation = {
  navigate: () => {},
  goBack: () => {},
} as any;

export default function ProfileScreen() {
  return <ProfileScreenComponent navigation={mockNavigation} />;
}

