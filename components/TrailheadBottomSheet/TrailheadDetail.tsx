import { View, StyleSheet, Pressable, Linking } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Waypoint, ServiceProvider, TrailheadServices } from '@/constants/waypoints';
import useColors from '@/hooks/use-colors';
import AppText from '@/components/ui/AppText';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Background } from '@react-navigation/elements';

interface Props {
	waypoint: Waypoint;
	animatedIndex: SharedValue<number>;
	onClose: () => void;
}

const trailheadImages: Record<string, any> = {
	machens: require('@/assets/images/trailheads/machens.jpg'),
	generic: require('@/assets/images/trailheads/generic.jpg'),
};

type ServiceKey = keyof TrailheadServices;

interface ServiceConfig {
	key: ServiceKey;
	label: string;
	icon: React.ReactNode;
}

const IMAGE_HEIGHT = 150;

export default function TrailheadDetail({ waypoint, animatedIndex, onClose }: Props) {
	const colors = useColors();

	const imageSource = trailheadImages[waypoint.image ?? 'generic'] ?? trailheadImages.generic;

	const imageAnimatedStyle = useAnimatedStyle(() => ({
		height: interpolate(
			animatedIndex.value,
			[1, 2],
			[0, IMAGE_HEIGHT],
			Extrapolation.CLAMP
		),
		opacity: interpolate(
			animatedIndex.value,
			[1, 1.5, 2],
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
		if (provider === 'state') return 'State';
		if (provider === 'community') return 'Community';
		return '';
	};

	const availableServices = getServiceConfigs().filter(
		config => waypoint.services?.[config.key] !== null && waypoint.services?.[config.key] !== undefined
	);

	const handlePhonePress = () => {
		if (waypoint.contact?.phone) {
			Linking.openURL(`tel:${waypoint.contact.phone}`);
		}
	};

	return (
		<View style={styles.container}>
			<Animated.Image
				source={imageSource}
				style={[styles.bannerImage, imageAnimatedStyle]}
				resizeMode="cover"
			/>

			<View style={styles.header}>
				<View style={[styles.marker, { backgroundColor: colors.primary() }]}>
					<AppText style={{ color: colors.surface() }}>TH</AppText>
				</View>
				<AppText style={styles.name}>{waypoint.name}</AppText>
			</View>

			<BottomSheetScrollView style={styles.scrollView}>
				<>
					{availableServices.length > 0 && (
						<View style={styles.section}>
							<AppText style={[styles.sectionTitle, { color: colors.text(0.6) }]}>Services</AppText>
							<View style={styles.servicesGrid}>
								{availableServices.map((config) => {
									const provider = waypoint.services?.[config.key] ?? null;
									return (
										<View key={config.key} style={[styles.serviceItem, { borderColor: colors.border() }]}>
											<View style={styles.serviceIcon}>{config.icon}</View>
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

					{waypoint.contact && (
						<View style={styles.section}>
							<AppText style={[styles.sectionTitle, { color: colors.text(0.6) }]}>Contact</AppText>
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
						</View>
					)}

					{waypoint.notes && (
						<View style={styles.section}>
							<AppText style={[styles.sectionTitle, { color: colors.text(0.6) }]}>Notes</AppText>
							<AppText style={styles.notes}>{waypoint.notes}</AppText>
						</View>
					)}
				</>
			</BottomSheetScrollView>
			<Pressable style={[styles.closeButton, {backgroundColor: colors.surface(.5)}] } onPress={onClose} hitSlop={8}>
				<Ionicons name="close" size={24} color={colors.text()} />
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	closeButton: {
		position: 'absolute',
		top: 8,
		right: 12,
		padding: 4,
		borderRadius: 20,
	},
	bannerImage: {
		width: '100%',
		height: 150,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		paddingRight: 48,
	},
	marker: {
		borderRadius: 6,
		marginRight: 12,
		padding: 4,
	},
	name: {
		fontSize: 18,
		fontWeight: '700',
		flex: 1,
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
	servicesGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
	},
	serviceItem: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '48%',
		paddingVertical: 8,
		paddingHorizontal: 10,
		borderWidth: 1,
		borderRadius: 8,
	},
	serviceIcon: {
		width: 24,
		alignItems: 'center',
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
