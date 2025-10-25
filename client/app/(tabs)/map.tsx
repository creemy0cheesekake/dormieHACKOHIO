import Constants, { ExecutionEnvironment } from "expo-constants";
import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapLibreGL from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../../firebaseConfig";
import { doc, getDoc, collection, query, where, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";

export default function MapScreen() {
	const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
	const [dormLoc, setDormLoc] = useState<[number, number] | null>(null);
	const [members, setMembers] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const isRunningInExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

	// Fetch dorm location once
	useEffect(() => {
		const fetchDormLocation = async () => {
			try {
				const roomId = await AsyncStorage.getItem("roomId");
				if (!roomId) return;

				const snap = await getDoc(doc(db, "rooms", roomId));
				if (snap.exists()) {
					const data = snap.data();
					if (data.location) {
						setDormLoc([data.location.longitude, data.location.latitude]);
					}
				}
			} catch (err) {
				console.error(err);
			} finally {
				setLoading(false);
			}
		};
		fetchDormLocation();
	}, []);

	// Update user location every 30 s
	useEffect(() => {
		if (!dormLoc) return;
		let watcher: Location.LocationSubscription;
		let lastUpdate = 0;

		(async () => {
			const storedUser = await AsyncStorage.getItem("user");
			const parsed = storedUser ? JSON.parse(storedUser) : null;
			if (!parsed) return;

			const roomId = await AsyncStorage.getItem("roomId");
			if (!roomId) return;

			const { status } = await Location.requestForegroundPermissionsAsync();
			if (status !== "granted") return;

			watcher = await Location.watchPositionAsync(
				{ accuracy: Location.Accuracy.High, distanceInterval: 5 },
				async pos => {
					const now = Date.now();
					if (now - lastUpdate < 30000) return;
					lastUpdate = now;

					const { latitude, longitude } = pos.coords;
					setUserLoc([longitude, latitude]);

					const distance = getDistanceMeters(
						{ latitude, longitude },
						{ latitude: dormLoc[1], longitude: dormLoc[0] },
					);

					const userRef = doc(db, "users", parsed.uid);
					const payload: any = {
						latitude,
						longitude,
						inRange: distance <= 76.2, // 250 ft
						lastUpdated: serverTimestamp(),
						roomId,
					};
					if (parsed.name) payload.name = parsed.name;

					await setDoc(userRef, payload, { merge: true });
				},
			);
		})();

		return () => {
			if (watcher) watcher.remove();
		};
	}, [dormLoc]);

	// Real-time member listener
	useEffect(() => {
		let unsub: (() => void) | undefined;

		(async () => {
			const roomId = await AsyncStorage.getItem("roomId");
			if (!roomId) return;

			const roomSnap = await getDoc(doc(db, "rooms", roomId));
			if (!roomSnap.exists()) return;
			const memberIds: string[] = roomSnap.data().members || [];
			if (memberIds.length === 0) return;

			const chunks: string[][] = [];
			for (let i = 0; i < memberIds.length; i += 10) {
				chunks.push(memberIds.slice(i, i + 10));
			}

			const allUnsubs: (() => void)[] = [];
			const allMembers: any[] = [];

			chunks.forEach(chunk => {
				const q = query(collection(db, "users"), where("__name__", "in", chunk));
				const sub = onSnapshot(q, snap => {
					const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
					// Replace existing chunk entries
					for (const m of list) {
						const idx = allMembers.findIndex(x => x.id === m.id);
						if (idx >= 0) allMembers[idx] = m;
						else allMembers.push(m);
					}
					setMembers([...allMembers]);
				});
				allUnsubs.push(sub);
			});

			unsub = () => allUnsubs.forEach(fn => fn());
		})();

		return () => {
			if (unsub) unsub();
		};
	}, []);

	if (isRunningInExpoGo) return <Text style={{ paddingTop: 200 }}>Can't load the map in Expo Go</Text>;
	if (loading) return <Text>Loading map...</Text>;
	if (!userLoc || !dormLoc) return <Text>Unable to load both locations</Text>;

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<MapLibreGL.MapView
				style={{ flex: 1 }}
				mapStyle={`https://api.maptiler.com/maps/basic-v2/style.json?key=${Constants.expoConfig.extra.apiUrl}`}
			>
				<MapLibreGL.Camera centerCoordinate={userLoc} zoomLevel={14} />

				{/* members */}
				{members.map(m => (
					<MapLibreGL.PointAnnotation key={m.id} id={m.id} coordinate={[m.longitude, m.latitude + 0.0005]}>
						<View style={{ alignItems: "center" }}>
							<Text
								style={{
									fontSize: 10,
									color: "black",
									backgroundColor: "white",
									paddingHorizontal: 4,
									paddingVertical: 1,
									borderRadius: 4,
									textAlign: "center",
									marginTop: 8,
								}}
								numberOfLines={1}
							>
								{m.Name || "Unknown"}
							</Text>
						</View>
					</MapLibreGL.PointAnnotation>
				))}
				{members.map(m => (
					<MapLibreGL.PointAnnotation key={m.id} id={m.id} coordinate={[m.longitude, m.latitude]}>
						<View style={{ alignItems: "center" }}>
							<View
								style={{
									width: 14,
									height: 14,
									borderRadius: 7,
									backgroundColor: m.inRange ? "green" : "orange",
									borderWidth: 2,
									borderColor: "white",
								}}
							/>
						</View>
					</MapLibreGL.PointAnnotation>
				))}

				{/* Dorm marker */}
				<MapLibreGL.PointAnnotation id="dorm" coordinate={dormLoc}>
					<View
						style={{
							width: 32,
							height: 32,
							borderRadius: 7,
							backgroundColor: "red",
							borderWidth: 2,
							borderColor: "white",
						}}
					/>
				</MapLibreGL.PointAnnotation>
			</MapLibreGL.MapView>
		</SafeAreaView>
	);
}

// --- utility ---
function getDistanceMeters(a: any, b: any) {
	const R = 6371000;
	const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
	const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
	const lat1 = (a.latitude * Math.PI) / 180;
	const lat2 = (b.latitude * Math.PI) / 180;
	const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
	return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
