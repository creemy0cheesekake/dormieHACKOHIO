import { useState } from "react";
import { useColorScheme } from "react-native";

export default () => {
	const [theme, setTheme] = useState(useColorScheme() === "light" ? "light" : "dark");

	const lightThemeColors = {
		primary: "#007AFF",
		background: "#F2F2F2",
		backgroundDarker: "#FFE0B2",
		card: "#FFFFFF",
		text: "#1C1C1E",
		border: "#D8D8D8",
		notification: "#FF3B30",
	};

	const darkThemeColors = {
		primary: "#0A84FF",
		background: "#010101",
		card: "#121212",
		text: "#E5E5E7",
		border: "#272729",
		notification: "#FF453A",
	};

	const colors = theme === "light" ? lightThemeColors : darkThemeColors;

	return {
		colors,
		theme,
		toggleTheme: () => setTheme(prev => (prev == "light" ? "dark" : "light")),
	};
};
