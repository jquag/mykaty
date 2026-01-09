import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ImageBackground, View, StyleSheet } from 'react-native';
import { Fonts } from '@/utils/theme';
import useColors from '@/hooks/use-colors';

const HeaderBackground = () => {
	const colors = useColors();
	return (
		<ImageBackground
			source={require('@/assets/images/clouds.png')}
			style={StyleSheet.absoluteFill}
			resizeMode="cover"
		>
			<View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface(0.7) }]} />
		</ImageBackground>
	);
};

const TabBarBackground = () => {
	const colors = useColors();
	return (
		<ImageBackground
			source={require('@/assets/images/trail.png')}
			style={StyleSheet.absoluteFill}
			resizeMode="cover"
		>
			<View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface(0.7) }]} />
		</ImageBackground>
	);
};

export default function TabLayout() {
  const router = useRouter();
  const colors = useColors();

	return (
		<Tabs
			screenOptions={{
				headerBackground: () => <HeaderBackground />,
				headerStyle: {
					borderBottomWidth: 0,
				},
				headerTitleStyle: {
					fontFamily: Fonts.heading,
					fontSize: 20,
					color: colors.primary(),
				},
				headerTintColor: colors.text(),
				tabBarBackground: () => <TabBarBackground />,
				tabBarStyle: {
					borderTopWidth: 0,
				},
				tabBarActiveTintColor: colors.primary(),
				tabBarInactiveTintColor: colors.text(0.6),
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
