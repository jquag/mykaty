import AppText from "@/components/ui/AppText";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ImageSourcePropType, Modal, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
	visible: boolean;
	source: ImageSourcePropType;
	caption?: string;
	onClose: () => void;
}

/** A photo shown full screen over a dark backdrop; tapping anywhere closes it */
export default function ImageViewer({ visible, source, caption, onClose }: Props) {
	const insets = useSafeAreaInsets();

	return (
		<Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
			<Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close photo">
				<Image source={source} style={styles.image} contentFit="contain" />
				{caption && (
					<AppText style={[styles.caption, { bottom: insets.bottom + 24 }]}>{caption}</AppText>
				)}
			</Pressable>
			<Pressable
				onPress={onClose}
				hitSlop={12}
				style={[styles.close, { top: insets.top + 12 }]}
				accessibilityRole="button"
				accessibilityLabel="Close"
			>
				<Ionicons name="close" size={24} color="white" />
			</Pressable>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.92)',
		justifyContent: 'center',
	},
	image: {
		width: '100%',
		height: '100%',
	},
	caption: {
		position: 'absolute',
		left: 24,
		right: 24,
		textAlign: 'center',
		color: 'white',
		fontSize: 17,
		fontWeight: '600',
	},
	close: {
		position: 'absolute',
		right: 16,
		padding: 8,
		borderRadius: 20,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
});
