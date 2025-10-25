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
		},
		ios: {
			bundleIdentifier: "com.nortonantivirus.dormie",
		},
	},
};
