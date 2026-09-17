import AppText from "@/components/ui/AppText";
import useColors from "@/hooks/use-colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";

interface Option<T extends string> {
	value: T;
	label: string;
	icon?: ComponentProps<typeof MaterialCommunityIcons>['name'];
}

interface Props<T extends string> {
	options: Option<T>[];
	value: T;
	onChange: (value: T) => void;
}

export default function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
	const colors = useColors();

	return (
		<View style={[styles.container, { borderColor: colors.text(0.2), backgroundColor: colors.text(0.04) }]}>
			{options.map(option => {
				const selected = option.value === value;
				const color = selected ? colors.surface() : colors.text();
				return (
					<Pressable
						key={option.value}
						onPress={() => onChange(option.value)}
						accessibilityRole="radio"
						accessibilityState={{ selected }}
						style={[styles.option, selected && { backgroundColor: colors.primary() }]}
					>
						{option.icon && <MaterialCommunityIcons name={option.icon} size={18} color={color} />}
						<AppText style={{ color, fontWeight: selected ? '700' : '400' }}>{option.label}</AppText>
					</Pressable>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		borderWidth: 1,
		borderRadius: 8,
		padding: 3,
		gap: 3,
	},
	option: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		paddingVertical: 8,
		borderRadius: 6,
	},
});
