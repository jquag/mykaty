import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import type { ComponentProps } from 'react';
import { Poi } from '@/constants/pois';
import useColors from '@/hooks/use-colors';
import AppText from '@/components/ui/AppText';
import { openInMaps, openUrl } from '@/utils/map';
import { detailStyles } from './DetailBottomSheet';
import {
	formatMilesFromTrail,
	isOnTrail,
	getCategoryConfig,
	getSubcategoryLabel,
} from '@/utils/pois';

interface Props {
	poi: Poi;
	attribution: string | null;
}

export default function PoiDetail({ poi, attribution }: Props) {
	const colors = useColors();
	const category = getCategoryConfig(poi.category);
	const { phone, website, address } = poi;
	const phoneParts = phone?.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
	const websiteUrl = website && (/^https?:\/\//i.test(website) ? website : `https://${website}`);

	return (
		<View style={detailStyles.container}>
			<View style={[detailStyles.header, styles.header]}>
				<AppText style={detailStyles.name}>{poi.name}</AppText>
				<View style={styles.categoryRow}>
					<MaterialCommunityIcons name={category.icon} size={16} color={category.color} />
					<AppText style={{ color: colors.text(0.8), fontWeight: '600' }}>{getSubcategoryLabel(poi)}</AppText>
				</View>
				<AppText style={[styles.trailInfo, { color: colors.text(0.6) }]}>
					{formatMilesFromTrail(poi.milesFromTrail)} · near {poi.nearestTrailhead}
				</AppText>
				{!isOnTrail(poi.milesFromTrail) && (
					<AppText style={[styles.distanceNote, { color: colors.text(0.45) }]}>
						Straight-line distance; the actual route may be longer.
					</AppText>
				)}
			</View>

			<BottomSheetScrollView style={detailStyles.scrollView}>
				<View style={styles.actions}>
					<ActionButton icon="map" label="Maps" onPress={() => openInMaps(poi, poi.name)} />
					{phone && <ActionButton icon="call" label="Call" onPress={() => openUrl(`tel:${phone}`)} />}
					{websiteUrl && <ActionButton icon="globe-outline" label="Website" onPress={() => openUrl(websiteUrl)} />}
				</View>

				{poi.acrossRiver && (
					<View style={detailStyles.section}>
						<AppText style={[detailStyles.sectionTitle, { color: colors.text(0.6) }]}>Getting there</AppText>
						<AppText style={styles.body}>Across the Missouri River from the trail, reached by bridge.</AppText>
					</View>
				)}

				{address && (
					<View style={detailStyles.section}>
						<AppText style={[detailStyles.sectionTitle, { color: colors.text(0.6) }]}>Address</AppText>
						<AppText style={styles.body}>{address}</AppText>
					</View>
				)}

				{(phone || website) && (
					<View style={detailStyles.section}>
						<AppText style={[detailStyles.sectionTitle, { color: colors.text(0.6) }]}>Contact</AppText>
						{phone && (
							<Pressable onPress={() => openUrl(`tel:${phone}`)}>
								<AppText style={[styles.link, { color: colors.accent() }]}>
									{phoneParts ? `(${phoneParts[1]}) ${phoneParts[2]}-${phoneParts[3]}` : phone}
								</AppText>
							</Pressable>
						)}
						{website && websiteUrl && (
							<Pressable onPress={() => openUrl(websiteUrl)}>
								<AppText style={[styles.link, { color: colors.accent() }]} numberOfLines={1}>
									{website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
								</AppText>
							</Pressable>
						)}
					</View>
				)}

				{attribution && (
					<AppText style={[styles.attribution, { color: colors.text(0.4) }]}>{attribution}</AppText>
				)}
			</BottomSheetScrollView>
		</View>
	);
}

interface ActionButtonProps {
	icon: ComponentProps<typeof Ionicons>['name'];
	label: string;
	onPress: () => void;
}

function ActionButton({ icon, label, onPress }: ActionButtonProps) {
	const colors = useColors();
	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [
				styles.actionButton,
				{ backgroundColor: pressed ? colors.primary(0.2) : colors.primary(0.1) },
			]}
		>
			<Ionicons name={icon} size={20} color={colors.primary()} />
			<AppText style={[styles.actionLabel, { color: colors.primary() }]}>{label}</AppText>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	header: {
		gap: 4,
	},
	categoryRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	distanceNote: {
		fontSize: 12,
	},
	trailInfo: {
		fontSize: 14,
	},
	actions: {
		flexDirection: 'row',
		gap: 8,
		paddingHorizontal: 16,
		paddingVertical: 4,
	},
	actionButton: {
		flex: 1,
		alignItems: 'center',
		gap: 2,
		paddingVertical: 10,
		borderRadius: 10,
	},
	actionLabel: {
		fontSize: 13,
		fontWeight: '600',
	},
	body: {
		fontSize: 14,
		lineHeight: 20,
	},
	link: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 4,
	},
	attribution: {
		fontSize: 11,
		paddingHorizontal: 16,
		paddingTop: 12,
		paddingBottom: 40,
	},
});
