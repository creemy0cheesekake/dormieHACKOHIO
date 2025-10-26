import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Post } from "../../components";

const Social = () => {
	const tabBarHeight = useBottomTabBarHeight();
	const posts = [
		{
			id: "1",
			profileImage: "https://randomuser.me/api/portraits/men/1.jpg",
			profileName: "John Doe",
			content:
				"Just finished my morning hike! The view was absolutely breathtaking. Nature always helps me clear my mind and start the day fresh.",
			initialLikes: 24,
			initialComments: 5,
			isLiked: false,
		},
		{
			id: "2",
			profileImage: "https://randomuser.me/api/portraits/women/2.jpg",
			profileName: "Jane Smith",
			content:
				"Working on a new project that I'm really excited about. Can't wait to share more details soon! #coding #webdev",
			initialLikes: 42,
			initialComments: 8,
			isLiked: true,
		},
		{
			id: "3",
			profileImage: "https://randomuser.me/api/portraits/men/3.jpg",
			profileName: "Mike Johnson",
			content: "Just adopted this little guy from the shelter. Everyone meet Max! 🐶",
			initialLikes: 87,
			initialComments: 12,
			isLiked: false,
		},
		{
			id: "4",
			profileImage: "https://randomuser.me/api/portraits/women/4.jpg",
			profileName: "Sarah Williams",
			content:
				"Weekend getaway with friends was much needed! So grateful for these moments and these people in my life. ❤️",
			initialLikes: 56,
			initialComments: 7,
			isLiked: false,
		},
		{
			id: "5",
			profileImage: "https://randomuser.me/api/portraits/men/5.jpg",
			profileName: "David Brown",
			content:
				"Just published my latest article on machine learning applications in healthcare. Check it out if you're interested in the intersection of tech and medicine!",
			initialLikes: 32,
			initialComments: 4,
			isLiked: false,
		},
	];

	return (
		<SafeAreaView contentContainerStyle={{ paddingBottom: tabBarHeight + 30 }}>
			<ScrollView contentContainerStyle={{ paddingBottom: tabBarHeight + 30 }} style={styles.container}>
				{posts.map(post => (
					<Post
						key={post.id}
						id={post.id}
						profileImage={post.profileImage}
						profileName={post.profileName}
						content={post.content}
						initialLikes={post.initialLikes}
						initialComments={post.initialComments}
						isLiked={post.isLiked}
					/>
				))}
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingTop: 10,
	},
});

export default Social;
