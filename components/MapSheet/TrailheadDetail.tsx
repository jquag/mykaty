import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { Waypoint, ServiceProvider } from '@/constants/waypoints';
import { SERVICES, hasService } from '@/constants/services';
import { getTrailheadImage } from '@/constants/trailheadImages';
import useColors from '@/hooks/use-colors';
import AppText from '@/components/ui/AppText';
import { BottomSheetScrollView, useBottomSheet } from '@gorhom/bottom-sheet';
import { openUrl } from '@/utils/map';
import { detailStyles } from './DetailBottomSheet';
import ServiceIcon from './ServiceIcon';

interface Props {
	waypoint: Waypoint;
}

const IMAGE_HEIGHT = 175;

export default function TrailheadDetail({ waypoint }: Props) {
	const colors = useColors();
	const { animatedIndex } = useBottomSheet();

	const imageSource = getTrailheadImage(waypoint);

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

	const getProviderLabel = (provider: ServiceProvider): string => {
		if (provider === 'state') return 'Katy Trail State Parks';
		if (provider === 'community') return 'Community';
		return '';
	};

	const availableServices = SERVICES.filter(config => hasService(waypoint.services, config.key));

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
											<View style={[styles.serviceIcon, { borderColor: colors.border() }]}>
												<ServiceIcon service={config.key} color={colors.secondary()} />
											</View>
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
