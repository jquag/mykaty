import useColors from "@/hooks/use-colors";
import { StyleSheet, TextInput, TextInputProps } from "react-native";

export default function FormInput({ style, multiline, ...props }: TextInputProps) {
	const colors = useColors();

	return (
		<TextInput
			multiline={multiline}
			placeholderTextColor={colors.text(0.4)}
			style={[
				styles.input,
				multiline && styles.multiline,
				{
					color: colors.text(),
					borderColor: colors.text(0.2),
					backgroundColor: colors.text(0.04),
				},
				style,
			]}
			{...props}
		/>
	);
}

const styles = StyleSheet.create({
	input: {
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 10,
		fontSize: 16,
	},
	multiline: {
		minHeight: 100,
		textAlignVertical: 'top',
	},
});
