import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";

function currentDate() {
	return new Date();
}

// A screen can stay mounted for days, so the time refreshes whenever it regains focus or the app returns to the foreground
export default function useNow() {
	const [now, setNow] = useState(currentDate);

	useFocusEffect(useCallback(() => {
		setNow(currentDate());
	}, []));

	useEffect(() => {
		const subscription = AppState.addEventListener('change', state => {
			if (state === 'active') setNow(currentDate());
		});
		return () => subscription.remove();
	}, []);

	return now;
}
