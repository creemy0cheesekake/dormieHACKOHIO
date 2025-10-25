import { useState } from "react";
import { TextInput, Button, Text, Alert } from "react-native";
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
		<SafeAreaView style={{ padding: 20, gap: 16 }}>
			<Text>Create Room</Text>
			<TextInput
				value={roomName}
				onChangeText={setRoomName}
				placeholder="Room name"
				style={{ borderWidth: 1, padding: 8 }}
			/>
			<Button title="Create" onPress={handleCreate} />

			<Text>Join Room</Text>
			<TextInput
				value={joinCode}
				onChangeText={setJoinCode}
				placeholder="6-digit code"
				style={{ borderWidth: 1, padding: 8 }}
			/>
			<Button title="Join" onPress={handleJoin} />

			{error ? <Text style={{ color: "red" }}>{error}</Text> : null}
		</SafeAreaView>
	);
}
