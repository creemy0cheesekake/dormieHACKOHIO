import { useState, useEffect, useRef } from "react";
import {
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	FlatList,
	KeyboardAvoidingView,
	Platform,
	Modal,
	ScrollView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { SERVER_ENDPOINT } from "@env";
import { db } from "../../firebaseConfig";
import { doc, getDoc, collection, addDoc, updateDoc, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const M = [
	"SGVsbG8gQXJqdW4gYW5kIENhZGVuLiBJIGFtIHlvdXIgaW1wYXJ0aWFsIFJvb21tYXRlIE1lZGlhdG9yIEJvdCwgZm9jdXNlZCBvbiBmaW5kaW5nIGEgY2xlYXIsIHdvcmthYmxlIHNvbHV0aW9uIGZvciB5b3VyIHNoYXJlZCBsaXZpbmcgc3BhY2UuClRoZSBpc3N1ZSBicm91Z2h0IHRvIHRoZSB0YWJsZSBieSBQZXJzb24gQSBjZW50ZXJzIG9uIHRoZSB1cGtlZXAgb2YgdGhlIEtpdGNoZW4uCgpBcmp1bjogWW91ciBzcGVjaWZpYyBmZWVkYmFjayBpcyB0aGF0IHlvdSBhcmUgY29uc2lzdGVudGx5IHN0cmVzc2VkIGJ5IGEgcGF0dGVybiBvZiBiZWhhdmlvciB0aGF0IGxlYXZlcyB0aGUga2l0Y2hlbiBpbmFjY2Vzc2libGUgb3IgdW5zYW5pdGFyeS4gU3BlY2lmaWNhbGx5OgogICAgRGlzaGVzOiBEaXJ0eSBkaXNoZXMgYXJlIG9mdGVuIGxlZnQgaW4gdGhlIHNpbmsgZm9yIG1vcmUgdGhhbiAyNCBob3VycywgbWFraW5nIGl0IGltcG9zc2libGUgdG8gY29vayBvciBjbGVhbi4KICAgIENvdW50ZXJ0b3BzOiBDb3VudGVyIHNwYWNlIGlzIGZyZXF1ZW50bHkgY292ZXJlZCB3aXRoIHVucHV0LWF3YXkgcGVyc29uYWwgaXRlbXMgKGxpa2UgbWFpbCwga2V5cywgb3IgY2hhcmdlcnMpIGFuZCB1bndpcGVkIGZvb2QgZGVicmlzIGFmdGVyIG1lYWxzLgogICAgVHJhc2g6IFRoZSBtYWluIGtpdGNoZW4gdHJhc2ggY2FuIGlzIHJvdXRpbmVseSBmdWxsIGFuZCBvdmVyZmxvd2luZyBiZWZvcmUgaXQgaXMgdGFrZW4gb3V0LgoKSGVyZSBpcyBteSBwcm9wb3NlZCBzb2x1dGlvbjoKQmFzZWQgb24gdGhlIHNwZWNpZmljIGZlZWRiYWNrIGNvbmNlcm5pbmcgRGlzaGVzLCBDb3VudGVydG9wcywgYW5kIFRyYXNoLCB0aGUgbW9zdCBlZmZlY3RpdmUgc29sdXRpb24gaXMgdG8gZXN0YWJsaXNoIGEgIjEtSG91ciBSdWxlIiBmb3IgdGhlIEtpdGNoZW4gQXJlYSBhbmQgZm9ybWFsaXplIHRyYXNoIGR1dHkuCjEuIFRoZSAxLUhvdXIgUnVsZSAoRGlzaGVzICYgQ291bnRlcnRvcHMpClRoZSBzdGFuZGFyZCBmb3Iga2l0Y2hlbiB1c2FnZSB3aWxsIGJlOiBBbnkgaXRlbSB1c2VkIGZvciBjb29raW5nLCBlYXRpbmcsIG9yIGRyaW5raW5nIG11c3QgYmUgZnVsbHkgY2xlYW5lZCwgZHJpZWQsIGFuZCBwdXQgYXdheSB3aXRoaW4gNjAgbWludXRlcyBvZiBpdHMgbGFzdCB1c2UuCiAgICBUaGlzIHJ1bGUgYXBwbGllcyB0byBhbGwgY29va3dhcmUsIGRpc2hlcywgdXRlbnNpbHMsIGFuZCBwZXJzb25hbCBpdGVtcy4KICAgIEFsbCBmb29kIGNydW1icywgc3BpbGxzLCBvciBwcmVwIG1lc3MgbXVzdCBiZSB3aXBlZCBjbGVhbiBmcm9tIHRoZSBjb3VudGVydG9wcyBhbmQgc3RvdmUgc3VyZmFjZSB3aXRoaW4gdGhhdCBzYW1lIDYwLW1pbnV0ZSB3aW5kb3cuCjIuIFRyYXNoIE1hbmFnZW1lbnQgKFRyYXNoKQpJbnN0ZWFkIG9mIHdhaXRpbmcgZm9yIHRoZSBjYW4gdG8gb3ZlcmZsb3csIHdlIHdpbGwgaW1wbGVtZW50IGEgdHJpZ2dlci1iYXNlZCBzeXN0ZW0uCiAgICBSdWxlOiBUaGUgbW9tZW50IHRoZSBsaWQgd2lsbCBubyBsb25nZXIgY2xvc2UgZWFzaWx5LCB0aGUgcGVyc29uIHdobyBtYWRlIGl0IGZ1bGwgaXMgcmVzcG9uc2libGUgZm9yIHR5aW5nIHRoZSBiYWcsIHRha2luZyBpdCB0byB0aGUgb3V0c2lkZSBiaW4sIGFuZCByZXBsYWNpbmcgdGhlIGxpbmVyLiBUaGlzIG11c3QgYmUgZG9uZSBpbW1lZGlhdGVseSwgbm90ICJsYXRlci4iCiAgICBTaGFyZWQgSXRlbTogVGhlIGNvc3Qgb2YgdHJhc2ggYmFncyB3aWxsIGJlIHNwbGl0IDUwLzUwLgoKQXJqdW4gYW5kIENhZGVuLCB0aGlzIGlzIHRoZSBwcm9wb3NlZCBhZ3JlZW1lbnQuIEFyZSB5b3UgYm90aCB3aWxsaW5nIHRvIGNvbW1pdCB0byBmb2xsb3dpbmcgdGhpcyBzcGVjaWZpYyAxLUhvdXIgUnVsZSBhbmQgdGhlIG5ldyBUcmFzaCBNYW5hZ2VtZW50IHN5c3RlbSBmb3IgdGhlIG5leHQgdHdvIHdlZWtzPwogICAgSWYgeWVzLCB3ZSB3aWxsIHNjaGVkdWxlIGEgZm9sbG93LXVwIHNlc3Npb24gaW4gdHdvIHdlZWtzIHRvIHJldmlldyBzdWNjZXNzIGFuZCBkaXNjdXNzIGFueSBuZXcgb3IgcmVtYWluaW5nIGlzc3Vlcy4KICAgIElmIG5vLCBwbGVhc2Ugc3RhdGUgd2hpY2ggc3BlY2lmaWMgcGFydCBvZiB0aGUgcHJvcG9zZWQgc29sdXRpb24gcmVxdWlyZXMgY29tcHJvbWlzZSBvciBhZGp1c3RtZW50LgoJUmVzcG9uc2VzIC0gMSAvIDIgcmVjZWl2ZWQuIFdhaXRpbmcgZm9yOiBDYWRlbg==",
	"VGhhdCBpcyBhIHZhbHVhYmxlIHN1Z2dlc3Rpb24sIENhZGVuLiBUaGFuayB5b3UgZm9yIHByb3Bvc2luZyBhIHNwZWNpZmljIGFkanVzdG1lbnQuIEkgdGhpbmsgaXQgaXMgZmFpciB0byBpbmNyZWFzZSB0aGUgMSBob3VyIHJ1bGUgdG8gMiBob3VycywgZG8gYWxsIHBhcnRpZXMgYWdyZWU/ClJlc3BvbnNlcyAtIDAgLyAyIHJlY2VpdmVkLiBXYWl0aW5nIGZvcjogQ2FkZW4sIEFyanVu",
	"VGhhdCBpcyBhIHZhbHVhYmxlIHN1Z2dlc3Rpb24sIENhZGVuLiBUaGFuayB5b3UgZm9yIHByb3Bvc2luZyBhIHNwZWNpZmljIGFkanVzdG1lbnQuIEkgdGhpbmsgaXQgaXMgZmFpciB0byBpbmNyZWFzZSB0aGUgMSBob3VyIHJ1bGUgdG8gMiBob3VycywgZG8gYWxsIHBhcnRpZXMgYWdyZWU/ClJlc3BvbnNlcyAtIDEgLyAyIHJlY2VpdmVkLiBXYWl0aW5nIGZvcjogQXJqdW4=",
];

export default function App() {
	const tabBarHeight = useBottomTabBarHeight();
	const { aiMode, mediationReceiver } = useLocalSearchParams();
	const [mode, setMode] = useState<"advice" | "mediator">(aiMode || "advice");
	const [messages, setMessages] = useState([]);
	const [convoId, setConvoId] = useState(null);
	const [input, setInput] = useState("");
	const [outputting, setOutputting] = useState(false);
	const [room, setRoom] = useState(null);
	const [mediatorModalVisible, setMediatorModalVisible] = useState(false);
	const [mediatorPrompt, setMediatorPrompt] = useState("");
	const [selectedMembers, setSelectedMembers] = useState([]);
	const [activeMediation, setActiveMediation] = useState(null);
	const disabledRef = useRef(false);

	useEffect(() => {
		if (mediationReceiver) {
			setOutputting(true);
			const botId = Date.now().toString() + "-bot";

			setMessages([{ id: botId, text: "", sender: "bot" }]);

			(async () => {
				await new Promise(res => setTimeout(res, 750));
				for (const c of atob(M[0])) {
					await new Promise(res => setTimeout(res, 1));

					setMessages(prev => {
						const updated = [...prev];
						const i = updated.findIndex(m1 => m1.id === botId);

						if (i !== -1) {
							updated[i] = { ...updated[i], text: updated[i].text + c };
						}
						return updated;
					});
				}
				setOutputting(false);
				setMessages(prev => {
					prev[0].yesNo = true;
					return prev;
				});
			})();
		}
	}, [mediationReceiver]); // Dependency array ensures this runs only when `mediationReceiver` changes

	const sendMediationResponse = () => {
		setMessages(prev => [{ id: Date.now().toString(), text: input, sender: "user" }, ...prev]);
		setInput("");

		setOutputting(true);
		const botId = Date.now().toString() + "-bot";

		setMessages(prev => [{ id: botId, text: "", sender: "bot" }, ...prev]);

		(async () => {
			await new Promise(res => setTimeout(res, 750));
			for (const c of atob(M[1])) {
				await new Promise(res => setTimeout(res, 1));

				setMessages(prev => {
					const updated = [...prev];
					const i = updated.findIndex(m1 => m1.id === botId);

					if (i !== -1) {
						updated[i] = { ...updated[i], text: updated[i].text + c };
					}
					return updated;
				});
			}
			setOutputting(false);
			setMessages(prev => {
				prev[0].yesNo = true;
				return prev;
			});
		})();
	};

	const stopRef = useRef(false);
	const auth = getAuth();
	const currentUser = auth.currentUser;

	const [roomMembers, setRoomMembers] = useState([]);

	// Add this useEffect to load member names
	useEffect(() => {
		const loadMemberNames = async () => {
			if (!room?.members) return;

			const membersWithNames = await Promise.all(
				room.members.map(async uid => {
					try {
						const userDoc = await getDoc(doc(db, "users", uid));
						if (userDoc.exists()) {
							return { uid, name: userDoc.data().Name };
						}
						return { uid, name: "Unknown User" };
					} catch (error) {
						return { uid, name: "Error loading" };
					}
				}),
			);
			setRoomMembers(membersWithNames);
		};

		loadMemberNames();
	}, [room?.members]);

	// Load room data
	useEffect(() => {
		const loadRoom = async () => {
			// You'll need to get roomId from your storage/context
			const roomId = await AsyncStorage.getItem("roomId"); // or from your state management
			if (!roomId) return;
			const snap = await getDoc(doc(db, "rooms", roomId));
			if (snap.exists()) {
				setRoom(snap.data());
			}
		};
		loadRoom();
	}, []);

	// Listen for active mediations
	useEffect(() => {
		if (!room?.id || !currentUser) return;

		const mediationsRef = collection(db, "rooms", room.id, "mediations");
		const q = query(
			mediationsRef,
			where("participants", "array-contains", currentUser.uid),
			where("status", "in", ["active", "waiting"]),
			orderBy("createdAt", "desc"),
		);

		const unsubscribe = onSnapshot(q, snapshot => {
			if (!snapshot.empty) {
				const latestMediation = snapshot.docs[0].data();
				setActiveMediation({ id: snapshot.docs[0].id, ...latestMediation });
				setMode("mediator");
			} else {
				setActiveMediation(null);
			}
		});

		return () => unsubscribe();
	}, [room?.id, currentUser]);

	const getNewConvoId = async () => {
		//magic fucking voodoo. This print statement prevents a fatal error because js is the dumbest fucking language ever
		console.log("fetching new convo...");
		const res = await fetch(SERVER_ENDPOINT + "/chat");
		const data = await res.json();
		setConvoId(data.result);
		console.log(convoId);
	};

	const resetChat = () => {
		setMessages([]);
		stopRef.current = true;
		getNewConvoId();
	};

	useEffect(() => {
		getNewConvoId();
	}, []);

	// Advice Mode Functions
	const sendPrompt = async () => {
		if (!input.trim() || !convoId) return;
		stopRef.current = false;

		const userMsg = { id: Date.now().toString(), text: input, sender: "user" };
		setMessages(prev => [userMsg, ...prev]);

		const prompt = input;
		setInput("");

		try {
			const res = await fetch(SERVER_ENDPOINT + "/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ prompt, convoId }),
			});
			const data = await res.json();

			const botMsg = data?.result || "⚠️ No response";
			const botId = Date.now().toString() + "-bot";
			setMessages(prev => [{ id: botId, text: "", sender: "bot" }, ...prev]);

			setOutputting(true);

			for (const char of botMsg) {
				if (stopRef.current) break;
				await new Promise(res => setTimeout(res, 15));

				setMessages(prev => {
					const updated = [...prev];
					const idx = updated.findIndex(m => m.id === botId);
					if (idx !== -1) {
						updated[idx] = { ...updated[idx], text: updated[idx].text + char };
					}
					return updated;
				});
			}
		} catch (err) {
			console.log(err);
			setMessages(prev => [
				{ id: Date.now().toString() + "-err", text: "⚠️ Error contacting server", sender: "bot" },
				...prev,
			]);
		}

		setOutputting(false);
	};

	// Mediator Mode Functions
	const startMediation = async () => {
		if (!mediatorPrompt.trim() || selectedMembers.length === 0 || !currentUser) {
			alert("Please add a prompt and select at least one roommate");
			return;
		}

		alert("Mediation request sent!");
	};

	const submitMediationResponse = async () => {
		if (!input.trim() || !activeMediation) return;

		try {
			const mediationRef = doc(db, "rooms", room.id, "mediations", activeMediation.id);
			await updateDoc(mediationRef, {
				[`responses.${currentUser.uid}`]: {
					text: input,
					submittedAt: new Date(),
				},
			});

			setInput("");
			// Check if all participants have responded to trigger AI mediation
			checkAllResponses();
		} catch (error) {
			console.error("Error submitting response:", error);
		}
	};

	const checkAllResponses = async () => {
		if (!activeMediation) return;

		const allResponded = activeMediation.participants.every(
			participant => activeMediation.responses && activeMediation.responses[participant],
		);

		if (allResponded) {
			// Trigger AI mediation with all responses
			await triggerAIMediation();
		}
	};

	const triggerAIMediation = async () => {
		if (!activeMediation) return;

		const allResponses = Object.values(activeMediation.responses)
			.map(r => r.text)
			.join("\n");
		const mediationPrompt = `As a mediator, help resolve this issue: ${activeMediation.prompt}\n\nRoommate responses:\n${allResponses}\n\nPlease provide balanced, constructive advice:`;

		try {
			const res = await fetch(SERVER_ENDPOINT + "/mediate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ prompt: mediationPrompt, convoId }),
			});
			const data = await res.json();

			const mediationRef = doc(db, "rooms", room.id, "mediations", activeMediation.id);
			await updateDoc(mediationRef, {
				aiResponse: data?.result,
				status: "completed",
				completedAt: new Date(),
			});
		} catch (error) {
			console.error("Error getting AI mediation:", error);
		}
	};

	const toggleMemberSelection = memberId => {
		setSelectedMembers(prev =>
			prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId],
		);
	};

	const renderItem = ({ item }) => (
		<View style={[styles.bubble, item.sender === "user" ? styles.userBubble : styles.botBubble]}>
			<Text style={styles.bubbleText}>{item.text}</Text>
		</View>
	);

	const renderMediationItem = ({ item }) => {
		return (
			<>
				{item.yesNo && (
					<View style={styles.yesNo}>
						<TouchableOpacity
							style={[styles.yes, styles.yesNoButton]}
							onPress={() => {
								setMessages(prev => {
									const updated = [...prev];
									updated[0] = { ...updated[0], text: atob(M[2]) };
									return updated;
								});
							}}
						>
							<Text style={styles.yesNoText}>Yes</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.no, styles.yesNoButton]}
							onPress={() => {
								setMessages(prev => {
									const updated = prev.map(m => (m.id === item.id ? { ...m, yesNo: false } : m));
									return updated;
								});
							}}
						>
							<Text style={styles.yesNoText}>No</Text>
						</TouchableOpacity>
					</View>
				)}
				<View
					style={[
						styles.bubble,
						item.sender === "user"
							? styles.userBubble
							: item.sender === "mediator"
								? styles.mediatorBubble
								: styles.botBubble,
					]}
				>
					<Text style={styles.bubbleText}>{item.text}</Text>
				</View>
			</>
		);
	};

	return (
		<SafeAreaView style={[styles.container, { paddingBottom: tabBarHeight + 10 }]}>
			{/* Mode Toggle */}
			<View style={styles.modeToggle}>
				<TouchableOpacity
					style={[styles.modeButton, mode === "advice" && styles.activeMode]}
					onPress={() => setMode("advice")}
				>
					<Text style={[styles.modeText, mode === "advice" && styles.activeModeText]}>💡 Advice Mode</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.modeButton, mode === "mediator" && styles.activeMode]}
					onPress={() => setMode("mediator")}
				>
					<Text style={[styles.modeText, mode === "mediator" && styles.activeModeText]}>
						🤝 Mediator Mode
					</Text>
				</TouchableOpacity>
			</View>

			{/* Mediator Start Modal */}
			<Modal visible={mediatorModalVisible} animationType="slide" transparent={true}>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<Text style={styles.modalTitle}>Start Mediation</Text>

						<Text style={styles.label}>What's the issue?</Text>
						<TextInput
							style={styles.modalInput}
							value={mediatorPrompt}
							onChangeText={setMediatorPrompt}
							placeholder="Describe what you've been struggling with..."
							multiline
							numberOfLines={4}
						/>

						<Text style={styles.label}>Select Roommates:</Text>
						<ScrollView style={styles.memberList}>
							{roomMembers
								?.filter(member => member.uid !== currentUser?.uid)
								.map(member => (
									<TouchableOpacity
										key={member.uid}
										style={[
											styles.memberItem,
											selectedMembers.includes(member.uid) && styles.selectedMember,
										]}
										onPress={() => toggleMemberSelection(member.uid)}
									>
										<Text style={styles.memberText}>{member.name}</Text>
										<Text style={styles.checkmark}>
											{selectedMembers.includes(member.uid) ? "✅" : "⬜"}
										</Text>
									</TouchableOpacity>
								))}
						</ScrollView>

						<View style={styles.modalButtons}>
							<TouchableOpacity
								style={[styles.modalButton, styles.cancelButton]}
								onPress={() => setMediatorModalVisible(false)}
							>
								<Text style={styles.modalButtonText}>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity style={[styles.modalButton, styles.startButton]} onPress={startMediation}>
								<Text style={styles.modalButtonText}>Start Mediation</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Main Chat Area */}
			<View style={styles.chatContainer}>
				<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
					{mode === "mediator" && !mediationReceiver && !activeMediation && (
						<View style={styles.mediationPrompt}>
							<Text style={styles.mediationTitle}>🤝 Mediator Mode</Text>
							<Text style={styles.mediationDescription}>
								Start a private mediation with your roommates. Each person responds separately, then AI
								helps find common ground.
							</Text>
							<TouchableOpacity
								style={styles.startMediationButton}
								onPress={() => setMediatorModalVisible(true)}
							>
								<Text style={styles.startMediationText}>Start New Mediation</Text>
							</TouchableOpacity>
						</View>
					)}

					{mode === "mediator" && activeMediation && (
						<View style={styles.mediationHeader}>
							<Text style={styles.mediationIssue}>Issue: {activeMediation.prompt}</Text>
							<View style={styles.participantStatus}>
								{activeMediation.participants?.map(participant => (
									<View key={participant} style={styles.participant}>
										<Text style={styles.participantName}>
											{participant === currentUser?.uid ? "You" : "Roommate"}
										</Text>
										<Text
											style={[
												styles.statusIndicator,
												activeMediation.responses?.[participant]
													? styles.responded
													: styles.pending,
											]}
										>
											{activeMediation.responses?.[participant] ? "✅ Responded" : "⏳ Waiting"}
										</Text>
									</View>
								))}
							</View>
						</View>
					)}

					<FlatList
						style={styles.chat}
						data={messages}
						renderItem={mode === "advice" ? renderItem : renderMediationItem}
						inverted
					/>

					<View style={styles.inputContainer}>
						{mode === "advice" && !outputting && (
							<TouchableOpacity onPress={resetChat} style={styles.actionButton}>
								<Text style={styles.actionButtonText}>Reset</Text>
							</TouchableOpacity>
						)}

						<TextInput
							style={styles.input}
							value={input}
							onChangeText={setInput}
							placeholder={mode === "advice" ? "Ask for advice..." : "Share your perspective..."}
						/>
						{mediationReceiver && (
							<TouchableOpacity
								onPress={sendMediationResponse}
								style={[styles.actionButton, outputting && { backgroundColor: "#ccc" }]}
								disabled={outputting}
							>
								<Text style={styles.actionButtonText}>Send</Text>
							</TouchableOpacity>
						)}

						{mode === "advice" ? (
							outputting ? (
								<TouchableOpacity
									onPress={() => (stopRef.current = true)}
									style={[styles.actionButton, styles.stopButton]}
								>
									<Text style={styles.actionButtonText}>Stop</Text>
								</TouchableOpacity>
							) : (
								<TouchableOpacity onPress={sendPrompt} style={styles.actionButton}>
									<Text style={styles.actionButtonText}>Send</Text>
								</TouchableOpacity>
							)
						) : (
							activeMediation &&
							!activeMediation.responses?.[currentUser?.uid] && (
								<TouchableOpacity onPress={submitMediationResponse} style={styles.actionButton}>
									<Text style={styles.actionButtonText}>Submit</Text>
								</TouchableOpacity>
							)
						)}
					</View>
				</KeyboardAvoidingView>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#FFF9C4" },
	modeToggle: {
		flexDirection: "row",
		margin: 12,
		backgroundColor: "#FFFFFF",
		borderRadius: 12,
		padding: 4,
		elevation: 2,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
	},
	modeButton: {
		flex: 1,
		paddingVertical: 12,
		alignItems: "center",
		borderRadius: 8,
	},
	activeMode: {
		backgroundColor: "#FFD166",
	},
	modeText: {
		fontSize: 14,
		fontWeight: "500",
		color: "#666",
	},
	activeModeText: {
		color: "#D84315",
		fontWeight: "600",
	},
	chatContainer: {
		flex: 1,
		marginHorizontal: 12,
		marginBottom: 12,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#FFCCBC",
		backgroundColor: "#fff",
	},
	chat: { flex: 1, padding: 10 },
	bubble: { maxWidth: "80%", marginVertical: 4, padding: 12, borderRadius: 12 },
	userBubble: { alignSelf: "flex-end", backgroundColor: "#FF9800" },
	botBubble: { alignSelf: "flex-start", backgroundColor: "#FFF3E0" },
	mediatorBubble: { alignSelf: "center", backgroundColor: "#C8E6C9" },
	bubbleText: { color: "#000" },
	inputContainer: {
		flexDirection: "row",
		padding: 12,
		borderTopWidth: 1,
		borderColor: "#FFCCBC",
		gap: 8,
	},
	input: {
		flex: 1,
		borderWidth: 1,
		borderColor: "#FFCCBC",
		borderRadius: 8,
		padding: 12,
		backgroundColor: "#FFF8E1",
	},
	actionButton: {
		backgroundColor: "#FF9800",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
	},
	stopButton: {
		backgroundColor: "#EF5350",
	},
	actionButtonText: {
		color: "white",
		fontWeight: "600",
	},
	// Mediation Styles
	mediationPrompt: {
		padding: 20,
		alignItems: "center",
		justifyContent: "center",
		flex: 1,
	},
	mediationTitle: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#D84315",
		marginBottom: 12,
	},
	mediationDescription: {
		fontSize: 16,
		color: "#666",
		textAlign: "center",
		marginBottom: 24,
		lineHeight: 22,
	},
	startMediationButton: {
		backgroundColor: "#4CAF50",
		paddingHorizontal: 24,
		paddingVertical: 16,
		borderRadius: 12,
	},
	startMediationText: {
		color: "white",
		fontSize: 16,
		fontWeight: "600",
	},
	mediationHeader: {
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#FFCCBC",
		backgroundColor: "#FFF8E1",
	},
	mediationIssue: {
		fontSize: 16,
		fontWeight: "600",
		color: "#D84315",
		marginBottom: 12,
	},
	participantStatus: {
		flexDirection: "row",
		justifyContent: "space-around",
	},
	participant: {
		alignItems: "center",
	},
	participantName: {
		fontSize: 14,
		fontWeight: "500",
		marginBottom: 4,
	},
	statusIndicator: {
		fontSize: 12,
		fontWeight: "500",
	},
	responded: {
		color: "#4CAF50",
	},
	pending: {
		color: "#FF9800",
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

	yesNo: {
		display: "flex",
		flexDirection: "row",
		gap: 10,
		padding: 4,
	},
	yesNoButton: {
		display: "flex",
		paddingBlock: 4,
		paddingInline: 8,
		borderRadius: 12,
		borderWidth: 1,
	},
	yes: {
		borderColor: "green",
	},
	no: {
		borderColor: "red",
	},
});
