import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView,
  Image,
  Button,
  ImageBackground, // <-- ADDED ImageBackground
} from 'react-native';

// Hard-defined Colors
const Colors = {
    primary: '#FFD700',      // Bright yellow (Logo color)
    secondary: '#007AFF',    // Standard blue
    background: '#F8F8F8',   // Light gray/off-white background
    surface: '#FFFFFF',      // White surface for cards/containers
    text: '#2C3E50',         // Dark text
    textSecondary: '#7F8C8D',// Muted text
    border: '#BDC3C7',       // Light border color
    error: '#E74C3C',        // Red for errors
};

const { height } = Dimensions.get('window');

// ✅ FIXED ASSET PATHS
const DORMIE_LOGO = require('../assets/Dormie.png'); 
const BACKGROUND_IMAGE = require('../assets/background.png'); // <-- NEW BACKGROUND IMAGE PATH

type IconProps = {
    name: 'User' | 'Lock';
    color?: string;
};

const Icon = ({ name, color = Colors.textSecondary }: IconProps) => {
    let symbol = '';
    if (name === 'User') symbol = '👤';
    if (name === 'Lock') symbol = '🔒';
    
    return <Text style={{ color, fontSize: 18, marginRight: 10 }}>{symbol}</Text>;
};

export default function LoginScreen() {
  const router = useRouter(); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = () => {
    if (email.trim() === '' || password.trim() === '') {
      setError('Email and password are required.');
      return;
    }
    setError('');
    
    const action = isSignUp ? 'Creating account' : 'Logging in';
    console.log(`${action} for: ${email}`);
    
    setTimeout(() => {
        // Successful simulation—NAVIGATES AWAY
        router.replace('/(tabs)/index'); 
    }, 1000);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* 🖼️ WRAP THE ENTIRE SCREEN IN ImageBackground */}
      <ImageBackground
          source={BACKGROUND_IMAGE}
          style={styles.backgroundImage}
          resizeMode="cover"
      >
        {/* 🌑 OVERLAY: Added a translucent layer for text readability */}
        <View style={styles.overlay} /> 

        <KeyboardAvoidingView 
          style={styles.keyboardContainer} // New style applied here
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.content}>
              
              {/* LOGO */}
              <Image
                source={DORMIE_LOGO}
                style={styles.logo}
                resizeMode="contain"
              />

              {/* TITLE */}
              <Text style={styles.title}>{isSignUp ? "Create Account" : "Log In"}</Text>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                  <Icon name="User" />
                  <TextInput
                      placeholder="Email"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      style={styles.input}
                      placeholderTextColor={Colors.textSecondary}
                  />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                  <Icon name="Lock" />
                  <TextInput
                      placeholder="Password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      style={styles.input}
                      placeholderTextColor={Colors.textSecondary}
                  />
              </View>
              
              {/* Button */}
              <View style={styles.buttonWrapper}>
                  <Button 
                      title={isSignUp ? "Create Account" : "Login"} 
                      onPress={handleAuth} 
                      color={Colors.primary} 
                  />
              </View>

              {/* Toggle Link */}
              <Text 
                  onPress={() => {
                      setIsSignUp(!isSignUp);
                      setError('');
                  }} 
                  style={styles.toggleLinkText}
              >
                  {isSignUp ? "Already have an account? Log in" : "No account? Sign up"}
              </Text>
              
              {/* Error Message */}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}

            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </>
  );
}

// --- Stylesheet ---

const styles = StyleSheet.create({
  // New full-screen styles for the background
  backgroundImage: {
    flex: 1,
    // We set the background color of the image container to the text color
    // so the overlay darkens the background image and helps text contrast.
    backgroundColor: Colors.text, 
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0)', // Dark overlay for contrast
  },
  keyboardContainer: {
    flex: 1, // Must have flex: 1 to fill the ImageBackground
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
    padding: 20,
    // Change background of content to transparent so the background image shows through
    backgroundColor: 'transparent', 
  },
  logo: {
    width: 250,
    height: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.surface, // Text is now white for contrast against the dark overlay
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface, // Input containers remain white/light gray
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    width: '100%',
    height: 55,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: Colors.text, // Input text remains dark for readability
  },
  buttonWrapper: {
      width: '100%',
      marginTop: 10,
      borderRadius: 12,
      overflow: 'hidden',
  },
  toggleLinkText: {
    color: Colors.secondary, // Uses the blue link color
    marginTop: 10, 
    fontSize: 14,
    fontWeight: '600' as const,
  },
  errorText: {
    color: Colors.error,
    marginTop: 10,
    fontSize: 14,
    fontWeight: '500' as const,
    textAlign: 'center',
  }
});