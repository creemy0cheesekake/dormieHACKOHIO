import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, ListRenderItem, Dimensions } from "react-native";

type PostData = {
	image: string;
	name: string;
	time: string;
	text: string;
	likes: number;
	comments: number;
};

const content: PostData[] = [
	{
		image: "https://randomuser.me/api/portraits/women/44.jpg",
		name: "Emily Carter",
		time: "10m",
		text: "Just finished a sunrise run through the park 🌅 Feeling so refreshed and alive.",
		likes: 87,
		comments: 12,
	},
	{
		image: "https://randomuser.me/api/portraits/men/32.jpg",
		name: "Alex Johnson",
		time: "25m",
		text: "Finally launched my portfolio site after weeks of late nights! 🚀 Check it out: alexjohnson.dev",
		likes: 153,
		comments: 34,
	},
	{
		image: "https://randomuser.me/api/portraits/women/68.jpg",
		name: "Sofia Nguyen",
		time: "1h",
		text: "Can anyone recommend good books on creative coding or generative art? 🎨👾",
		likes: 46,
		comments: 9,
	},
	{
		image: "https://randomuser.me/api/portraits/men/14.jpg",
		name: "Marcus Reid",
		time: "2h",
		text: "There’s something magical about journaling by candlelight. Helps me reflect and stay grounded. 🔥📝",
		likes: 102,
		comments: 18,
	},
	{
		image: "https://randomuser.me/api/portraits/men/81.jpg",
		name: "Daniel Kim",
		time: "3h",
		text: "Can’t believe it’s been one year since I moved to NYC. So much has changed. Grateful for the journey.",
		likes: 224,
		comments: 41,
	},
	{
		image: "https://randomuser.me/api/portraits/women/12.jpg",
		name: "Hannah Brooks",
		time: "5h",
		text: "Spent the weekend off-grid in the mountains. No signal, just stars, streams, and serenity. 🌌⛰️",
		likes: 192,
		comments: 26,
	},
	{
		image: "https://randomuser.me/api/portraits/men/55.jpg",
		name: "Jason Li",
		time: "7h",
		text: "🐉 Just rewatched *Spirited Away* — Miyazaki never misses. What’s your favorite Studio Ghibli film?",
		likes: 309,
		comments: 59,
	},
	{
		image: "https://randomuser.me/api/portraits/women/23.jpg",
		name: "Natalie Perez",
		time: "12h",
		text: "Tried making homemade pasta for the first time. Flour everywhere, but totally worth it. 🍝😂",
		likes: 141,
		comments: 19,
	},
];

interface PostProps {
	image: string;
	name: string;
	time: string;
	text: string;
	initialLikes: number;
	comments: number;
}

const Post: React.FC<PostProps> = ({ image, name, time, text, initialLikes, comments }) => {
	const [likes, setLikes] = useState<number>(initialLikes);
	const [liked, setLiked] = useState<boolean>(false);

	const toggleLike = () => {
		setLiked(!liked);
		setLikes(prev => (liked ? prev - 1 : prev + 1));
	};

	return (
		<View style={styles.postContainer}>
			{/* Header */}
			<View style={styles.header}>
				<Image source={{ uri: image }} style={styles.avatar} />
				<View style={styles.headerText}>
					<Text style={styles.name}>{name}</Text>
					<Text style={styles.time}>{time}</Text>
				</View>
			</View>

			{/* Content */}
			<Text style={styles.content}>{text}</Text>

			{/* Footer */}
			<View style={styles.footer}>
				{/* Comment Button */}
				<TouchableOpacity style={styles.commentButton}>
					<Text style={styles.commentText}>💬 {comments} comments</Text>
				</TouchableOpacity>

				{/* Like Button and Count */}
				<View style={styles.likeSection}>
					<TouchableOpacity onPress={toggleLike} style={styles.likeButton}>
						<Text style={[styles.likeText, liked && styles.liked]}>{liked ? "❤️" : "🤍"}</Text>
					</TouchableOpacity>
					<Text style={styles.likeCount}>{likes}</Text>
				</View>
			</View>
		</View>
	);
};

const PostList: React.FC = () => {
	const renderItem: ListRenderItem<PostData> = ({ item }) => (
		<Post
			image={item.image}
			name={item.name}
			time={item.time}
			text={item.text}
			initialLikes={item.likes}
			comments={item.comments}
		/>
	);

	return (
		<FlatList
			data={content}
			keyExtractor={(_, index) => index.toString()}
			renderItem={renderItem}
			contentContainerStyle={styles.listContainer}
		/>
	);
};

export default PostList;

const screenWidth = Dimensions.get("window").width;

const styles = StyleSheet.create({
	listContainer: {
		padding: 12,
		backgroundColor: "#f5f5f5",
	},
	postContainer: {
		backgroundColor: "#fff",
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
		width: screenWidth - 24,
		alignSelf: "center",
		shadowColor: "#000",
		shadowOpacity: 0.1,
		shadowRadius: 6,
		elevation: 3,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8,
	},
	avatar: {
		width: 42,
		height: 42,
		borderRadius: 21,
		backgroundColor: "#ccc",
		marginRight: 10,
	},
	headerText: {
		flexDirection: "column",
	},
	name: {
		fontWeight: "bold",
		fontSize: 16,
	},
	time: {
		color: "#888",
		fontSize: 12,
	},
	content: {
		fontSize: 15,
		marginVertical: 10,
	},
	footer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	commentButton: {
		paddingVertical: 6,
		paddingHorizontal: 12,
	},
	commentText: {
		fontSize: 14,
		color: "#0077cc",
	},
	likeSection: {
		flexDirection: "row",
		alignItems: "center",
	},
	likeButton: {
		marginRight: 8,
	},
	likeText: {
		fontSize: 15,
	},
	liked: {
		color: "#e63946",
	},
	likeCount: {
		color: "#666",
		fontSize: 14,
	},
});
