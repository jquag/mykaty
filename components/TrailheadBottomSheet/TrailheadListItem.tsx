import { View, StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Waypoint } from '@/constants/waypoints';
import useColors from '@/hooks/use-colors';
import AppText from '@/components/ui/AppText';

interface Props {
  waypoint: Waypoint;
  onPress: () => void;
}

export default function TrailheadListItem({ waypoint, onPress }: Props) {
  const colors = useColors();

  const serviceCount = waypoint.services
    ? Object.values(waypoint.services).filter(v => v !== null).length
    : 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? colors.primary(0.1) : 'transparent',
          borderBottomColor: colors.border(),
        }
      ]}
    >
      <View style={[styles.marker, { backgroundColor: colors.primary() }]} />
      <View style={styles.content}>
        <AppText style={styles.name}>{waypoint.name}</AppText>
        {serviceCount > 0 && (
          <AppText style={[styles.services, { color: colors.secondary() }]}>
            {serviceCount} service{serviceCount !== 1 ? 's' : ''} available
          </AppText>
        )}
        {waypoint.notes && (
          <AppText style={[styles.notes, { color: colors.text(0.6) }]} numberOfLines={1}>
            {waypoint.notes}
          </AppText>
        )}
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={colors.text(0.4)}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  marker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  services: {
    fontSize: 13,
    marginTop: 2,
  },
  notes: {
    fontSize: 12,
    marginTop: 2,
  },
});
