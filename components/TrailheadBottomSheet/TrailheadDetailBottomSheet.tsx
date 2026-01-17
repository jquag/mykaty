import { useCallback, useMemo, useRef } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import BottomSheet from '@gorhom/bottom-sheet';
import { Waypoint } from '@/constants/waypoints';
import useColors from '@/hooks/use-colors';
import TrailheadDetail from './TrailheadDetail';

interface Props {
	waypoint: Waypoint;
	partialOpenHeight: string | number;
	onClose: () => void;
}

export default function TrailheadDetailBottomSheet({
	waypoint,
	partialOpenHeight,
	onClose,
}: Props) {
	const colors = useColors();
	const bottomSheetRef = useRef<BottomSheet>(null);
	const animatedIndex = useSharedValue(0);

	const snapPoints = useMemo(() => [partialOpenHeight, '95%'], [partialOpenHeight]);

	const handleClose = useCallback(() => {
		bottomSheetRef.current?.close();
	}, []);

	return (
		<BottomSheet
			ref={bottomSheetRef}
			index={0}
			snapPoints={snapPoints}
			animatedIndex={animatedIndex}
			enablePanDownToClose
			onClose={onClose}
			backgroundStyle={{ backgroundColor: colors.surface() }}
			handleIndicatorStyle={{ backgroundColor: colors.secondary() }}
			enableDynamicSizing={false}
		>
			<TrailheadDetail
				waypoint={waypoint}
				animatedIndex={animatedIndex}
				onClose={handleClose}
			/>
		</BottomSheet>
	);
}
