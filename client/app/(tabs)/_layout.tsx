import { Tabs, useRouter } from "expo-router";
import { CustomTabBar } from "../../components";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Modal } from "react-native";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export default function TabLayout() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [mediatorModalVisible, setMediatorModalVisible] = useState(false);

	useEffect(() => {
		const checkStoredUser = async () => {
			try {
				const storedUser = await AsyncStorage.getItem("user");
				if (storedUser) {
					// User session found, skip login
					setLoading(false);
					return;
				}
			} catch (error) {
				console.error("Error checking storage:", error);
			}
			setLoading(false);
		};

		checkStoredUser();

		const unsub = onAuthStateChanged(auth, async user => {
			if (!user) {
				router.replace("/Login");
				return;
			}

			let roomId = await AsyncStorage.getItem("roomId");

			if (roomId) {
				// verify stored room still valid
				const ref = doc(db, "rooms", roomId);
				const snap = await getDoc(ref);
				if (!snap.exists() || !snap.data().members.includes(user.uid)) {
					await AsyncStorage.removeItem("roomId");
					roomId = null;
				}
			}

			// if no valid stored room, check if user belongs to any room
			if (!roomId) {
				const q = query(collection(db, "rooms"), where("members", "array-contains", user.uid));
				const result = await getDocs(q);
				if (!result.empty) {
					const docSnap = result.docs[0];
					await AsyncStorage.setItem("roomId", docSnap.id);
				} else {
					router.replace("/RoomGate");
					return;
				}
			}

			setLoading(false);
		});

		return unsub;
	}, []);

	if (loading) return null;

	return (
		<Tabs tabBar={props => <CustomTabBar {...props} />}>
			<Tabs.Screen name="index" options={{ title: "home", headerShown: false }} />
			<Tabs.Screen name="map" options={{ title: "map", headerShown: false }} />
			<Tabs.Screen name="social" options={{ title: "social", headerShown: false }} />
			<Tabs.Screen name="aiMediator" options={{ title: "aiMediator", headerShown: false }} />
			<Tabs.Screen name="todo" options={{ title: "todos", headerShown: false }} />
		</Tabs>
	);
}
