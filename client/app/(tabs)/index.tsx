import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View, TouchableOpacity, FlatList, Alert, StyleSheet, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	doc,
	onSnapshot,
	collection,
	onSnapshot as onColSnapshot,
	updateDoc,
	serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

function toDateString(ts: any) {
	if (!ts) return "never";
	if (ts.toDate && typeof ts.toDate === "function") return ts.toDate().toLocaleString();
	try {
		return new Date(ts).toLocaleString();
	} catch {
		return String(ts);
	}
}

function freqToMs(freq: string | undefined) {
	if (!freq) return 0;
	const f = freq.trim().toLowerCase();
	if (f === "daily") return 24 * 60 * 60 * 1000;
	if (f === "weekly") return 7 * 24 * 60 * 60 * 1000;
	if (f === "monthly") return 30 * 24 * 60 * 60 * 1000;
	return 0;
}

const mediatedUserId = "j3OvGR2ZJcOd8j4RUEN272eSN1w1";

export default function Index() {
	const router = useRouter();
	const [room, setRoom] = useState<any | null>(null);
	const [memberData, setMemberData] = useState<
		{ uid: string; Name?: string; inRange?: boolean; lastUpdated?: any }[]
	>([]);
	const [assignedChores, setAssignedChores] = useState<
		{ id: string; name: string; frequency: string; assignee?: string; lastDone?: any }[]
	>([]);
	const [user, setUser] = useState<{ uid: string } | null>(null);
	const [roomId, setRoomId] = useState<string | null>(null);
	// inside component, before return
	const myChores = user ? assignedChores.filter(c => c.assignee === user.uid) : [];
	const [mediatorModalVisible, setMediatorModalVisible] = useState(false);

	useEffect(() => {
		(async () => {
			const stored = await AsyncStorage.getItem("user");
			const storedRoom = await AsyncStorage.getItem("roomId");
			if (stored) {
				try {
					const parsed = JSON.parse(stored);
					setUser({ uid: parsed.uid });
				} catch {}
			}
			if (storedRoom) setRoomId(storedRoom);
		})();
		if (auth.currentUser.uid == mediatedUserId) {
			setMediatorModalVisible(true);
		}
	}, []);

	useEffect(() => {
		if (!roomId) return;
		let roomUnsub: (() => void) | null = null;
		const userUnsubs: Record<string, () => void> = {};
		let choresUnsub: (() => void) | null = null;

		// room listener to get member ids and basic room info
		roomUnsub = onSnapshot(doc(db, "rooms", roomId), snap => {
			if (!snap.exists()) {
				setRoom(null);
				return;
			}
			const data = snap.data();
			setRoom(data);

			// set up user listeners for members
			const memberIds: string[] = Array.isArray(data.members) ? data.members : [];
			// remove unsub for members no longer present
			Object.keys(userUnsubs).forEach(uid => {
				if (!memberIds.includes(uid)) {
					userUnsubs[uid]();
					delete userUnsubs[uid];
				}
			});

			// add listeners for new members
			memberIds.forEach(uid => {
				if (userUnsubs[uid]) return;
				const uRef = doc(db, "users", uid);
				userUnsubs[uid] = onSnapshot(uRef, uSnap => {
					const udata = uSnap.exists() ? uSnap.data() : null;
					setMemberData(prev => {
						const copy = [...prev.filter(p => p.uid !== uid)];
						copy.push({
							uid,
							Name: udata?.Name ?? udata?.name ?? "Unknown",
							inRange: !!udata?.inRange,
							lastUpdated: udata?.lastUpdated ?? null,
						});
						// keep stable order matching room.members if available
						if (memberIds.length) {
							return memberIds.map(id => copy.find(x => x.uid === id) || { uid: id, Name: "Unknown" });
						}
						return copy;
					});
				});
			});
		});

		// chores listener (real-time) under room
		const choresCol = collection(db, "rooms", roomId, "chores");
		choresUnsub = onColSnapshot(choresCol, snap => {
			const list = snap.docs.map(d => {
				const data = d.data() as any;
				return {
					id: d.id,
					name: data.name || "Unnamed",
					frequency: data.frequency || "",
					assignee: data.assignee,
					lastDone: data.lastDone ?? null,
				};
			});
			setAssignedChores(list);
		});

		return () => {
			if (roomUnsub) roomUnsub();
			if (choresUnsub) choresUnsub();
			Object.values(userUnsubs).forEach(fn => fn());
		};
	}, [roomId]);

	// helper: is chore considered done now
	function isChoreCurrentlyDone(chore: any) {
		if (!chore.lastDone) return false;
		const freqMs = freqToMs(chore.frequency);
		if (!freqMs) return false;
		let lastMs = 0;
		if (chore.lastDone?.toDate && typeof chore.lastDone.toDate === "function")
			lastMs = chore.lastDone.toDate().getTime();
		else lastMs = new Date(chore.lastDone).getTime();
		return Date.now() - lastMs < freqMs;
	}

	// toggle done: if not done -> set lastDone to serverTimestamp, if done -> clear lastDone
	async function toggleChoreDone(choreId: string, currentlyDone: boolean) {
		if (!roomId) return;
		try {
			const choreRef = doc(db, "rooms", roomId, "chores", choreId);
			if (!currentlyDone) {
				await updateDoc(choreRef, { lastDone: serverTimestamp() });
			} else {
				// clear lastDone
				await updateDoc(choreRef, { lastDone: null });
			}
		} catch (err) {
			console.error("Error toggling chore done", err);
			Alert.alert("Error", "Failed to update chore status.");
		}
	}

	if (!room) return <Text>Loading room...</Text>;

	return (
		<SafeAreaView style={styles.container}>
			{/* Mediation Modal */}
			<Modal visible={mediatorModalVisible} animationType="slide" transparent={true}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>Arjun has asked you to join a mediation.</Text>

						{/* <TextInput */}
						{/* 	style={styles.modalInput} */}
						{/* 	value={mediatorPrompt} */}
						{/* 	onChangeText={setMediatorPrompt} */}
						{/* 	placeholder="Describe what you've been struggling with..." */}
						{/* 	multiline */}
						{/* 	numberOfLines={4} */}
						{/* /> */}

						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={[styles.modalButton, styles.cancelButton]}
								onPress={() => setMediatorModalVisible(false)}
							>
								<Text style={styles.modalButtonText}>Ignore</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={[styles.modalButton, styles.startButton]}
								onPress={() =>
									router.push({
										pathname: "/(tabs)/aiMediator",
										params: {
											aiMode: "mediator",
											mediationReceiver: true,
										},
									})
								}
							>
								<Text style={styles.modalButtonText}>Start Mediation</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Room Header */}
			<View style={styles.roomHeader}>
				<Text style={styles.roomName}>🏠 {room.name}</Text>
				<View style={styles.codeContainer}>
					<Text style={styles.codeLabel}>Join Code:</Text>
					<Text style={styles.codeValue}>{String(room.code)}</Text>
				</View>
			</View>

			{/* Roommates Section */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>👥 Roommates</Text>
				{memberData.map(m => (
					<View key={m.uid} style={styles.memberCard}>
						<View style={styles.memberHeader}>
							<Text style={styles.memberName}>{m.Name}</Text>
							<View style={[styles.statusIndicator, m.inRange ? styles.homeStatus : styles.awayStatus]}>
								<Text style={styles.statusText}>{m.inRange ? "🏠 Home" : "✈️ Away"}</Text>
							</View>
						</View>
						<Text style={styles.lastUpdated}>Last update: {toDateString(m.lastUpdated)}</Text>
					</View>
				))}
			</View>

			{/* Todo Section */}
			<View style={styles.section}>
				<Text style={styles.sectionTitle}>✅ Your Chores</Text>

				<FlatList
					data={user ? assignedChores.filter(c => c.assignee === user.uid) : []}
					keyExtractor={c => c.id}
					renderItem={({ item }) => {
						const done = isChoreCurrentlyDone(item);
						const assigneeName = (memberData.find(m => m.uid === item.assignee) || { Name: "Unknown" })
							.Name;
						const isMine = item.assignee === user?.uid;

						return (
							<View style={styles.choreCard}>
								<TouchableOpacity
									onPress={() => {
										if (!isMine) {
											Alert.alert("Not allowed", "You can only toggle chores assigned to you.");
											return;
										}
										toggleChoreDone(item.id, done);
									}}
									disabled={!isMine}
									style={[
										styles.checkbox,
										done && styles.checkboxDone,
										!isMine && styles.checkboxDisabled,
									]}
								>
									<Text style={styles.checkboxText}>{done ? "✓" : ""}</Text>
								</TouchableOpacity>

								<View style={styles.choreInfo}>
									<Text style={styles.choreName}>{String(item.name)}</Text>
									<Text style={styles.choreDetails}>
										⏰ {String(item.frequency)} • 👤 {String(assigneeName)}
									</Text>
									<Text style={styles.lastDone}>Last done: {toDateString(item.lastDone)}</Text>
								</View>
							</View>
						);
					}}
					ListEmptyComponent={
						<View style={styles.emptyState}>
							<Text style={styles.emptyText}>🎉 No chores assigned to you!</Text>
							<Text style={styles.emptySubtext}>Enjoy the free time!</Text>
						</View>
					}
				/>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFF9C4",
		padding: 16,
	},
	roomHeader: {
		backgroundColor: "#FFFFFF",
		padding: 16,
		borderRadius: 16,
		marginBottom: 16,
		elevation: 2,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		borderLeftWidth: 4,
		borderLeftColor: "#FFD166",
	},
	roomName: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#D84315",
		marginBottom: 8,
	},
	codeContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	codeLabel: {
		fontSize: 14,
		color: "#666",
		marginRight: 6,
	},
	codeValue: {
		fontSize: 16,
		fontWeight: "600",
		color: "#FF9800",
		backgroundColor: "#FFF3E0",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 6,
	},
	section: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		padding: 16,
		marginBottom: 16,
		elevation: 2,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#D84315",
		marginBottom: 12,
	},
	memberCard: {
		backgroundColor: "#FFF8E1",
		padding: 12,
		borderRadius: 12,
		marginBottom: 8,
		borderLeftWidth: 3,
		borderLeftColor: "#FFB74D",
	},
	memberHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 4,
	},
	memberName: {
		fontSize: 16,
		fontWeight: "600",
		color: "#D84315",
	},
	statusIndicator: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 8,
	},
	homeStatus: {
		backgroundColor: "#C8E6C9",
	},
	awayStatus: {
		backgroundColor: "#FFE0B2",
	},
	statusText: {
		fontSize: 12,
		fontWeight: "500",
		color: "#D84315",
	},
	lastUpdated: {
		fontSize: 12,
		color: "#666",
		fontStyle: "italic",
	},
	choreCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#FFF8E1",
		padding: 12,
		borderRadius: 12,
		marginBottom: 8,
		borderLeftWidth: 3,
		borderLeftColor: "#4CAF50",
	},
	checkbox: {
		width: 32,
		height: 32,
		borderRadius: 8,
		borderWidth: 2,
		borderColor: "#FF9800",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#FFFFFF",
	},
	checkboxDone: {
		backgroundColor: "#4CAF50",
		borderColor: "#4CAF50",
	},
	checkboxDisabled: {
		opacity: 0.5,
	},
	checkboxText: {
		color: "#FFFFFF",
		fontWeight: "bold",
		fontSize: 16,
	},
	choreInfo: {
		flex: 1,
		marginLeft: 12,
	},
	choreName: {
		fontSize: 16,
		fontWeight: "600",
		color: "#2D3748",
		marginBottom: 4,
	},
	choreDetails: {
		fontSize: 14,
		color: "#666",
		marginBottom: 2,
	},
	lastDone: {
		fontSize: 12,
		color: "#999",
		fontStyle: "italic",
	},
	emptyState: {
		alignItems: "center",
		padding: 20,
	},
	emptyText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#FF9800",
		marginBottom: 4,
	},
	emptySubtext: {
		fontSize: 14,
		color: "#666",
		fontStyle: "italic",
	},

	// Modal Styles
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContent: {
		backgroundColor: "white",
		borderRadius: 16,
		padding: 24,
		margin: 20,
		width: "90%",
		maxHeight: "80%",
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#D84315",
		marginBottom: 20,
		textAlign: "center",
	},
	label: {
		fontSize: 16,
		fontWeight: "500",
		color: "#333",
		marginBottom: 8,
		marginTop: 12,
	},
	modalInput: {
		borderWidth: 1,
		borderColor: "#FFCCBC",
		borderRadius: 8,
		padding: 12,
		backgroundColor: "#FFF8E1",
		textAlignVertical: "top",
		minHeight: 100,
	},
	memberList: {
		maxHeight: 150,
		marginBottom: 20,
	},
	memberItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		padding: 12,
		borderWidth: 1,
		borderColor: "#FFCCBC",
		borderRadius: 8,
		marginBottom: 8,
		backgroundColor: "#FFF8E1",
	},
	selectedMember: {
		backgroundColor: "#FFE0B2",
		borderColor: "#FF9800",
	},
	memberText: {
		fontSize: 14,
		fontWeight: "500",
	},
	checkmark: {
		fontSize: 16,
	},
	modalButtons: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: 12,
	},
	modalButton: {
		flex: 1,
		paddingVertical: 14,
		borderRadius: 8,
		alignItems: "center",
	},
	cancelButton: {
		backgroundColor: "#9E9E9E",
	},
	startButton: {
		backgroundColor: "#4CAF50",
	},
	modalButtonText: {
		color: "white",
		fontWeight: "600",
		fontSize: 16,
	},
});
