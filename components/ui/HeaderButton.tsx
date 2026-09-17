import AppText from "@/components/ui/AppText";
import useColors from "@/hooks/use-colors";
import { Pressable } from "react-native";

interface Props {
	title: string;
	onPress: () => void;
	disabled?: boolean;
	emphasized?: boolean;
}

export default function HeaderButton({ title, onPress, disabled = false, emphasized = false }: Props) {
	const colors = useColors();

	return (
		<Pressable onPress={onPress} disabled={disabled} hitSlop={8} accessibilityRole="button">
			<AppText
				style={{
					fontSize: 17,
					fontWeight: emphasized ? '700' : '400',
					color: colors.primary(disabled ? 0.35 : 1),
				}}
			>
				{title}
			</AppText>
		</Pressable>
	);
}
