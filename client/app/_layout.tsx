import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar, Platform, AppState } from "react-native";
import * as NavigationBar from "expo-navigation-bar";

const useImmersiveMode = () => {
	useEffect(() => {
		if (Platform.OS === "android") {
			const setImmersiveMode = async () => {
				try {
					await NavigationBar.setBehaviorAsync("overlay-swipe");
					await NavigationBar.setVisibilityAsync("hidden");
					await NavigationBar.setBackgroundColorAsync("#00000000");
				} catch (e) {
					console.warn("Error setting navigation bar properties:", e);
				}
			};

			setImmersiveMode();
			const subscription = AppState.addEventListener("change", state => {
				if (state === "active") {
					setImmersiveMode();
				}
			});
			return () => subscription.remove();
		}
	}, []);
};

export default function RootLayout() {
	useImmersiveMode();
	return (
		<Stack>
			<StatusBar backgroundColor="#FFD166" barStyle="dark-content" />
			<Stack.Screen name="Login" options={{ headerShown: false }} />
			<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
		</Stack>
	);
}
