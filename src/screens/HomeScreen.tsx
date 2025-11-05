// src/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { supabaseHelpers } from '../core/api/supabase';

// This is the main screen after login
export default function HomeScreen() {
  const [loading, setLoading] = React.useState(false);
  
  const handleSignOut = async () => {
    setLoading(true);
    try {
      await supabaseHelpers.signOut();
      // App.tsx will detect the session change and navigate to LoginScreen
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back, Querent.</Text>
      <Text style={styles.subtitle}>Your journey awaits.</Text>
      
      {/* Quick Access Buttons to Divination Systems */}
      <View style={styles.buttonContainer}>
        <Button title="Start Tarot Reading" onPress={() => console.log('Navigate to Tarot')} color="#4F46E5" />
        <View style={{ height: 16 }} />
        <Button title="View Journal" onPress={() => console.log('Navigate to Journal')} color="#6B7280" />
      </View>

      <View style={styles.signOutContainer}>
        {loading ? (
          <ActivityIndicator size="small" color="#4F46E5" />
        ) : (
          <Button title="Sign Out" onPress={handleSignOut} color="#EF4444" />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 40,
  },
  signOutContainer: {
    position: 'absolute',
    bottom: 50,
    width: '80%',
  },
});