import { Dimensions, Image, View, Pressable, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import Svg, { Defs, Filter, FeDropShadow, G, Path, Rect } from "react-native-svg";
import { useTheme } from "../hooks";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import icon from "../assets/favicon.png";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const CurvedBackground = ({ padding, colors }) => {
	const height = 100;
	const curveDepth = 40;

	const pathData = `M0,${height + padding} L0,0 Q${screenWidth / 2},${curveDepth} ${screenWidth},0 L${screenWidth},${
		height + padding
	} Z`;

	return (
		<Svg
			width={screenWidth}
			height={400}
			style={[StyleSheet.absoluteFillObject, { backgroundColor: "transparent" }]}
		>
			<Defs>
				<Filter id="shadow" x="-100%" y="-100%" width="300%" height="300%">
					<FeDropShadow dx="0" dy="0" stdDeviation="1" floodColor="#000" floodOpacity="0.5" />
				</Filter>
			</Defs>
			<Path d={pathData} filter="url(#shadow)" fill={colors.backgroundDarker} />
		</Svg>
	);
};

export default ({ state, descriptors, navigation }) => {
	const { colors } = useTheme();
	const insets = useSafeAreaInsets();

	return (
		<View style={[styles.container, { paddingBlock: insets.bottom }]}>
			<CurvedBackground padding={insets.bottom} colors={colors} />
			{state.routes.map((route, index) => {
				const { options } = descriptors[route.key];
				const isFocused = state.index === index;

				const onPress = () => {
					const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });

					if (!isFocused && !event.defaultPrevented) {
						router.push(route.name != "index" ? route.name : "/");
					}
				};

				return (
					<View key={route.key}>
						<Pressable onPress={onPress} style={styles.tabIcon}>
							<Image source={icon} style={styles.iconPics} />
							<Text style={{ color: isFocused ? colors.primary : colors.text }}>{options.title}</Text>
						</Pressable>
					</View>
				);
			})}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		left: 0,
		bottom: 0,
		right: 0,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingInline: 48,
	},
	iconPics: {
		height: 22,
		width: 22,
	},
	tabIcon: {
		display: "flex",
		alignItems: "center",
	},
});
