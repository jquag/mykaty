import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts, Fraunces_400Regular, Fraunces_700Bold } from "@expo-google-fonts/fraunces";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const [fontsLoaded] = useFonts({
		Fraunces_400Regular,
		Fraunces_700Bold,
	});

	useEffect(() => {
		if (fontsLoaded) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded]);

	if (!fontsLoaded) {
		return null;
	}

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<Stack>
				<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
			</Stack>
		</GestureHandlerRootView>
	);
}
