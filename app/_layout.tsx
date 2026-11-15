import { FunFactsProvider } from "@/contexts/FunFactsContext";
import { PoisProvider } from "@/contexts/PoisContext";
import { TripsProvider } from "@/contexts/TripsContext";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export const unstable_settings = {
	anchor: '(tabs)',
};

export default function RootLayout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<TripsProvider>
				<PoisProvider>
					<FunFactsProvider>
						<Stack>
							<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
							<Stack.Screen name="new-trip" options={{ presentation: 'fullScreenModal', headerShown: false }} />
						</Stack>
					</FunFactsProvider>
				</PoisProvider>
			</TripsProvider>
		</GestureHandlerRootView>
	);
}
