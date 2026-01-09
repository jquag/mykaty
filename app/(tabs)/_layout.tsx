import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { Fonts } from '@/utils/theme';

export default function TabLayout() {
  const router = useRouter();

	return (
		<Tabs
			screenOptions={{
				headerStyle: {
					borderBottomWidth: 1,
				},
				headerTitleStyle: {
					fontFamily: Fonts.heading,
					fontSize: 20,
				},
				tabBarStyle: {
				},
				tabBarLabelStyle: {
					fontSize: 14,
					fontWeight: '600',
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					tabBarLabel: 'Map',
					headerTitle: 'Katy Trail Map',
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="map" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="trips"
				options={{
					tabBarLabel: 'Trips',
					headerTitle: 'My Trips',
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="bicycle" size={size} color={color} />
					),
          headerRight: () => (
            <Pressable onPress={() => router.push('/(tabs)/trips')}>
              <Ionicons name="add-circle" size={28} />
            </Pressable>
          ),
				}}
			/>
		</Tabs>
	);
}
