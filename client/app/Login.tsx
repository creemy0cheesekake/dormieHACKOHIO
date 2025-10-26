import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login, register } from "../firebaseAuth";
import { StyleSheet, Text, TextInput, View, Image, Button, Dimensions, ImageBackground } from "react-native";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const Colors = {
	primary: "#FFD700",
	secondary: "#007AFF",
	background: "#F8F8F8",
	surface: "#FFFFFF",
	text: "#2C3E50",
	textSecondary: "#7F8C8D",
	border: "#BDC3C7",
	error: "#E74C3C",
};

const { height } = Dimensions.get("window");
const DORMIE_LOGO = require("../assets/Dormie.png");
const BACKGROUND_IMAGE = require("../assets/background.png");

type IconProps = {
	name: "User" | "Lock" | "Name";
	color?: string;
};

const Icon = ({ name, color = Colors.textSecondary }: IconProps) => {
	let symbol = "";
	if (name === "User") symbol = "👤";
	if (name === "Lock") symbol = "🔒";
	if (name === "Name") symbol = "📝";
	return <Text style={{ color, fontSize: 18, marginRight: 10 }}>{symbol}</Text>;
};

export default function Login() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [isSignUp, setIsSignUp] = useState(false);
	const router = useRouter();

	const handleAuth = async () => {
		try {
			let userCred;
			if (isSignUp) {
				userCred = await register(email, password);
				const uid = userCred.user.uid;

				await setDoc(doc(db, "users", uid), {
					Name: name,
				});
			} else {
				userCred = await login(email, password);
			}

			const userData = {
				uid: userCred.user.uid,
				email: userCred.user.email,
			};
			await AsyncStorage.setItem("user", JSON.stringify(userData));
			router.replace("/(tabs)");
		} catch (e: any) {
			setError(e.message);
		}
	};

	return (
		<ImageBackground source={BACKGROUND_IMAGE} style={styles.background} resizeMode="cover">
			<SafeAreaView style={styles.safeArea}>
				<View style={styles.content}>
					<Image source={DORMIE_LOGO} style={styles.logo} resizeMode="contain" />
					<Text style={styles.title}>{isSignUp ? "Create Account" : "Log In"}</Text>

					{isSignUp && (
						<View style={styles.inputContainer}>
							<Icon name="Name" />
							<TextInput
								placeholder="Full Name"
								value={name}
								onChangeText={setName}
								style={styles.input}
								placeholderTextColor={Colors.textSecondary}
							/>
						</View>
					)}

					<View style={styles.inputContainer}>
						<Icon name="User" />
						<TextInput
							placeholder="Email"
							value={email}
							onChangeText={setEmail}
							autoCapitalize="none"
							style={styles.input}
							placeholderTextColor={Colors.textSecondary}
						/>
					</View>

					<View style={styles.inputContainer}>
						<Icon name="Lock" />
						<TextInput
							placeholder="Password"
							value={password}
							onChangeText={setPassword}
							secureTextEntry
							style={styles.input}
							placeholderTextColor={Colors.textSecondary}
						/>
					</View>

					<View style={styles.buttonWrapper}>
						<Button
							title={isSignUp ? "Create Account" : "Login"}
							onPress={handleAuth}
							color={Colors.primary}
						/>
					</View>

					<Text
						onPress={() => {
							setIsSignUp(!isSignUp);
							setError("");
						}}
						style={styles.toggleLinkText}
					>
						{isSignUp ? "Already have an account? Log in" : "No account? Sign up"}
					</Text>

					{error ? <Text style={styles.errorText}>{error}</Text> : null}
				</View>
			</SafeAreaView>
		</ImageBackground>
	);
}

const styles = StyleSheet.create({
	background: {
		flex: 1,
		width: "100%",
		height: "100%",
	},
	safeArea: {
		flex: 1,
		paddingHorizontal: 24,
		justifyContent: "center",
	},
	content: {
		alignItems: "center",
		width: "100%",
		padding: 20,
		backgroundColor: "rgba(255,255,255,0.85)",
		borderRadius: 20,
		elevation: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
	},
	logo: {
		width: 250,
		height: 60,
		marginBottom: 40,
	},
	title: {
		fontSize: 24,
		fontWeight: "700",
		color: Colors.text,
		marginBottom: 20,
	},
	inputContainer: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: Colors.surface,
		borderWidth: 1,
		borderColor: Colors.border,
		borderRadius: 12,
		paddingHorizontal: 16,
		marginBottom: 16,
		width: "100%",
		height: 55,
	},
	input: {
		flex: 1,
		height: "100%",
		fontSize: 15,
		color: Colors.text,
	},
	buttonWrapper: {
		width: "100%",
		marginTop: 10,
		borderRadius: 12,
		overflow: "hidden",
	},
	toggleLinkText: {
		color: Colors.secondary,
		marginTop: 10,
		fontSize: 14,
		fontWeight: "600",
	},
	errorText: {
		color: Colors.error,
		marginTop: 10,
		fontSize: 14,
		fontWeight: "500",
		textAlign: "center",
	},
});
