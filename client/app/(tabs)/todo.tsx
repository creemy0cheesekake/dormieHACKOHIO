import React, { useEffect, useState, useRef } from "react";
// import { ScrollView, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from "react-native";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import {
	collection,
	doc,
	onSnapshot,
	addDoc,
	getDoc,
	getDocs,
	setDoc,
	updateDoc,
	arrayUnion,
	serverTimestamp,
	deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { SERVER_ENDPOINT } from "@env";

/**
 * Firestore layout used:
 * rooms/{roomId} fields:
 *  - members: string[]
 *  - chorePhase: "open" | "confirm" | "ranking" | "done"
 *  - choresConfirmed: string[]   // userIds who confirmed the list is complete
 *  - rankings: { [uid]: { [choreId]: number } }
 *
 * rooms/{roomId}/chores/{choreId}:
 *  - name: string
 *  - frequency: string
 *  - createdAt: timestamp
 */

export default function TodoTab() {
	const tabBarHeight = useBottomTabBarHeight();
	const [user, setUser] = useState<{ uid: string; name?: string } | null>(null);
	const [roomId, setRoomId] = useState<string | null>(null);

	const [members, setMembers] = useState<string[]>([]);
	const [chores, setChores] = useState<{ id: string; name: string; frequency: string }[]>([]);
	const [phase, setPhase] = useState<string>("open");
	const [choresConfirmed, setChoresConfirmed] = useState<string[]>([]);
	const [rankingsMap, setRankingsMap] = useState<Record<string, Record<string, number>>>({});

	// Local UI state for adding a chore
	const [newName, setNewName] = useState<string>("");
	const [newFrequency, setNewFrequency] = useState<string>("");

	// Local ranking inputs while user edits
	const [localRanks, setLocalRanks] = useState<Record<string, string>>({});

	// set hassubmitted
	const hasSubmitted = false;
	// const hasSubmitted = rankingsMap[user.uid] !== undefined;

	// --- load stored user and roomId once ---
	useEffect(() => {
		(async () => {
			const stored = await AsyncStorage.getItem("user");
			if (stored) {
				try {
					const parsed = JSON.parse(stored);
					setUser({ uid: parsed.uid, name: parsed.name });
				} catch {
					// ignore
				}
			}

			const storedRoom = await AsyncStorage.getItem("roomId");
			if (storedRoom) {
				setRoomId(storedRoom);
			}
		})();
	}, []);

	// --- subscribe to room doc for members, phase, confirmations, rankings ---
	useEffect(() => {
		if (!roomId) return undefined;
		const roomRef = doc(db, "rooms", roomId);
		const unsub = onSnapshot(roomRef, snap => {
			const data = snap.exists() ? snap.data() : null;
			if (!data) {
				setMembers([]);
				setPhase("open");
				setChoresConfirmed([]);
				setRankingsMap({});
				return;
			}

			setMembers(Array.isArray(data.members) ? data.members : []);
			setPhase(typeof data.chorePhase === "string" ? data.chorePhase : "open");
			setChoresConfirmed(Array.isArray(data.choresConfirmed) ? data.choresConfirmed : []);
			setRankingsMap(typeof data.rankings === "object" && data.rankings ? data.rankings : {});
		});

		return () => unsub();
	}, [roomId]);

	// --- subscribe to chores subcollection in room ---
	useEffect(() => {
		if (!roomId) return undefined;
		const col = collection(db, "rooms", roomId, "chores");
		const unsub = onSnapshot(col, snap => {
			const list: { id: string; name: string; frequency: string }[] = snap.docs.map(d => {
				const data = d.data() as any;
				return {
					id: d.id,
					name: data.name || "Unnamed",
					frequency: data.frequency || "",
				};
			});
			setChores(list);
		});

		return () => unsub();
	}, [roomId]);

	// --- helper: require user+room ---
	function ensureUserRoomOrWarn(): boolean {
		if (!user || !user.uid) {
			Alert.alert("User missing", "Stored user not found.");
			return false;
		}
		if (!roomId) {
			Alert.alert("Room missing", "No roomId stored.");
			return false;
		}
		return true;
	}

	// --- add new chore ---
	async function handleAddChore(): Promise<void> {
		if (!ensureUserRoomOrWarn()) return;
		const name = newName.trim();
		const frequency = newFrequency.trim();
		if (!name) {
			Alert.alert("Validation", "Chore name required.");
			return;
		}

		try {
			const colRef = collection(db, "rooms", roomId!, "chores");
			await addDoc(colRef, {
				name,
				frequency,
				createdAt: serverTimestamp(),
				createdBy: user!.uid,
			});
			setNewName("");
			setNewFrequency("");
		} catch (err) {
			console.error("addChore err", err);
			Alert.alert("Error", "Failed to add chore.");
		}
	}

	// --- confirm that the list of chores is complete (one per user) ---
	async function handleConfirmListComplete(): Promise<void> {
		if (!ensureUserRoomOrWarn()) return;
		try {
			const roomRef = doc(db, "rooms", roomId!);
			await updateDoc(roomRef, {
				choresConfirmed: arrayUnion(user!.uid),
			});

			// further advancement is handled by the room snapshot listener:
			// when choresConfirmed.length === members.length then server or client can set phase to 'ranking'.
			// We'll let the client set phase when it sees equality. To make it happen fast for all clients,
			// also try to set chorePhase here if we detect completion locally.
			const snap = await getDoc(roomRef);
			if (snap.exists()) {
				const data = snap.data();
				const confirmed = Array.isArray(data.choresConfirmed) ? data.choresConfirmed : [];
				const roomMembers = Array.isArray(data.members) ? data.members : [];
				if (confirmed.length === roomMembers.length) {
					await setDoc(roomRef, { chorePhase: "ranking" }, { merge: true });
				}
			}
		} catch (err) {
			console.error("confirm err", err);
			Alert.alert("Error", "Failed to confirm.");
		}
	}

	// --- submit this user's rankings ---
	async function handleSubmitRankings(): Promise<void> {
		if (!ensureUserRoomOrWarn()) return;
		// Convert localRanks (string) to numbers and validate uniqueness / full cover
		const parsed: Record<string, number> = {};
		for (const chore of chores) {
			const raw = (localRanks[chore.id] || "").trim();
			const n = parseInt(raw, 10);
			if (Number.isNaN(n) || n < 1) {
				Alert.alert("Invalid ranking", "Each chore needs a rank number >= 1.");
				return;
			}
			parsed[chore.id] = n;
		}

		// Check uniqueness of ranks for this user (1..n should be used once each ideally)
		const ranks = Object.values(parsed);
		if (ranks.length !== chores.length || new Set(ranks).size !== chores.length) {
			Alert.alert("Invalid ranking", `Each chore must have a unique rank from 1 to ${chores.length}.`);
			return;
		}
		if (!ranks.every(r => r >= 1 && r <= chores.length)) {
			Alert.alert("Invalid ranking", `All ranks must be numbers from 1 to ${chores.length}.`);
			return;
		}

		try {
			const roomRef = doc(db, "rooms", roomId!);
			// write into room.rankings.{uid} = parsed
			await setDoc(
				roomRef,
				{
					rankings: {
						[user!.uid]: parsed,
					},
				},
				{ merge: true },
			);
		} catch (err) {
			console.error("submit rankings err", err);
			Alert.alert("Error", "Failed to submit rankings.");
		}
	}

	const [memberData, setMemberData] = useState([]);

	useEffect(() => {
		const fetchMemberData = async () => {
			if (!members || members.length === 0) return;
			const data = [];
			for (const uid of members) {
				const snap = await getDoc(doc(db, "users", uid));
				if (snap.exists()) {
					data.push({ uid, ...snap.data() });
				} else {
					data.push({ uid, Name: "Unknown" });
				}
			}
			setMemberData(data);
		};
		fetchMemberData();
	}, [members]);

	useEffect(() => {
		if (phase === "assigned") return;
		if (!roomId) return;
		const allRankers = Object.keys(rankingsMap || {});
		if (memberData.length > 0 && allRankers.length === memberData.length) {
			const peopleStr = `{${memberData.map(m => `"${m.Name || "Unknown"}" : "${m.uid}"`).join(", ")}}`;
			const choresStr = JSON.stringify(
				chores.map(c => {
					const scores = {};
					memberData.forEach(m => {
						const name = m.Name || "Unknown";
						const score = rankingsMap[m.uid]?.[c.id];
						const finalValue =
							!isNaN(parseFloat(score)) && isFinite(score) ? parseFloat(score) : score ?? "N/A";

						scores[name] = finalValue;
					});
					return {
						task: c.name,
						frequency: c.frequency,
						id: c.id,
						scores: scores,
					};
				}),
			);

			console.log("=== FINAL CHORE RANKINGS ===");
			console.log(`People: ${peopleStr}`);
			console.log(`Chores: ${choresStr}`);
			console.log("=== END ===");
			(async () => {
				if (phase === "assigned") return;
				console.log("\n\n\n\nskib\n\n\n\n");
				try {
					const res = await fetch(SERVER_ENDPOINT + "/chore", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ peopleStr, choresStr }),
					});
					const data = await res.json();

					let aiDistribution;
					try {
						if (data.result.trim().startsWith("```")) {
							let cleaned = data.result
								.trim()
								.replace(/```json\s*|```/g, "")
								.trim();
							aiDistribution = JSON.parse(cleaned);
						} else {
							aiDistribution = JSON.parse(data.result.trim());
						}
						// console.log("distro2:", aiDistribution);
					} catch (err) {
						console.log("Parse error:", err);
						console.log("Raw result:", data.result);
						// alert("AI Error");
						return;
					}

					console.log("\n----\n", aiDistribution, "\n----");

					// chorePhase + database logic preserved

					for (const [choreId, userId] of Object.entries(aiDistribution)) {
						console.log(roomId, choreId, userId);
						const choreRef = doc(db, "rooms", roomId, "chores", choreId);
						await setDoc(choreRef, { assignee: userId }, { merge: true });
						const roomRef = doc(db, "rooms", roomId);
						await updateDoc(roomRef, { chorePhase: "assigned" });
					}
					console.log("Chore assignments saved.");
				} catch (error) {
					console.log("Network or Firestore error:", error);
				}
			})();
		}
	}, [rankingsMap, memberData, chores, roomId]);

	async function handleResetChores() {
		if (!ensureUserRoomOrWarn()) return;
		try {
			const roomRef = doc(db, "rooms", roomId!);
			const choresCol = collection(db, "rooms", roomId!, "chores");
			// delete all chores
			const snapshot = await getDocs(choresCol);
			snapshot.forEach(async docSnap => await deleteDoc(docSnap.ref));
			// reset room fields
			await setDoc(
				roomRef,
				{
					chorePhase: "open",
					choresConfirmed: [],
					rankings: {},
				},
				{ merge: true },
			);
			setLocalRanks({});
		} catch (err) {
			console.error("Reset error:", err);
			Alert.alert("Error", "Failed to reset chores");
		}
	}

	async function handleDeleteChore(choreId: string) {
		if (!roomId) return;
		try {
			const choreRef = doc(db, "rooms", roomId, "chores", choreId);
			await deleteDoc(choreRef);
		} catch (err) {
			console.error("Delete chore error:", err);
			Alert.alert("Error", "Failed to delete chore");
		}
	}

	// --- small UI helpers ---
	function renderChoreItem({ item }: { item: { id: string; name: string; frequency: string } }) {
		return (
			<View style={choreStyles.choreItem}>
				{/* Chore Info */}
				<View style={choreStyles.choreInfo}>
					<Text style={choreStyles.choreName}>{item.name}</Text>
					<Text style={choreStyles.choreFreq}>{item.frequency}</Text>
				</View>

				{/* Status & Actions */}
				<View style={choreStyles.choreActions}>
					{/* Phase Badge */}
					<View
						style={[
							choreStyles.phaseBadge,
							phase === "open"
								? choreStyles.openBadge
								: phase === "confirm"
								? choreStyles.confirmBadge
								: choreStyles.rankingBadge,
						]}
					>
						<Text style={choreStyles.phaseBadgeText}>
							{phase === "open" ? "Open" : phase === "confirm" ? "✅ Confirm" : "🎯 Rank"}
						</Text>
					</View>

					{/* Delete Button */}
					<TouchableOpacity
						onPress={() => handleDeleteChore(item.id)}
						style={[choreStyles.deleteBtn, phase === "ranking" && choreStyles.disabledDeleteBtn]}
						disabled={phase === "ranking"}
					>
						<Text style={[choreStyles.deleteText, phase === "ranking" && choreStyles.disabledDeleteText]}>
							🗑️ Delete
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	}

	// If not ready
	if (!user || !roomId) {
		return (
			<SafeAreaView style={styles.container}>
				<Text style={styles.warn}>User or room not loaded.</Text>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safeArea}>
			<ScrollView
				style={styles.container}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Header Section */}
				<View style={styles.headerSection}>
					<Text style={styles.header}>Setup Shared Chores</Text>
					<Text style={styles.subtitle}>Let's make chores fun!</Text>
				</View>

				{/* Reset Button */}
				<TouchableOpacity style={[styles.btn, styles.resetBtn]} onPress={handleResetChores}>
					<Text style={styles.btnText}>Reset All Chores</Text>
				</TouchableOpacity>

				{/* Add Chore Section */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>➕ Add New Chore</Text>
					<TextInput
						value={newName}
						onChangeText={setNewName}
						placeholder="What needs doing?"
						placeholderTextColor="#FF9E80"
						style={styles.input}
					/>
					<TextInput
						value={newFrequency}
						onChangeText={setNewFrequency}
						placeholder="How often? (e.g. every Friday)"
						placeholderTextColor="#FF9E80"
						style={styles.input}
					/>
					<TouchableOpacity
						style={[styles.btn, styles.addBtn, phase === "ranking" && styles.disabledBtn]}
						onPress={handleAddChore}
						disabled={phase === "ranking"}
					>
						<Text style={styles.btnText}>Add Chore</Text>
					</TouchableOpacity>
				</View>

				{/* Chore List Section */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>📝 Chore List</Text>
					<FlatList
						data={chores}
						keyExtractor={c => c.id}
						renderItem={renderChoreItem}
						style={styles.flatList}
						scrollEnabled={false}
						ListEmptyComponent={<Text style={styles.emptyText}>No chores yet! Add some above 👆</Text>}
					/>
				</View>

				{/* Phase Management Section */}
				<View style={styles.section}>
					<View style={styles.phaseHeader}>
						<Text style={styles.sectionTitle}>Phase: {phase}</Text>
						<View
							style={[styles.phaseIndicator, phase === "open" ? styles.openPhase : styles.rankingPhase]}
						>
							<Text style={styles.phaseText}>{phase}</Text>
						</View>
					</View>

					{phase === "open" && (
						<View style={styles.phaseContent}>
							<Text style={styles.instruction}>
								When everyone confirms the list is complete it moves to ranking.
							</Text>
							<TouchableOpacity
								style={[styles.btn, styles.confirmBtn]}
								onPress={handleConfirmListComplete}
							>
								<Text style={styles.btnText}>
									{choresConfirmed.includes(user.uid) ? "✅ Confirmed!" : "👍 Confirm List Complete"}
								</Text>
							</TouchableOpacity>
						</View>
					)}

					{phase === "ranking" && (
						<View style={styles.phaseContent}>
							<Text style={styles.instruction}>
								Rank chores from 1 (Most Prefered) to {chores.length} (Least Prefered). Ranks must be
								unique! 🎯
							</Text>

							<View style={styles.rankingSection}>
								{chores.map(c => (
									<View key={c.id} style={styles.rankRow}>
										<Text style={styles.choreName}>{c.name}</Text>
										<TextInput
											style={styles.rankInput}
											placeholder="?"
											placeholderTextColor="#FF9E80"
											keyboardType="number-pad"
											value={localRanks[c.id] || ""}
											onChangeText={v => {
												setLocalRanks(prev => ({ ...prev, [c.id]: v }));
											}}
										/>
									</View>
								))}
							</View>

							<TouchableOpacity
								style={[styles.btn, styles.submitBtn, hasSubmitted && styles.disabledBtn]}
								onPress={handleSubmitRankings}
								disabled={hasSubmitted}
							>
								<Text style={styles.btnText}>
									{hasSubmitted ? "🎉 Submitted!" : "📤 Submit My Rankings"}
								</Text>
							</TouchableOpacity>

							<Text style={styles.submissionCount}>
								Submitted by {Object.keys(rankingsMap).length} of {members.length} people
							</Text>
						</View>
					)}
				</View>

				<View style={styles.spacer} />
			</ScrollView>
		</SafeAreaView>
	);
}

const choreStyles = StyleSheet.create({
	choreItem: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		backgroundColor: "#FFF8E1",
		padding: 16,
		borderRadius: 12,
		marginBottom: 10,
		borderLeftWidth: 4,
		borderLeftColor: "#FFB74D",
		elevation: 2,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
	},
	choreInfo: {
		flex: 1,
		marginRight: 12,
	},
	choreName: {
		fontSize: 16,
		fontWeight: "bold",
		color: "#D84315",
		marginBottom: 4,
	},
	choreFreq: {
		fontSize: 14,
		color: "#FF9800",
		fontWeight: "500",
	},
	choreActions: {
		alignItems: "flex-end",
		gap: 8,
	},
	phaseBadge: {
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderRadius: 8,
		minWidth: 70,
		alignItems: "center",
	},
	openBadge: {
		backgroundColor: "#FFE0B2",
	},
	confirmBadge: {
		backgroundColor: "#C8E6C9",
	},
	rankingBadge: {
		backgroundColor: "#B3E5FC",
	},
	phaseBadgeText: {
		fontSize: 10,
		fontWeight: "bold",
		color: "#D84315",
	},
	deleteBtn: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		backgroundColor: "#FFEBEE",
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#FFCDD2",
	},
	disabledDeleteBtn: {
		backgroundColor: "#F5F5F5",
		borderColor: "#E0E0E0",
		opacity: 0.6,
	},
	deleteText: {
		fontSize: 12,
		fontWeight: "600",
		color: "#E53935",
	},
	disabledDeleteText: {
		color: "#9E9E9E",
	},
});

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: "#FFF9C4",
	},
	container: {
		flex: 1,
		backgroundColor: "#FFF9C4",
	},
	scrollContent: {
		padding: 16,
		paddingBottom: 100, // Extra space for scrolling
	},
	headerSection: {
		alignItems: "center",
		marginBottom: 20,
		padding: 16,
		backgroundColor: "#FFD166",
		borderRadius: 20,
		elevation: 4,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
	},
	header: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#D84315",
		textAlign: "center",
	},
	subtitle: {
		fontSize: 16,
		color: "#E65100",
		marginTop: 4,
		textAlign: "center",
	},
	section: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		padding: 16,
		marginBottom: 16,
		elevation: 3,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 6,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#D84315",
		marginBottom: 12,
	},
	phaseHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 12,
	},
	phaseIndicator: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 12,
	},
	openPhase: {
		backgroundColor: "#C8E6C9",
	},
	rankingPhase: {
		backgroundColor: "#FFE0B2",
	},
	phaseText: {
		fontSize: 12,
		fontWeight: "bold",
		color: "#D84315",
		textTransform: "capitalize",
	},
	btn: {
		paddingVertical: 14,
		paddingHorizontal: 20,
		borderRadius: 12,
		alignItems: "center",
		marginVertical: 6,
		elevation: 2,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
	resetBtn: {
		backgroundColor: "#EF5350",
	},
	addBtn: {
		backgroundColor: "#FF9800",
	},
	confirmBtn: {
		backgroundColor: "#4CAF50",
	},
	submitBtn: {
		backgroundColor: "#2196F3",
	},
	disabledBtn: {
		backgroundColor: "#BDBDBD",
		opacity: 0.7,
	},
	btnText: {
		color: "white",
		fontWeight: "bold",
		fontSize: 16,
	},
	input: {
		backgroundColor: "#FFF3E0",
		borderWidth: 2,
		borderColor: "#FFCCBC",
		borderRadius: 12,
		padding: 14,
		marginBottom: 12,
		fontSize: 16,
		color: "#D84315",
	},
	flatList: {
		width: "100%",
	},
	emptyText: {
		textAlign: "center",
		color: "#FF9800",
		fontStyle: "italic",
		padding: 20,
		fontSize: 14,
	},
	instruction: {
		color: "#E65100",
		fontSize: 14,
		lineHeight: 20,
		marginBottom: 16,
		textAlign: "center",
	},
	rankingSection: {
		marginBottom: 16,
	},
	rankRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#FFE0B2",
	},
	choreName: {
		fontSize: 16,
		color: "#D84315",
		fontWeight: "500",
		flex: 1,
	},
	rankInput: {
		width: 60,
		height: 40,
		borderWidth: 2,
		borderColor: "#FFCCBC",
		borderRadius: 8,
		padding: 8,
		textAlign: "center",
		fontSize: 16,
		fontWeight: "bold",
		color: "#D84315",
		backgroundColor: "#FFF3E0",
	},
	submissionCount: {
		textAlign: "center",
		color: "#FF9800",
		fontSize: 12,
		marginTop: 8,
		fontStyle: "italic",
	},
	phaseContent: {
		marginTop: 8,
	},
	spacer: {
		height: 40,
	},
});
