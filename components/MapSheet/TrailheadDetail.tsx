import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Waypoint, ServiceProvider, TrailheadServices } from '@/constants/waypoints';
import useColors from '@/hooks/use-colors';
import AppText from '@/components/ui/AppText';
import { BottomSheetScrollView, useBottomSheet } from '@gorhom/bottom-sheet';
import { openUrl } from '@/utils/map';
import { detailStyles } from './DetailBottomSheet';

interface Props {
	waypoint: Waypoint;
}

const trailheadImages: Record<string, any> = {
	machens: require('@/assets/images/trailheads/machens.jpg'),
	generic: require('@/assets/images/trailheads/generic.jpg'),
	blackWalnut: require('@/assets/images/trailheads/black-walnut.jpg'),
	saintCharles: require('@/assets/images/trailheads/saint-charles.jpg'),
	greensbottom: require('@/assets/images/trailheads/greensbottom.jpg'),
	weldonSpring: require('@/assets/images/trailheads/weldon-spring.jpg'),
	defiance: require('@/assets/images/trailheads/defiance.jpg'),
	matson: require('@/assets/images/trailheads/matson.jpg'),
	augusta: require('@/assets/images/trailheads/augusta.jpg'),
	dutzow: require('@/assets/images/trailheads/dutzow.jpg'),
	marthasville: require('@/assets/images/trailheads/marthasville.jpg'),
	treloar: require('@/assets/images/trailheads/treloar.jpg'),
	mcKittrick: require('@/assets/images/trailheads/mckittrick.jpg'),
	rhineland: require('@/assets/images/trailheads/rhineland.jpg'),
	bluffton: require('@/assets/images/trailheads/bluffton.jpg'),
	portland: require('@/assets/images/trailheads/portland.jpg'),
	steedman: require('@/assets/images/trailheads/steedman.jpg'),
	mokane: require('@/assets/images/trailheads/mokane.jpg'),
	tebbetts: require('@/assets/images/trailheads/tebbetts.jpg'),
	northJefferson: require('@/assets/images/trailheads/north-jefferson.jpg'),
};

type ServiceKey = keyof TrailheadServices;

interface ServiceConfig {
	key: ServiceKey;
	label: string;
	icon: React.ReactNode;
}

const IMAGE_HEIGHT = 175;

