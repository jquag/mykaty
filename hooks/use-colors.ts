import { Colors } from "@/utils/theme";
import { useColorScheme } from "react-native";

export default function useColors() {
	const colorScheme = useColorScheme();
	return Colors[colorScheme ?? 'light'];
}
