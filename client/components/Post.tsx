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
					<Text style={styles.profileName}>{profileName}</Text>
				</View>

				<TouchableOpacity onPress={() => setMenuVisible(true)}>
					<Text style={styles.menuDots}>⋮</Text>
				</TouchableOpacity>

				{/* Menu Modal */}
				<Modal transparent={true} visible={menuVisible} onRequestClose={() => setMenuVisible(false)}>
					<Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
						<View style={styles.menuContainer}>
							<TouchableOpacity style={styles.menuItem} onPress={handleHide}>
								<Text style={styles.menuText}>Hide Post</Text>
							</TouchableOpacity>
							<TouchableOpacity style={styles.menuItem} onPress={handleReport}>
								<Text style={[styles.menuText, styles.reportText]}>Report</Text>
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
					<Image
						source={{ uri: "https://cdn-icons-png.flaticon.com/512/1380/1380338.png" }}
						style={styles.footerIcon}
					/>
					<Text style={styles.footerText}>{comments}</Text>
				</TouchableOpacity>

				<TouchableOpacity style={styles.footerButton} onPress={handleLike}>
					<Image
						source={{
							uri: isLiked
								? "https://cdn-icons-png.flaticon.com/512/833/833472.png"
								: "https://cdn-icons-png.flaticon.com/512/1077/1077035.png",
						}}
						style={styles.footerIcon}
					/>
					<Text style={styles.footerText}>{likes}</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
	container: {
		width: width - 20,
		margin: 10,
		padding: 15,
		backgroundColor: "#fff",
		borderRadius: 10,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 10,
	},
	profileContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	profileImage: {
		width: 40,
		height: 40,
		borderRadius: 20,
		marginRight: 10,
	},
	profileName: {
		fontWeight: "bold",
		fontSize: 16,
	},
	menuDots: {
		fontSize: 24,
		color: "#666",
		paddingHorizontal: 10,
	},
	content: {
		fontSize: 14,
		lineHeight: 20,
		marginBottom: 15,
	},
	footer: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingTop: 10,
	},
	footerButton: {
		flexDirection: "row",
		alignItems: "center",
	},
	footerIcon: {
		width: 20,
		height: 20,
		marginRight: 5,
	},
	footerText: {
		fontSize: 14,
		color: "#666",
	},
	modalOverlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.5)",
	},
	menuContainer: {
		backgroundColor: "white",
		borderRadius: 8,
		padding: 10,
		width: 150,
	},
	menuItem: {
		paddingVertical: 10,
		paddingHorizontal: 15,
	},
	menuText: {
		fontSize: 16,
	},
	reportText: {
		color: "red",
	},
});

export default Post;
