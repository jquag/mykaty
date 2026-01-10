import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ImageBackground, View, StyleSheet, useColorScheme } from 'react-native';
import { Fonts } from '@/utils/theme';
import useColors from '@/hooks/use-colors';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

const TabBarButton = (props: BottomTabBarButtonProps) => {
	const { children, onPress, style } = props;
	const focused = (props as any)['aria-selected'];
	const colors = useColors();
	const colorScheme = useColorScheme();

	return (
		<Pressable
			onPress={onPress}
			style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
		>
			<View
				style={{
					borderRadius: 12,
					paddingHorizontal: 20,
					paddingVertical: 6,
					marginTop: 18,
					alignItems: 'center',
					borderColor: focused ? colors.primary(.4) : colors.primary(0),
					borderWidth: 2,
					backgroundColor: focused ? colors.surface(colorScheme === 'dark' ? .5 : .5) : undefined,
				}}
			>
				{children}
			</View>
		</Pressable>
	);
};

const HeaderBackground = () => {
	const colors = useColors();
	const colorScheme = useColorScheme();
	if (colorScheme === 'dark') {
		return (
			<ImageBackground
				source={require('@/assets/images/sky_dark.png')}
				style={StyleSheet.absoluteFill}
				resizeMode="cover"
			>
			</ImageBackground>
		);
	} else {
		return (
			<ImageBackground
				source={require('@/assets/images/sky_light.png')}
				style={StyleSheet.absoluteFill}
				resizeMode="cover"
			>
				<View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface(0.2) }]} />
			</ImageBackground>
		);
	}
};

const TabBarBackground = () => {
	const colors = useColors();
	const colorScheme = useColorScheme();
	if (colorScheme === 'dark') {
		return (
			<ImageBackground
				source={require('@/assets/images/trail_dark.png')}
				style={StyleSheet.absoluteFill}
				resizeMode="cover"
			>
				<View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface(0.2) }]} />
			</ImageBackground>
		);
	} else {
		return (
			<ImageBackground
				source={require('@/assets/images/trail_light.png')}
				style={StyleSheet.absoluteFill}
				resizeMode="cover"
			>
				<View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface(0.4) }]} />
			</ImageBackground>
		);
	}
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
					color: colors.text(),
				},
				headerTintColor: colors.text(),
				tabBarBackground: () => <TabBarBackground />,
				tabBarButton: (props) => <TabBarButton {...props} />,
				tabBarStyle: {
					borderTopWidth: 0,
				},
				tabBarActiveTintColor: colors.primary(),
				tabBarInactiveTintColor: colors.text(),
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
					headerTitle: 'Trail Map',
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
