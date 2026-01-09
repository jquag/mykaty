import { Marker } from "react-native-maps";
import type { Waypoint } from "@/constants/waypoints";
import { Text, View } from "react-native";
import AppText from "./ui/AppText";
import useColors from "@/hooks/use-colors";

interface Props {
	waypoint: Waypoint;
	markerSize: number;
	showLabels?: boolean;
}

export default function TrailheadMarker({ waypoint, markerSize, showLabels = true }: Props) {
	const colors = useColors();
	return (
		<Marker
			coordinate={{ latitude: waypoint.lat, longitude: waypoint.lng }}
			title={waypoint.name}
			anchor={{ x: 0.5, y: 0.5 }}
		>
			<View style={{}}>
				<View style={{
					borderWidth: 1,
					borderColor: colors.text(),
					backgroundColor: colors.primary(),
					width: markerSize,
					height: markerSize,
					borderRadius: markerSize / 2,
				}} />
				{showLabels && (
					<View style={{
						position: 'absolute',
						top: markerSize + 2,
						left: -50 + markerSize / 2,
						width: 100,
						alignItems: 'center',
					}}>
						<AppText numberOfLines={1} style={{
								fontSize: 11,
								fontWeight: '600',
								paddingHorizontal: 4,
								paddingVertical: 2,
								borderRadius: 4,
								overflow: 'hidden',
								backgroundColor: colors.surface(.8),
							}}>
							{waypoint.name}
						</AppText>
					</View>
				)}
			</View>
		</Marker>
	);
}
