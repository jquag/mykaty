import { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Waypoint } from '@/constants/waypoints';
import useColors from '@/hooks/use-colors';
import AppText from '@/components/ui/AppText';

interface Props {
	waypoint: Waypoint;
	onPress: () => void;
}

export default function TrailheadListItem({ waypoint, onPress }: Props) {
	const colors = useColors();

	const services = waypoint.services;
	const hasParking = services?.parking != null;
	const hasWater = services?.water != null;
	const hasRestroom = services?.restroom != null;
	const hasFood = services?.restaurant != null || services?.foodGrocery != null;
	const hasBikeRepair = services?.bikeShop != null || services?.bikeService != null || services?.bikeWorkStation != null;

	const iconColor = (available: boolean) => available ? colors.secondary() : colors.text(0.25);

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
			<View style={[styles.marker, { backgroundColor: colors.primary(.6) }]}>
				<AppText style={{
					color: colors.surface(),
				}}>TH</AppText>
			</View>
			<View style={styles.content}>
				<AppText style={styles.name}>{waypoint.name}</AppText>
				<View style={styles.services}>
					<ServiceChip label="Parking" available={hasParking}>
						<AppText style={[styles.parkingIcon, { color: iconColor(hasParking) }]}>P</AppText>
					</ServiceChip>
					<ServiceChip label="Water" available={hasWater}>
						<Ionicons name="water" size={18} color={iconColor(hasWater)} />
					</ServiceChip>
					<ServiceChip label="Restroom" available={hasRestroom}>
						<MaterialCommunityIcons name="human-male-female" size={18} color={iconColor(hasRestroom)} />
					</ServiceChip>
					<ServiceChip label="Food" available={hasFood}>
						<MaterialCommunityIcons name="silverware-fork-knife" size={16} color={iconColor(hasFood)} />
					</ServiceChip>
					<ServiceChip label="Bike repair" available={hasBikeRepair}>
						<MaterialCommunityIcons name="wrench" size={16} color={iconColor(hasBikeRepair)} />
					</ServiceChip>
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

function ServiceChip({ label, available, children }: { label: string; available: boolean; children: ReactNode }) {
	const colors = useColors();

	return (
		<View
			accessible
			accessibilityLabel={available ? label : `No ${label.toLowerCase()}`}
			style={[
				styles.serviceIcon,
				{
					borderColor: colors.border(),
					backgroundColor: available ? colors.secondary(0.15) : 'transparent',
				},
			]}
		>
			{children}
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
		alignItems: 'center',
		gap: 10,
		marginTop: 4,
		alignSelf: 'flex-start',
	},
	serviceIcon: {
		width: 36,
		height: 28,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 6,
		borderWidth: 1,
		overflow: 'hidden',
	},
	parkingIcon: {
		fontSize: 16,
		fontWeight: '700',
	},
	strike: {
		position: 'absolute',
		left: -8,
		right: -8,
		height: 1,
		transform: [{ rotate: '-38deg' }],
	},
	notes: {
		fontSize: 12,
		marginTop: 2,
	},
});
