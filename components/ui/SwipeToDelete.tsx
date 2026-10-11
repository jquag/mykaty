import AppText from "@/components/ui/AppText";
import useColors from "@/hooks/use-colors";
import { ReactNode, useRef } from "react";
import { StyleSheet } from "react-native";
import { Pressable } from "react-native-gesture-handler";
import ReanimatedSwipeable, { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";

interface Props {
	children: ReactNode;
	onDelete: () => void;
	/** Called as the row starts being swiped open, so the list can close any other open row */
	onOpen?: (row: SwipeableMethods) => void;
}

export default function SwipeToDelete({ children, onDelete, onOpen }: Props) {
	const colors = useColors();
	const ref = useRef<SwipeableMethods>(null);

	return (
		<ReanimatedSwipeable
			ref={ref}
			friction={1.5}
			rightThreshold={40}
			overshootRight={false}
			onSwipeableOpenStartDrag={() => ref.current && onOpen?.(ref.current)}
			childrenContainerStyle={{ backgroundColor: colors.surface() }}
			renderRightActions={() => (
				<Pressable
					onPress={onDelete}
					accessibilityRole="button"
					style={[styles.action, { backgroundColor: colors.accent() }]}
				>
					<AppText style={{ color: colors.white(), fontWeight: '700' }}>Delete</AppText>
				</Pressable>
			)}
		>
			{children}
		</ReanimatedSwipeable>
	);
}

const styles = StyleSheet.create({
	action: {
		width: 88,
		alignItems: 'center',
		justifyContent: 'center',
	},
});
