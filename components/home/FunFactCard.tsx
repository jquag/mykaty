import AppText from "@/components/ui/AppText";
import ImageViewer from "@/components/ui/ImageViewer";
import { useFunFacts } from "@/contexts/FunFactsContext";
import useColors from "@/hooks/use-colors";
import type { FunFact } from "@/types/FunFact";
import { getFactImage, getFactOfTheDay, getFactTitle, getFactTrailhead } from "@/utils/fun-facts";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

const IMAGE_SIZE = 96;

function getMapParams(fact: FunFact) {
	const location = fact.location;
	if (!location) return null;
	if ('trailhead' in location) return { trailhead: location.trailhead };
	return { lat: location.lat, lng: location.lng, label: fact.title };
}

interface Props {
	now: Date;
}

export default function FunFactCard({ now }: Props) {
	const colors = useColors();
	const router = useRouter();
	const [viewingImage, setViewingImage] = useState(false);
	const fact = getFactOfTheDay(useFunFacts(), now);
	if (!fact) return null;

	const title = getFactTitle(fact);
	const image = getFactImage(fact);
	const mapParams = getMapParams(fact);

	return (
		<View style={[styles.card, { borderColor: colors.text(0.1) }]}>
			<Pressable
				onPress={() => setViewingImage(true)}
				disabled={!image}
				style={({ pressed }) => [styles.imageTile, { backgroundColor: colors.text(0.06), opacity: pressed ? 0.6 : 1 }]}
				accessible={!!image}
				accessibilityRole={image ? 'imagebutton' : undefined}
				accessibilityLabel={image ? 'View larger photo' : undefined}
			>
				<MaterialCommunityIcons name="lightbulb-on-outline" size={36} color={colors.text(0.35)} />
				{image && <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />}
				{image && (
					<View style={styles.expandBadge}>
						<MaterialCommunityIcons name="arrow-expand" size={12} color="white" />
					</View>
				)}
			</Pressable>
			<View style={styles.content}>
				<AppText style={[styles.label, { color: colors.text(0.6) }]}>
					{getFactTrailhead(fact) && !fact.title ? 'Featured trailhead' : 'Did you know?'}
				</AppText>
				{title && <AppText style={styles.title}>{title}</AppText>}
				<AppText style={[styles.text, { color: colors.text(0.75) }]}>{fact.text}</AppText>
				{mapParams && (
					<Pressable onPress={() => router.navigate({ pathname: '/map', params: mapParams })} hitSlop={8} style={styles.link} accessibilityRole="link">
						<AppText style={[styles.linkText, { color: colors.primary() }]}>View on map</AppText>
						<MaterialCommunityIcons name="chevron-right" size={18} color={colors.primary()} />
					</Pressable>
				)}
			</View>
			{image && <ImageViewer visible={viewingImage} source={image} caption={title} onClose={() => setViewingImage(false)} />}
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		flexDirection: 'row',
		gap: 12,
		borderWidth: 1,
		borderRadius: 12,
		padding: 12,
	},
	imageTile: {
		width: IMAGE_SIZE,
		height: IMAGE_SIZE,
		borderRadius: 8,
		overflow: 'hidden',
		alignItems: 'center',
		justifyContent: 'center',
	},
	expandBadge: {
		position: 'absolute',
		right: 4,
		bottom: 4,
		padding: 3,
		borderRadius: 10,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	content: {
		flex: 1,
		gap: 2,
	},
	label: {
		fontSize: 13,
	},
	title: {
		fontSize: 17,
		fontWeight: 'bold',
	},
	text: {
		fontSize: 14,
		lineHeight: 19,
	},
	link: {
		flexDirection: 'row',
		alignItems: 'center',
		alignSelf: 'flex-start',
		marginTop: 4,
	},
	linkText: {
		fontSize: 14,
		fontWeight: '700',
	},
});
