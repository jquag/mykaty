import DateTimeField from "@/components/forms/DateTimeField";
import FormField from "@/components/forms/FormField";
import FormInput from "@/components/forms/FormInput";
import SegmentedControl from "@/components/forms/SegmentedControl";
import SwitchRow from "@/components/forms/SwitchRow";
import { TRIP_TYPES } from "@/constants/tripTypes";
import type { TripType } from "@/types/Trip";
import { View } from "react-native";

export interface TripFormValues {
	title: string;
	date: string;
	time?: string;
	type: TripType;
	isRoundTrip: boolean;
	notes: string;
}

interface Props {
	values: TripFormValues;
	onChange: (patch: Partial<TripFormValues>) => void;
	titlePlaceholder: string;
}

export default function TripForm({ values, onChange, titlePlaceholder }: Props) {
	return (
		<View style={{ gap: 20 }}>
			<FormField label="Activity">
				<SegmentedControl
					options={TRIP_TYPES}
					value={values.type}
					onChange={(type) => onChange({ type })}
				/>
			</FormField>

			<SwitchRow
				label="Round trip"
				description="Return to the starting point"
				value={values.isRoundTrip}
				onValueChange={(isRoundTrip) => onChange({ isRoundTrip })}
			/>

			<View style={{ flexDirection: 'row', gap: 24 }}>
				<FormField label="Date">
					<DateTimeField
						mode="date"
						value={values.date}
						onChange={(date) => date && onChange({ date })}
					/>
				</FormField>
				<FormField label="Start time">
					<DateTimeField
						mode="time"
						value={values.time}
						onChange={(time) => onChange({ time })}
						clearable
						placeholder="Add time"
					/>
				</FormField>
			</View>

			<FormField label="Title">
				<FormInput
					value={values.title}
					onChangeText={(title) => onChange({ title })}
					placeholder={titlePlaceholder}
					returnKeyType="done"
				/>
			</FormField>

			<FormField label="Notes">
				<FormInput
					value={values.notes}
					onChangeText={(notes) => onChange({ notes })}
					placeholder="Anything to remember for this trip"
					multiline
				/>
			</FormField>
		</View>
	);
}
