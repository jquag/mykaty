import AppText from "@/components/ui/AppText";
import { useFunFacts } from "@/contexts/FunFactsContext";
import useColors from "@/hooks/use-colors";
import type { FunFact } from "@/types/FunFact";
import { getFactImage, getFactOfTheDay, getFactTitle, getFactTrailhead } from "@/utils/fun-facts";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

const IMAGE_SIZE = 96;

function getMapParams(fact: FunFact) {
	const location = fact.location;
	if (!location) return null;
	if ('trailhead' in location) return { trailhead: location.trailhead };
	return { lat: String(location.lat), lng: String(location.lng), label: getFactTitle(fact) ?? '' };
}

interface Props {
	now: Date;
}

export default function FunFactCard({ now }: Props) {
	const colors = useColors();
	const router = useRouter();
	const fact = getFactOfTheDay(useFunFacts(), now);
	if (!fact) return null;

	const title = getFactTitle(fact);
	const image = getFactImage(fact);
	const mapParams = getMapParams(fact);

	const viewOnMap = () => {
		if (mapParams) router.navigate({ pathname: '/map', params: mapParams });
	};

	return (
		<Pressable onPress={viewOnMap} disabled={!mapParams} style={[styles.card, { borderColor: colors.text(0.1) }]}>
			<View style={[styles.imageTile, { backgroundColor: colors.text(0.06) }]}>
				<MaterialCommunityIcons name="lightbulb-on-outline" size={36} color={colors.text(0.35)} />
				{image && <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />}
			</View>
			<View style={styles.content}>
				<AppText style={[styles.label, { color: colors.text(0.6) }]}>
					{getFactTrailhead(fact) ? 'Featured trailhead' : 'Did you know?'}
				</AppText>
				{title && <AppText style={styles.title}>{title}</AppText>}
				<AppText style={[styles.text, { color: colors.text(0.75) }]} numberOfLines={4}>{fact.text}</AppText>
				{mapParams && (
					<View style={styles.link}>
						<AppText style={[styles.linkText, { color: colors.primary() }]}>View on map</AppText>
						<MaterialCommunityIcons name="chevron-right" size={18} color={colors.primary()} />
					</View>
				)}
			</View>
		</Pressable>
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
		marginTop: 4,
	},
	linkText: {
		fontSize: 14,
		fontWeight: '700',
	},
});
