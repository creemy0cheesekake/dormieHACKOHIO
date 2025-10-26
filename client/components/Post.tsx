import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Alert, Modal, Pressable } from "react-native";

type PostProps = {
	id: string;
	profileImage: string;
	profileName: string;
	content: string;
	initialLikes: number;
	initialComments: number;
	isLiked: boolean;
};

const Post: React.FC<PostProps> = ({
	id,
	profileImage,
	profileName,
	content,
	initialLikes,
	initialComments,
	isLiked: initialIsLiked,
}) => {
	const [likes, setLikes] = useState(initialLikes);
	const [isLiked, setIsLiked] = useState(initialIsLiked);
	const [comments] = useState(initialComments);
	const [menuVisible, setMenuVisible] = useState(false);

	const handleLike = () => {
		if (isLiked) {
			setLikes(likes - 1);
		} else {
			setLikes(likes + 1);
		}
		setIsLiked(!isLiked);
	};

	const handleReport = () => {
		setMenuVisible(false);
		Alert.alert("Report Post", "Are you sure you want to report this post?", [
			{ text: "Cancel", style: "cancel" },
			{ text: "Report", style: "destructive" },
		]);
	};

	const handleHide = () => {
		setMenuVisible(false);
		Alert.alert("Hide Post", "This post will be hidden from your feed.", [
			{ text: "Cancel", style: "cancel" },
			{ text: "Hide", style: "destructive" },
		]);
	};

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<View style={styles.profileContainer}>
					<Image source={{ uri: profileImage }} style={styles.profileImage} />
					<View style={styles.profileInfo}>
						<Text style={styles.profileName}>{profileName}</Text>
						<Text style={styles.postTime}>2h ago</Text>
					</View>
				</View>

				<TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
					<Text style={styles.menuDots}>⋯</Text>
				</TouchableOpacity>

				{/* Menu Modal */}
				<Modal transparent={true} visible={menuVisible} onRequestClose={() => setMenuVisible(false)}>
					<Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
						<View style={styles.menuContainer}>
							<TouchableOpacity style={styles.menuItem} onPress={handleHide}>
								<Text style={styles.menuText}>🙈 Hide Post</Text>
							</TouchableOpacity>
							<View style={styles.menuDivider} />
							<TouchableOpacity style={styles.menuItem} onPress={handleReport}>
								<Text style={[styles.menuText, styles.reportText]}>🚩 Report</Text>
							</TouchableOpacity>
						</View>
					</Pressable>
				</Modal>
			</View>

			{/* Content */}
			<Text style={styles.content}>{content}</Text>

			{/* Footer */}
			<View style={styles.footer}>
				<TouchableOpacity style={styles.footerButton}>
					<View style={styles.iconContainer}>
						<Text style={styles.footerIcon}>💬</Text>
					</View>
					<Text style={styles.footerText}>{comments}</Text>
				</TouchableOpacity>

				<TouchableOpacity style={styles.footerButton} onPress={handleLike}>
					<View style={styles.iconContainer}>
						<Text style={[styles.footerIcon, isLiked && styles.likedIcon]}>{isLiked ? "❤️" : "🤍"}</Text>
					</View>
					<Text style={[styles.footerText, isLiked && styles.likedText]}>{likes}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
	container: {
		width: width - 32,
		marginHorizontal: 16,
		marginVertical: 8,
		padding: 20,
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		elevation: 3,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		borderLeftWidth: 4,
		borderLeftColor: "#FFD166",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-start",
		marginBottom: 12,
	},
	profileContainer: {
		flexDirection: "row",
		alignItems: "center",
		flex: 1,
	},
	profileImage: {
		width: 44,
		height: 44,
		borderRadius: 22,
		marginRight: 12,
		borderWidth: 2,
		borderColor: "#FFE0B2",
	},
	profileInfo: {
		flex: 1,
	},
	profileName: {
		fontWeight: "600",
		fontSize: 16,
		color: "#D84315",
		marginBottom: 2,
	},
	postTime: {
		fontSize: 12,
		color: "#FF9800",
		fontWeight: "500",
	},
	menuButton: {
		padding: 8,
		borderRadius: 8,
		backgroundColor: "#FFF8E1",
	},
	menuDots: {
		fontSize: 20,
		color: "#FF9800",
		fontWeight: "bold",
	},
	content: {
		fontSize: 15,
		lineHeight: 22,
		color: "#2D3748",
		marginBottom: 16,
	},
	footer: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: "#FFE0B2",
	},
	footerButton: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 20,
		backgroundColor: "#FFF8E1",
	},
	iconContainer: {
		marginRight: 6,
	},
	footerIcon: {
		fontSize: 18,
	},
	likedIcon: {
		fontSize: 18,
	},
	footerText: {
		fontSize: 14,
		fontWeight: "500",
		color: "#666",
	},
	likedText: {
		color: "#E53E3E",
		fontWeight: "600",
	},
	modalOverlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.4)",
	},
	menuContainer: {
		backgroundColor: "#FFFFFF",
		borderRadius: 16,
		paddingVertical: 8,
		width: 180,
		elevation: 8,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
	},
	menuItem: {
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	menuText: {
		fontSize: 16,
		fontWeight: "500",
		color: "#2D3748",
	},
	reportText: {
		color: "#E53E3E",
	},
	menuDivider: {
		height: 1,
		backgroundColor: "#FFE0B2",
		marginHorizontal: 8,
	},
});

export default Post;
