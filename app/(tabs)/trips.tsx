import AppText from "@/components/ui/AppText";
import useColors from "@/hooks/use-colors";
import { View } from "react-native";

export default function Index() {
	const colors = useColors();
  return (
    <View
      style={{ backgroundColor: colors.surface(), flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      <AppText>Trips page</AppText>
    </View>
  );
}
