import { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, TextInput, View, Button, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

const ENDPOINT = "https://grain-therapist-width-chemical.trycloudflare.com/chat";

export default function App() {
	const tabBarHeight = useBottomTabBarHeight();
	const [messages, setMessages] = useState([]);
	const [convoId, setConvoId] = useState(null);
	const [input, setInput] = useState("");
	const [outputting, setOutputting] = useState(false);

	const stopRef = useRef(false);

	const getNewConvoId = async () => {
		const res = await fetch(ENDPOINT);
		const data = await res.json();
		setConvoId(data.result);
	};

	const resetChat = () => {
		setMessages([]);
		stopRef.current = true; // also stop any running stream
		getNewConvoId();
	};

	useEffect(() => {
		getNewConvoId();
	}, []);

	const sendPrompt = async () => {
		if (!input.trim() || !convoId) return;
		stopRef.current = false; // reset stop flag

		const userMsg = { id: Date.now().toString(), text: input, sender: "user" };
		setMessages(prev => [userMsg, ...prev]);

		const prompt = input;
		setInput("");

		try {
			const res = await fetch(ENDPOINT, {
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
			setMessages(prev => [
				{ id: Date.now().toString() + "-err", text: "⚠️ Error contacting server", sender: "bot" },
				...prev,
			]);
		}

		setOutputting(false);
	};

	const renderItem = ({ item }) => (
		<View style={[styles.bubble, item.sender === "user" ? styles.userBubble : styles.botBubble]}>
			<Text style={styles.bubbleText}>{item.text}</Text>
		</View>
	);

	return (
		<KeyboardAvoidingView
			style={[styles.container, { paddingBottom: tabBarHeight + 50 }]}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
		>
			<FlatList style={styles.chat} data={messages} renderItem={renderItem} inverted />

			<View style={styles.inputContainer}>
				{!outputting && <Button title="Reset" onPress={resetChat} />}
				<TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Say something..." />

				{outputting ? (
					<Button title="Stop" onPress={() => (stopRef.current = true)} />
				) : (
					<Button title="Send" onPress={sendPrompt} />
				)}
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#fff" },
	chat: { flex: 1, padding: 10 },
	bubble: { maxWidth: "80%", marginVertical: 4, padding: 10, borderRadius: 10 },
	userBubble: { alignSelf: "flex-end", backgroundColor: "#007aff" },
	botBubble: { alignSelf: "flex-start", backgroundColor: "#ececec" },
	bubbleText: { color: "#000" },
	inputContainer: { flexDirection: "row", padding: 10, borderTopWidth: 1, borderColor: "#ccc" },
	input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 5, padding: 10, marginRight: 8 },
});
