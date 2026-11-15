import { View, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Waypoint } from '@/constants/waypoints';
import { ServiceKey, hasService } from '@/constants/services';
import useColors from '@/hooks/use-colors';
import AppText from '@/components/ui/AppText';
import ServiceIcon from './ServiceIcon';

interface Props {
	waypoint: Waypoint;
	onPress: () => void;
}

interface ChipConfig {
	label: string;
	icon: ServiceKey;
	/** The chip is lit when any of these services is present */
	services: ServiceKey[];
}

const CHIPS: ChipConfig[] = [
	{ label: 'Parking', icon: 'parking', services: ['parking'] },
	{ label: 'Water', icon: 'water', services: ['water'] },
	{ label: 'Restroom', icon: 'restroom', services: ['restroom'] },
	{ label: 'Food', icon: 'restaurant', services: ['restaurant', 'foodGrocery'] },
	{ label: 'Bike repair', icon: 'bikeService', services: ['bikeShop', 'bikeService'] },
];

const CHIP_WIDTH = 36;
const CHIP_HEIGHT = 28;
const STRIKE_ANGLE = `${-Math.atan2(CHIP_HEIGHT, CHIP_WIDTH) * 180 / Math.PI}deg`;

export default function TrailheadListItem({ waypoint, onPress }: Props) {
	const colors = useColors();

	const chips = CHIPS.map(chip => ({
		...chip,
		available: chip.services.some(key => hasService(waypoint.services, key)),
	}));

	const accessibilityLabel = [
		waypoint.name,
		...chips.map(({ label, available }) => available ? label : `no ${label.toLowerCase()}`),
	].join(', ');

	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			style={({ pressed }) => [
				styles.container,
				{
					backgroundColor: pressed ? colors.primary(0.1) : 'transparent',
					borderBottomColor: colors.border(),
				}
			]}
		>
			<View style={[styles.marker, { backgroundColor: colors.primary(.6) }]}>
				<AppText style={{
					color: colors.surface(),
				}}>TH</AppText>
			</View>
			<View style={styles.content}>
				<AppText style={styles.name}>{waypoint.name}</AppText>
				<View style={styles.services}>
					{chips.map(chip => (
						<ServiceChip key={chip.label} icon={chip.icon} available={chip.available} />
					))}
				</View>
			</View>
			<Ionicons
				name="chevron-forward"
				size={20}
				color={colors.text(0.4)}
			/>
		</Pressable>
	);
}

function ServiceChip({ icon, available }: { icon: ServiceKey; available: boolean }) {
	const colors = useColors();

	return (
		<View
			style={[
				styles.chip,
				{
					borderColor: colors.border(),
					backgroundColor: available ? colors.secondary(0.15) : 'transparent',
				},
			]}
		>
			<ServiceIcon service={icon} color={available ? colors.onSecondaryTint() : colors.text(0.25)} />
			{!available && <View style={[styles.strike, { backgroundColor: colors.text(0.2) }]} />}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 10,
		paddingVertical: 12,
		paddingHorizontal: 4,
		borderBottomWidth: 1,
	},
	marker: {
		borderRadius: 6,
		marginRight: 12,
		padding: 4
	},
	content: {
		flex: 1,
	},
	name: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 4,
	},
	services: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: 10,
		marginTop: 4,
		alignSelf: 'flex-start',
	},
	chip: {
		width: CHIP_WIDTH,
		height: CHIP_HEIGHT,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 6,
		borderWidth: 1,
		overflow: 'hidden',
	},
	strike: {
		position: 'absolute',
		left: -8,
		right: -8,
		height: 1,
		transform: [{ rotate: STRIKE_ANGLE }],
	},
});
