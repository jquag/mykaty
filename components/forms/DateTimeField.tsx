import AppText from "@/components/ui/AppText";
import useColors from "@/hooks/use-colors";
import { formatDate, formatTime, parseLocal, todayLocal, toDateString, toTimeString } from "@/utils/trip-util";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, useColorScheme, View } from "react-native";

const DEFAULT_TIME = '09:00';

interface Props {
	mode: 'date' | 'time';
	/** 'YYYY-MM-DD' for date mode, 'HH:mm' for time mode */
	value?: string;
	onChange: (value: string | undefined) => void;
	clearable?: boolean;
	placeholder?: string;
}

export default function DateTimeField({ mode, value, onChange, clearable = false, placeholder }: Props) {
	const colors = useColors();
	const colorScheme = useColorScheme();
	const [pending, setPending] = useState<string>();

	const fallback = mode === 'date' ? todayLocal() : DEFAULT_TIME;
	const toDate = (v: string) => (mode === 'date' ? parseLocal(v) : parseLocal(todayLocal(), v));
	const toValue = (picked: Date) => (mode === 'date' ? toDateString(picked) : toTimeString(picked));

	const openAndroidPicker = () => {
		DateTimePickerAndroid.open({
			value: toDate(value ?? fallback),
			mode,
			onValueChange: (_event, picked) => onChange(toValue(picked)),
		});
	};

	const isIOS = Platform.OS === 'ios';
	const showPill = !isIOS || value === undefined;

	return (
		<View style={styles.row}>
			<View>
				{showPill && (
					<Pressable
						onPress={isIOS ? undefined : openAndroidPicker}
						style={[styles.pill, { borderColor: colors.text(0.2), backgroundColor: colors.text(0.04) }]}
					>
						<Ionicons
							name={mode === 'date' ? 'calendar-outline' : 'time-outline'}
							size={18}
							color={colors.primary()}
						/>
						<AppText style={{ color: value ? colors.text() : colors.primary() }}>
							{value ? (mode === 'date' ? formatDate(value) : formatTime(value)) : placeholder}
						</AppText>
					</Pressable>
				)}
				{isIOS && (
					// The compact picker can't be opened programmatically, so while there is no value it sits
					// invisibly over the pill to take the tap itself. Its layout must not change while its
					// popover is open, so the first pick is held locally and committed on dismiss.
					<View style={showPill && styles.pickerOverPill}>
						<DateTimePicker
							value={toDate(value ?? pending ?? fallback)}
							mode={mode}
							display="compact"
							themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
							accentColor={colors.primary()}
							style={showPill && styles.pickerStretched}
							onValueChange={(_event, picked) => {
								if (value === undefined) {
									setPending(toValue(picked));
								} else {
									onChange(toValue(picked));
								}
							}}
							onDismiss={() => {
								if (value === undefined && pending !== undefined) onChange(pending);
								setPending(undefined);
							}}
						/>
					</View>
				)}
			</View>
			{clearable && value !== undefined && (
				<Pressable onPress={() => onChange(undefined)} hitSlop={8} accessibilityLabel={`Clear ${mode}`}>
					<Ionicons name="close-circle" size={22} color={colors.text(0.4)} />
				</Pressable>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		minHeight: 40,
	},
	pickerOverPill: {
		position: 'absolute',
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		alignItems: 'center',
		justifyContent: 'center',
		overflow: 'hidden',
		// UIKit stops delivering touches below 0.01
		opacity: 0.015,
	},
	pickerStretched: {
		transform: [{ scale: 3 }],
	},
	pill: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
});
