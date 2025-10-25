import { useEffect, useState } from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function Index() {
	const [room, setRoom] = useState(null);
	useEffect(() => {
		const loadRoom = async () => {
			const roomId = await AsyncStorage.getItem("roomId");
			if (!roomId) return;
			const snap = await getDoc(doc(db, "rooms", roomId));
			if (snap.exists()) {
				setRoom(snap.data());
			}
		};
		loadRoom();
	}, []);

	if (!room) return <Text>Loading room...</Text>;

	return (
		<SafeAreaView style={{ padding: 20 }}>
			<Text>Room Name: {room.name}</Text>
			<Text>Join Code: {room.code}</Text>
			<Text>Members:</Text>
			{room.members.map((uid: string) => (
				<Text key={uid}>{uid}</Text>
			))}
		</SafeAreaView>
	);
}
