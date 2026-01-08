import { Marker } from "react-native-maps";
import type { Waypoint } from "@/constants/waypoints";
import { Text, View } from "react-native";

interface Props {
	waypoint: Waypoint;
	markerSize: number;
	showLabels?: boolean;
}

export default function TrailheadMarker({ waypoint, markerSize, showLabels = true }: Props) {
	return (
		<Marker
			coordinate={{ latitude: waypoint.lat, longitude: waypoint.lng }}
			title={waypoint.name}
			anchor={{ x: 0.5, y: 0.5 }}
		>
			<View style={{}}>
				<View style={{
					borderWidth: 1,
					borderColor: 'black',
					backgroundColor: 'white',
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
						<Text numberOfLines={1} style={{
								fontSize: 10,
								fontWeight: '600',
								paddingHorizontal: 2,
								paddingVertical: 1,
								borderRadius: 4,
								overflow: 'hidden',
								color: 'black',
								backgroundColor: 'rgba(255, 255, 255, 0.7)',
							}}>
							{waypoint.name}
						</Text>
					</View>
				)}
			</View>
		</Marker>
	);
}
