import AppText from "@/components/ui/AppText";
import { getTrailheadImage, hasTrailheadPhoto } from "@/constants/trailheadImages";
import { waypoints } from "@/constants/waypoints";
import useColors from "@/hooks/use-colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, View } from "react-native";

const FEATURED = waypoints.filter(waypoint => waypoint.tidbit && hasTrailheadPhoto(waypoint));

// Changes once a day, the same for everyone on a given date
function getFeaturedTrailhead(now: Date) {
	if (FEATURED.length === 0) return null;
	const dayNumber = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000);
	return FEATURED[dayNumber % FEATURED.length];
}

interface Props {
	now: Date;
}

export default function FeaturedTrailheadCard({ now }: Props) {
	const colors = useColors();
	const router = useRouter();
	const waypoint = getFeaturedTrailhead(now);
	if (!waypoint) return null;

	const viewOnMap = () => {
		router.navigate({ pathname: '/map', params: { trailhead: waypoint.name } });
	};

	return (
		<Pressable onPress={viewOnMap} style={[styles.card, { borderColor: colors.text(0.1) }]}>
			<Image source={getTrailheadImage(waypoint)} style={styles.image} resizeMode="cover" />
			<View style={styles.content}>
				<AppText style={[styles.label, { color: colors.text(0.6) }]}>Featured trailhead</AppText>
				<AppText style={styles.name}>{waypoint.name}</AppText>
				<AppText style={[styles.tidbit, { color: colors.text(0.75) }]} numberOfLines={4}>{waypoint.tidbit}</AppText>
				<View style={styles.link}>
					<AppText style={[styles.linkText, { color: colors.primary() }]}>View on map</AppText>
					<MaterialCommunityIcons name="chevron-right" size={18} color={colors.primary()} />
				</View>
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
	image: {
		width: 96,
		height: 96,
		borderRadius: 8,
	},
	content: {
		flex: 1,
		gap: 2,
	},
	label: {
		fontSize: 13,
	},
	name: {
		fontSize: 17,
		fontWeight: 'bold',
	},
	tidbit: {
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
