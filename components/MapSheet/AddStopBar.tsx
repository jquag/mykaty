import AppText from '@/components/ui/AppText';
import useColors from '@/hooks/use-colors';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

interface Props {
	distance: string;
	disabledReason?: string;
	onAdd: () => void;
}

export default function AddStopBar({ distance, disabledReason, onAdd }: Props) {
	const colors = useColors();
	const disabled = disabledReason !== undefined;

	return (
		<View style={styles.container}>
			<View style={styles.distanceRow}>
				<MaterialCommunityIcons name="map-marker-distance" size={18} color={colors.primary()} />
				<AppText style={styles.distance}>{distance}</AppText>
			</View>
			<Pressable
				onPress={onAdd}
				disabled={disabled}
				accessibilityRole="button"
				accessibilityState={{ disabled }}
				style={({ pressed }) => [
					styles.button,
					{ backgroundColor: disabled ? colors.text(0.15) : colors.primary(pressed ? 0.8 : 1) },
				]}
			>
				{!disabled && <Ionicons name="add-circle-outline" size={18} color={colors.surface()} />}
				<AppText style={[styles.buttonLabel, { color: disabled ? colors.text(0.6) : colors.surface() }]}>
					{disabledReason ?? 'Add stop'}
				</AppText>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		gap: 10,
		paddingHorizontal: 16,
		paddingBottom: 8,
	},
	distanceRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	distance: {
		flexShrink: 1,
		fontWeight: '600',
	},
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		paddingVertical: 10,
		borderRadius: 8,
	},
	buttonLabel: {
		fontWeight: '700',
	},
});
