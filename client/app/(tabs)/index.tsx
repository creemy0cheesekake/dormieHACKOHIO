import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../../firebaseConfig";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

export default function Index() {
	const [room, setRoom] = useState(null);
	const [assignedChores, setAssignedChores] = useState<string[]>([]);

	useEffect(() => {
		const loadRoomAndChores = async () => {
			const roomId = await AsyncStorage.getItem("roomId");
			const userStr = await AsyncStorage.getItem("user");
			const user = userStr ? JSON.parse(userStr) : null;
			if (!roomId || !user) return;

			const snap = await getDoc(doc(db, "rooms", roomId));
			if (!snap.exists()) return;
			const data = snap.data();
			setRoom(data);

			// Load chores and filter by assignee
			const choresSnap = await getDocs(collection(db, "rooms", roomId, "chores"));
			const chores = choresSnap.docs
				.map(d => ({ id: d.id, ...d.data() }))
				.filter(c => c.assignee === user.uid)
				.map(c => c.name);
			setAssignedChores(chores);
		};
		loadRoomAndChores();
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

			<View style={{ marginTop: 20 }}>
				<Text style={{ fontWeight: "bold" }}>Your Assigned Chores:</Text>
				{assignedChores.length > 0 ? (
					assignedChores.map((name, i) => <Text key={i}>• {name}</Text>)
				) : (
					<Text>None assigned</Text>
				)}
			</View>
		</SafeAreaView>
	);
}
