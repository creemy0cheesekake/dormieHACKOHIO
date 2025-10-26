import { useState } from "react";
import { TextInput, Button, View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { auth, db } from "../firebaseConfig";
import { collection, addDoc, doc, getDoc, updateDoc, query, where, getDocs } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

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

export default function RoomGate() {
	const [roomName, setRoomName] = useState("");
	const [joinCode, setJoinCode] = useState("");
	const [error, setError] = useState("");
	const router = useRouter();

	const handleCreate = async () => {
		try {
			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") {
				Alert.alert("Location permission denied");
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
			setError("Failed to create room");
		}
	};

	const handleJoin = async () => {
		try {
			const q = query(collection(db, "rooms"), where("code", "==", joinCode));
			const snapshot = await getDocs(q);
			if (snapshot.empty) {
				setError("Invalid code");
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
		} catch {
			setError("Failed to join room");
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				{/* Create Room Section */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>🏠 Create Room</Text>
					<TextInput
						value={roomName}
						onChangeText={setRoomName}
						placeholder="Enter room name..."
						placeholderTextColor="#FF9E80"
						style={styles.input}
					/>
					<TouchableOpacity style={[styles.btn, styles.createBtn]} onPress={handleCreate}>
						<Text style={styles.btnText}>✨ Create Room</Text>
					</TouchableOpacity>
				</View>

				{/* Join Room Section */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>🔗 Join Room</Text>
					<TextInput
						value={joinCode}
						onChangeText={setJoinCode}
						placeholder="Enter 6-digit code..."
						placeholderTextColor="#FF9E80"
						style={styles.input}
					/>
					<TouchableOpacity style={[styles.btn, styles.joinBtn]} onPress={handleJoin}>
						<Text style={styles.btnText}>🎯 Join Room</Text>
					</TouchableOpacity>
				</View>

				{error ? (
					<View style={styles.errorContainer}>
						<Text style={styles.errorText}>⚠️ {error}</Text>
					</View>
				) : null}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFF9C4",
	},
	scrollContent: {
		padding: 16,
		paddingBottom: 100,
	},
	section: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		padding: 20,
		marginBottom: 16,
		elevation: 3,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 6,
		borderWidth: 1,
		borderColor: "#E2E8F0",
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#D84315",
		marginBottom: 16,
		textAlign: "center",
	},
	input: {
		backgroundColor: "#FFF3E0",
		borderWidth: 2,
		borderColor: "#FFCCBC",
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		fontSize: 16,
		color: "#D84315",
		fontWeight: "500",
	},
	btn: {
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
		alignItems: "center",
		elevation: 2,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
	createBtn: {
		backgroundColor: "#FF9800",
	},
	joinBtn: {
		backgroundColor: "#4CAF50",
	},
	btnText: {
		color: "white",
		fontWeight: "bold",
		fontSize: 16,
	},
	errorContainer: {
		backgroundColor: "#FFEBEE",
		padding: 16,
		borderRadius: 12,
		borderLeftWidth: 4,
		borderLeftColor: "#EF5350",
		marginTop: 8,
	},
	errorText: {
		color: "#D32F2F",
		fontSize: 14,
		fontWeight: "500",
		textAlign: "center",
	},
});
