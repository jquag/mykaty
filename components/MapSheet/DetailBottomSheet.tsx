import { ReactNode, useMemo } from 'react';
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

	const snapPoints = useMemo(() => [partialOpenHeight, '95%'], [partialOpenHeight]);

	return (
		<BottomSheet
			index={0}
			snapPoints={snapPoints}
			enablePanDownToClose
			onClose={onClose}
			backgroundStyle={{ backgroundColor: colors.surface() }}
			handleIndicatorStyle={{ backgroundColor: colors.secondary() }}
			enableDynamicSizing={false}
		>
			{children}
		</BottomSheet>
	);
}
