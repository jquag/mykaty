import { ReactNode, useMemo, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import useColors from '@/hooks/use-colors';

interface Props {
	partialOpenHeight: string | number;
	onClose: () => void;
	children: ReactNode;
}

export default function DetailBottomSheet({
	partialOpenHeight,
	onClose,
	children,
}: Props) {
	const colors = useColors();
	const bottomSheetRef = useRef<BottomSheet>(null);

	const snapPoints = useMemo(() => [partialOpenHeight, '95%'], [partialOpenHeight]);

	return (
		<BottomSheet
			ref={bottomSheetRef}
			index={0}
			snapPoints={snapPoints}
			enablePanDownToClose
			onClose={onClose}
			backgroundStyle={{ backgroundColor: colors.surface() }}
			handleIndicatorStyle={{ backgroundColor: colors.secondary() }}
			enableDynamicSizing={false}
		>
			{children}
			<Pressable
				style={[styles.closeButton, { backgroundColor: colors.surface(.5) }]}
				onPress={() => bottomSheetRef.current?.close()}
				hitSlop={8}
				accessibilityLabel="Close"
			>
				<Ionicons name="close" size={24} color={colors.text()} />
			</Pressable>
		</BottomSheet>
	);
}

// Layout shared by the views shown inside the sheet
export const detailStyles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	header: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		paddingRight: 48,
	},
	name: {
		fontSize: 24,
		fontWeight: '700',
	},
	section: {
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	sectionTitle: {
		fontSize: 12,
		fontWeight: '600',
		textTransform: 'uppercase',
		marginBottom: 8,
	},
});

const styles = StyleSheet.create({
	closeButton: {
		position: 'absolute',
		top: 8,
		right: 12,
		padding: 4,
		borderRadius: 20,
	},
});
