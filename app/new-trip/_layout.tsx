import useColors from "@/hooks/use-colors";
import { Fonts } from "@/utils/theme";
import { Stack } from "expo-router";

export default function NewTripLayout() {
	const colors = useColors();

	return (
		<Stack
			screenOptions={{
				headerStyle: { backgroundColor: colors.surface() },
				headerTitleStyle: {
					fontFamily: Fonts.heading,
					fontSize: 20,
					color: colors.text(),
				},
				headerTintColor: colors.primary(),
				headerShadowVisible: false,
				contentStyle: { backgroundColor: colors.surface() },
			}}
		>
			<Stack.Screen name="index" options={{ title: 'Choose Route' }} />
			<Stack.Screen name="details" options={{ title: 'Trip Details', headerBackTitle: 'Route' }} />
		</Stack>
	);
}
