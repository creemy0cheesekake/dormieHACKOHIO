import "dotenv/config";

export default {
	expo: {
		name: "Dormie",
		slug: "dormie",
		scheme: "dormie",
		extra: {
			apiUrl: process.env.MAP_API_KEY,
		},
		android: {
			package: "com.nortonantivirus.dormie",
			config: {
				androidNavigationBar: {
					// 1. Force the navigation bar to be hidden (user preference permitting)
					visible: false,

					// 2. Make the background fully transparent (AARRGGBB format)
					// This ensures that even if a hint is shown, it's not a solid color.
					backgroundColor: "#00000000",
					borderBottomColor: "#00000000",

					// 3. Make the bar translucent so your app draws underneath it
					translucent: true,
				},
			},
		},
		ios: {
			bundleIdentifier: "com.nortonantivirus.dormie",
		},
	},
};
