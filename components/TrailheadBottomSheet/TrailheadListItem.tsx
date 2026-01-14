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

	const hasParking = waypoint.services?.parking !== null;
	const hasWater = waypoint.services?.water !== null;
	const hasRestroom = waypoint.services?.restroom !== null;

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
			<View style={[styles.marker, { backgroundColor: colors.primary() }]}>
				<AppText style={{
					color: colors.surface(),
				}}>TH</AppText>
			</View>
			<View style={styles.content}>
				<AppText style={styles.name}>{waypoint.name}</AppText>
				<View style={[styles.services, { borderColor: colors.border() }]}>
					<View style={[styles.serviceIcon, { borderColor: colors.border() }]}>
						<AppText style={{
							fontSize: 16,
							fontWeight: '700',
							color: hasParking ? colors.secondary() : colors.text(0.2)
						}}
						>
							P
						</AppText>
					</View>
					<View style={[styles.serviceIcon, { borderColor: colors.border() }]}>
						<Ionicons
							name="water"
							size={18}
							color={hasWater ? colors.secondary() : colors.text(0.2)}
						/>
					</View>
					<View style={[styles.serviceIcon, { borderColor: colors.border() }]}>
						<MaterialCommunityIcons
							name="human-male-female"
							size={18}
							color={hasRestroom ? colors.secondary() : colors.text(0.2)}
						/>
					</View>
				</View>
				{waypoint.notes && (
					<AppText style={[styles.notes, { color: colors.text(0.6) }]} numberOfLines={1}>
						{waypoint.notes}
					</AppText>
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
		fontSize: 16,
		fontWeight: '600',
	},
	services: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		marginTop: 4,
		alignSelf: 'flex-start',
	},
	serviceIcon: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 6,
		borderWidth: 1,
	},
	notes: {
		fontSize: 12,
		marginTop: 2,
	},
});
