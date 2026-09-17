import AppText from "@/components/ui/AppText";
import useColors from "@/hooks/use-colors";
import type { ReactNode } from "react";
import { View } from "react-native";

interface Props {
	label: string;
	children: ReactNode;
}

export default function FormField({ label, children }: Props) {
	const colors = useColors();

	return (
		<View style={{ gap: 6 }}>
			<AppText style={{ fontSize: 14, fontWeight: '600', color: colors.text(0.7) }}>{label}</AppText>
			{children}
		</View>
	);
}
