import AppText from "@/components/ui/AppText";
import useColors from "@/hooks/use-colors";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";

interface Props {
	icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
	message: string;
}

export default function NoticeCard({ icon, message }: Props) {
	const colors = useColors();

	return (
		<View style={[styles.card, { backgroundColor: colors.secondary(0.12), borderColor: colors.secondary(0.35) }]}>
			<MaterialCommunityIcons name={icon} size={20} color={colors.secondary()} />
			<AppText style={styles.message}>{message}</AppText>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		borderWidth: 1,
		borderRadius: 12,
		paddingVertical: 10,
		paddingHorizontal: 14,
	},
	message: {
		fontSize: 14,
		flexShrink: 1,
	},
});
