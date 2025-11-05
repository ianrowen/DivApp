// src/features/auth/screens/LoginScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase, supabaseHelpers } from '../../../core/api/supabase';

// CRITICAL: Must be registered in app.json under "scheme"
// Used to tell the web browser how to redirect back to your app
const REDIRECT_URL = 'com.divin8.app://supabase-auth'; 

// IMPORTANT: This tells Expo Auth Session to not close the browser immediately
// and wait for the redirect.
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [oauthLoading, setOAuthLoading] = React.useState(false);

  // --- Email/Password Handlers ---

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await supabaseHelpers.signInWithEmail(email, password);
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Could not sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      await supabaseHelpers.signUpWithEmail(email, password);
      Alert.alert("Check Email", "Please check your inbox to confirm your account!");
    } catch (error: any) {
      Alert.alert("Sign Up Failed", error.message || "Could not sign up.");
    } finally {
      setLoading(false);
    }
  };

  // --- Google OAuth Handler (New) ---
  
  const handleGoogleSignIn = async () => {
    setOAuthLoading(true);
    try {
      // The redirectTo URL must exactly match one of your Supabase Callback URLs
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: REDIRECT_URL,
          // You can also add scopes like 'email', 'profile'
        },
      });

      if (error) {
        Alert.alert("Google Login Error", error.message);
      }
      // Success is handled by the onAuthStateChange listener in App.tsx
      
    } catch (e: any) {
      Alert.alert("OAuth Error", e.message || "An unknown error occurred during Google sign-in.");
    } finally {
      // This finally block might run before the browser closes,
      // but we set it back to false just in case.
      setOAuthLoading(false); 
    }
  };

  const isDisabled = loading || oauthLoading;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Divin8</Text>
      <Text style={styles.subtitle}>Sign in or create an account</Text>

      {/* Email/Password Fields */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!isDisabled}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        editable={!isDisabled}
      />
      
      {/* Sign In Button */}
      <TouchableOpacity 
        style={[styles.button, styles.primaryButton]} 
        onPress={handleSignIn} 
        disabled={isDisabled}
      >
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Sign In</Text>}
      </TouchableOpacity>

      {/* Sign Up Button */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleSignUp} 
        disabled={isDisabled}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      
      {/* Divider */}
      <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.line} />
      </View>
// ... Find the Google Button's TouchableOpacity
      {/* Google Button */}
      <TouchableOpacity 
        style={[styles.button, styles.googleButton]} 
        onPress={handleGoogleSignIn} 
        disabled={false} // <--- TEMPORARY CHANGE: Set to FALSE
      >
        {oauthLoading ? (
            <ActivityIndicator color="#4F46E5" />
        ) : (
            <Text style={[styles.buttonText, { color: '#4F46E5' }]}>
                Sign In with Google
            </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.link}>Forgot Password?</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  button: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: '#4F46E5', // Indigo for Sign In
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  link: {
    marginTop: 10,
    color: '#4F46E5',
    fontSize: 14,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  dividerText: {
    width: 50,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
  }
});