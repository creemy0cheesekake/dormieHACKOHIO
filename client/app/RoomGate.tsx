import { useState } from "react";
import { TextInput, Button, Text, Alert, StyleSheet, View, SafeAreaView, Image, KeyboardAvoidingView, Platform, Dimensions, TouchableOpacity, ImageBackground } from "react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, Stack } from "expo-router";
// --- Firebase Imports (Keeping original structure) ---
import { auth, db } from "../firebaseConfig";
import { collection, addDoc, updateDoc, query, where, getDocs } from "firebase/firestore";

// Hard-defined Colors (Matching LoginScreen)
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

// Assuming the component is in /app, and assets are in /assets
const DORMIE_LOGO = require('../assets/Dormie.png'); 
const BACKGROUND_IMAGE = require('../assets/background.png'); 

// Placeholder Icons (Matching LoginScreen)
const Icon = ({ name, color = Colors.textSecondary }) => {
    let symbol = '';
    if (name === 'House') symbol = '🏠';
    if (name === 'Key') symbol = '🔑';
    if (name === 'Sparkles') symbol = '✨';
    
    return <Text style={{ color, fontSize: 18, marginRight: 10 }}>{symbol}</Text>;
};

// --- START: Core Logic Functions (DO NOT CHANGE) ---

function generateRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateRoomId() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let id = "";
    for (let i = 0; i < 8; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

// --- END: Core Logic Functions ---


export default function RoomGate() {
    const [roomName, setRoomName] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    // State for background visual consistency
    const [backgroundVividness, setBackgroundVividness] = useState(0.8); 
    const dimmingOverlayOpacity = 1.2 - backgroundVividness;

    // --- START: Handler Logic (DO NOT CHANGE) ---

    const handleCreate = async () => {
        if (!roomName.trim()) {
            setError("Room name cannot be empty.");
            return;
        }
        setError("");
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Location permission denied", "Dormie requires location to set up the room.");
                return;
            }
            const loc = await Location.getCurrentPositionAsync({});
            const code = generateRoomCode();
            const customId = generateRoomId();

            const docRef = await addDoc(collection(db, "rooms"), {
                roomId: customId,
                name: roomName,
                code,
                creatorId: auth.currentUser.uid,
                location: {
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                },
                members: [auth.currentUser.uid],
            });

            await AsyncStorage.setItem("roomId", docRef.id);
            router.replace("/(tabs)");
        } catch (e) {
            console.error("Create Room Error:", e);
            setError("Failed to create room.");
        }
    };

    const handleJoin = async () => {
        if (!joinCode.trim() || joinCode.length !== 6) {
            setError("Please enter a valid 6-digit code.");
            return;
        }
        setError("");
        try {
            const q = query(collection(db, "rooms"), where("code", "==", joinCode));
            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                setError("Invalid code.");
                return;
            }
            const roomRef = snapshot.docs[0].ref;
            const data = snapshot.docs[0].data();

            if (!data.members.includes(auth.currentUser.uid)) {
                await updateDoc(roomRef, {
                    members: [...data.members, auth.currentUser.uid],
                });
            }

            await AsyncStorage.setItem("roomId", roomRef.id);
            router.replace("/(tabs)");
        } catch (e) {
            console.error("Join Room Error:", e);
            setError("Failed to join room.");
        }
    };

    // --- END: Handler Logic ---

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            
            {/* 🖼️ Full-screen Background */}
            <ImageBackground
                source={BACKGROUND_IMAGE}
                style={styles.backgroundImage}
                resizeMode="cover"
                imageStyle={{ opacity: backgroundVividness }}
            >
                {/* 🌑 Dimming Overlay */}
                <View style={[styles.overlay, { backgroundColor: `rgba(0,0,0,${dimmingOverlayOpacity * 0.4})` }]} /> 

                <KeyboardAvoidingView 
                    style={styles.keyboardContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <SafeAreaView style={styles.safeArea}>
                        <View style={styles.content}>
                            
                            {/* LOGO */}
                            <Image
                                source={DORMIE_LOGO}
                                style={[styles.logo, styles.saturatedLogo]}
                                resizeMode="contain"
                            />

                            <Text style={styles.headerTitle}>Find Your Dormie Room</Text>

                            {/* --- CREATE ROOM CARD --- */}
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>✨ Create a New Room</Text>
                                <View style={styles.inputContainer}>
                                    <Icon name="House" />
                                    <TextInput
                                        value={roomName}
                                        onChangeText={setRoomName}
                                        placeholder="Room name (e.g., The Yellow House)"
                                        style={styles.input}
                                        placeholderTextColor={Colors.textSecondary}
                                    />
                                </View>
                                {/* Button: Styling the default Button with the primary color */}
                                <View style={styles.buttonWrapper}>
                                    <Button title="Create" onPress={handleCreate} color={Colors.primary} />
                                </View>
                            </View>

                            {/* --- JOIN ROOM CARD --- */}
                            <View style={styles.card}>
                                <Text style={styles.cardTitle}>🔑 Join with a Code</Text>
                                <View style={styles.inputContainer}>
                                    <Icon name="Key" />
                                    <TextInput
                                        value={joinCode}
                                        onChangeText={setJoinCode}
                                        placeholder="Enter 6-digit room code"
                                        keyboardType="numeric"
                                        maxLength={6}
                                        style={styles.input}
                                        placeholderTextColor={Colors.textSecondary}
                                    />
                                </View>
                                {/* Button: Styling the default Button with the secondary color */}
                                <View style={styles.buttonWrapper}>
                                    <Button title="Join" onPress={handleJoin} color={Colors.secondary} />
                                </View>
                            </View>

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
    // Background and General Containers (Matching LoginScreen)
    backgroundImage: {
        flex: 1,
        backgroundColor: Colors.text, 
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        // Opacity handled inline
    },
    keyboardContainer: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        paddingHorizontal: 24,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 40,
        backgroundColor: 'transparent',
        gap: 20, // Spacing between the logo, cards, and error
    },
    
    // Logo and Header (Matching LoginScreen)
    logo: {
        width: 200, // Slightly smaller logo for more screen space
        height: 50,
        marginBottom: 20,
    },
    saturatedLogo: {
        tintColor: '#FFEB3B',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700' as const,
        color: Colors.surface, // White text for contrast
        marginBottom: 10,
    },
    
    // Cards for Join/Create
    card: {
        width: '100%',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        marginBottom: 10,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600' as const,
        color: Colors.text,
        marginBottom: 15,
    },
    
    // Input Fields (Matching LoginScreen)
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background, // Use background for input surface
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 10,
        width: '100%',
        height: 55,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 15,
        color: Colors.text,
    },
    
    // Button (Matching LoginScreen style via wrapper)
    buttonWrapper: {
        width: '100%',
        marginTop: 10,
        borderRadius: 12,
        overflow: 'hidden',
    },

    // Error Message
    errorText: {
        color: Colors.error,
        marginTop: 10,
        fontSize: 14,
        fontWeight: '500' as const,
        textAlign: 'center',
        backgroundColor: Colors.surface + 'CC', // Semi-transparent white background for readability over image
        padding: 8,
        borderRadius: 8,
    },
});