export default function TrailheadDetail({ waypoint }: Props) {
	const colors = useColors();
	const { animatedIndex } = useBottomSheet();

	const imageSource = trailheadImages[waypoint.image ?? 'generic'] ?? trailheadImages.generic;

	const imageAnimatedStyle = useAnimatedStyle(() => ({
		height: interpolate(
			animatedIndex.value,
			[0, 1],
			[0, IMAGE_HEIGHT],
			Extrapolation.CLAMP
		),
		opacity: interpolate(
			animatedIndex.value,
			[0, 0.5, 1],
			[0, 0.5, 1],
			Extrapolation.CLAMP
		),
	}));

	const getServiceConfigs = (): ServiceConfig[] => [
		{ key: 'parking', label: 'Parking', icon: <AppText style={{ fontSize: 16, fontWeight: '700', color: colors.secondary() }}>P</AppText> },
		{ key: 'water', label: 'Water', icon: <Ionicons name="water" size={18} color={colors.secondary()} /> },
		{ key: 'restroom', label: 'Restroom', icon: <MaterialCommunityIcons name="human-male-female" size={18} color={colors.secondary()} /> },
		{ key: 'camping', label: 'Camping', icon: <Ionicons name="bonfire" size={18} color={colors.secondary()} /> },
		{ key: 'foodGrocery', label: 'Grocery', icon: <Ionicons name="cart" size={18} color={colors.secondary()} /> },
		{ key: 'restaurant', label: 'Restaurant', icon: <Ionicons name="restaurant" size={18} color={colors.secondary()} /> },
		{ key: 'lodging', label: 'Lodging', icon: <Ionicons name="bed" size={18} color={colors.secondary()} /> },
		{ key: 'bikeShop', label: 'Bike Shop', icon: <Ionicons name="bicycle" size={18} color={colors.secondary()} /> },
		{ key: 'bikeRental', label: 'Bike Rental', icon: <MaterialCommunityIcons name="bike-fast" size={18} color={colors.secondary()} /> },
		{ key: 'bikeService', label: 'Bike Service', icon: <MaterialCommunityIcons name="wrench" size={18} color={colors.secondary()} /> },
		{ key: 'bikeWorkStation', label: 'Work Station', icon: <MaterialCommunityIcons name="tools" size={18} color={colors.secondary()} /> },
		{ key: 'shuttleService', label: 'Shuttle', icon: <Ionicons name="car" size={18} color={colors.secondary()} /> },
		{ key: 'phone', label: 'Phone', icon: <Ionicons name="call" size={18} color={colors.secondary()} /> },
	];

	const getProviderLabel = (provider: ServiceProvider): string => {
		if (provider === 'state') return 'Katy Trail State Parks';
		if (provider === 'community') return 'Community';
		return '';
	};

	const availableServices = getServiceConfigs().filter(
		config => waypoint.services?.[config.key] !== null && waypoint.services?.[config.key] !== undefined
	);

	const handlePhonePress = () => {
		if (waypoint.contact?.phone) {
			openUrl(`tel:${waypoint.contact.phone}`);
		}
	};

	return (
		<View style={detailStyles.container}>
			<Animated.Image
				source={imageSource}
				style={[styles.bannerImage, imageAnimatedStyle]}
				resizeMode="cover"
			/>

			<View style={detailStyles.header}>
				<View>
					<AppText style={detailStyles.name}>{waypoint.name}</AppText>
					<AppText style={{ color: colors.primary() }}>Trailhead</AppText>
				</View>
			</View>

			<BottomSheetScrollView style={detailStyles.scrollView}>
				<>
					{availableServices.length > 0 && (
						<View style={detailStyles.section}>
							<AppText style={[detailStyles.sectionTitle, { color: colors.text(0.6) }]}>Services</AppText>
							<View style={styles.servicesGrid}>
								{availableServices.map((config) => {
									const provider = waypoint.services?.[config.key] ?? null;
									return (
										<View key={config.key} style={[styles.serviceItem, { borderColor: colors.border() }]}>
											<View style={[styles.serviceIcon, { borderColor: colors.border() }]}>{config.icon}</View>
											<View style={styles.serviceText}>
												<AppText style={styles.serviceLabel}>{config.label}</AppText>
												<AppText style={[styles.serviceProvider, { color: colors.text(0.5) }]}>
													{getProviderLabel(provider)}
												</AppText>
											</View>
										</View>
									);
								})}
							</View>
						</View>
					)}

					<View style={detailStyles.section}>
						<AppText style={[detailStyles.sectionTitle, { color: colors.text(0.6) }]}>Contact</AppText>
						{waypoint.contact ? (
							<>
								{waypoint.contact.name && (
									<AppText style={styles.contactName}>{waypoint.contact.name}</AppText>
								)}
								{waypoint.contact.phone && (
									<Pressable onPress={handlePhonePress}>
										<AppText style={[styles.contactPhone, { color: colors.accent() }]}>
											{waypoint.contact.phone}
										</AppText>
									</Pressable>
								)}
							</>
						) : (
							<AppText style={{ color: colors.text(), fontSize: 12 }}>Not available</AppText>
						)}
					</View>

					{waypoint.notes && (
						<View style={detailStyles.section}>
							<AppText style={[detailStyles.sectionTitle, { color: colors.text(0.6) }]}>Notes</AppText>
							<AppText style={styles.notes}>{waypoint.notes}</AppText>
						</View>
					)}
				</>
			</BottomSheetScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	bannerImage: {
		width: '100%',
		height: 150,
	},
	marker: {
		borderRadius: 6,
		marginRight: 12,
		padding: 4,
	},
	servicesGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	serviceItem: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '48%',
	},
	serviceIcon: {
		width: 40,
		alignItems: 'center',
		paddingVertical: 8,
		paddingHorizontal: 10,
		borderWidth: 1,
		borderRadius: 8,
	},
	serviceText: {
		marginLeft: 8,
		flex: 1,
	},
	serviceLabel: {
		fontSize: 14,
		fontWeight: '500',
	},
	serviceProvider: {
		fontSize: 11,
	},
	contactName: {
		fontSize: 14,
		marginBottom: 4,
	},
	contactPhone: {
		fontSize: 16,
		fontWeight: '600',
	},
	notes: {
		fontSize: 14,
		lineHeight: 20,
	},
});
