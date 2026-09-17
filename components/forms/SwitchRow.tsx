import AppText from "@/components/ui/AppText";
import useColors from "@/hooks/use-colors";
import { Switch, View } from "react-native";

interface Props {
	label: string;
	description?: string;
	value: boolean;
	onValueChange: (value: boolean) => void;
}

export default function SwitchRow({ label, description, value, onValueChange }: Props) {
	const colors = useColors();

	return (
		<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
			<View style={{ flex: 1, gap: 2 }}>
				<AppText style={{ fontWeight: '600' }}>{label}</AppText>
				{description && (
					<AppText style={{ fontSize: 13, color: colors.text(0.6) }}>{description}</AppText>
				)}
			</View>
			<Switch
				value={value}
				onValueChange={onValueChange}
				trackColor={{ true: colors.primary(), false: colors.text(0.2) }}
			/>
		</View>
	);
}
