import useColors from "@/hooks/use-colors";
import { Text } from "react-native";

export default function AppText({ children, style, ...rest }: any) {
	const colors = useColors();
	return <Text style={[{color: colors.text(), fontSize: 16},style]} {...rest}>{children}</Text>;
}
