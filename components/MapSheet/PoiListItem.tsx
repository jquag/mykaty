import { View, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Poi } from '@/constants/pois';
import useColors from '@/hooks/use-colors';
import AppText from '@/components/ui/AppText';
import { formatMilesFromTrail, getCategoryConfig, getSubcategoryLabel } from '@/utils/pois';

interface Props {
	poi: Poi;
	onPress: () => void;
}

export default function PoiListItem({ poi, onPress }: Props) {
	const colors = useColors();
	const category = getCategoryConfig(poi.category);

	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [
				styles.container,
				{
					backgroundColor: pressed ? colors.primary(0.1) : 'transparent',
					borderBottomColor: colors.border(),
				}
			]}
		>
			<View style={[styles.marker, { backgroundColor: category.color }]}>
				<MaterialCommunityIcons name={category.icon} size={18} color={colors.white()} />
			</View>
			<View style={styles.content}>
				<AppText style={styles.name} numberOfLines={1}>{poi.name}</AppText>
				<AppText style={[styles.details, { color: colors.text(0.6) }]} numberOfLines={1}>
					{getSubcategoryLabel(poi)} · {formatMilesFromTrail(poi.milesFromTrail)}
				</AppText>
				{poi.acrossRiver && (
					<AppText style={[styles.details, { color: colors.secondary() }]}>Across the river, via bridge</AppText>
				)}
			</View>
			<Ionicons
				name="chevron-forward"
				size={20}
				color={colors.text(0.4)}
			/>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingVertical: 12,
		paddingHorizontal: 4,
		borderBottomWidth: 1,
	},
	marker: {
		width: 30,
		height: 30,
		borderRadius: 6,
		marginRight: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	content: {
		flex: 1,
	},
	name: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 2,
	},
	details: {
		fontSize: 13,
	},
});
