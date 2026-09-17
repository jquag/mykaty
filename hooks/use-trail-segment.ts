import { findNearestTrailPoint, getTrailMiles } from "@/utils/trail";
import { useState } from "react";

export type SegmentEnd = 'start' | 'end';

export type TrailSegment = ReturnType<typeof useTrailSegment>;

interface SegmentPoints {
	start: number | null;
	end: number | null;
}

export default function useTrailSegment(initial?: { start: number; end: number }) {
	const [points, setPoints] = useState<SegmentPoints>({
		start: initial?.start ?? null,
		end: initial?.end ?? null,
	});
	const [markerKeys, setMarkerKeys] = useState({ start: 0, end: 0 });

	const { start, end } = points;
	const distance = start !== null && end !== null ? getTrailMiles(start, end) : null;

	const selectAt = (lat: number, lng: number) => {
		const index = findNearestTrailPoint(lat, lng);
		setPoints(prev => {
			if (prev.start === null) return { start: index, end: null };
			// An end on the start point measures nothing, so the next tap replaces it rather than being ignored
			if (prev.end === null || prev.end === prev.start) return { ...prev, end: index };
			return prev;
		});
	};

	const dragTo = (which: SegmentEnd, lat: number, lng: number) => {
		const index = findNearestTrailPoint(lat, lng);
		setPoints(prev => ({ ...prev, [which]: index }));
	};

	const dropAt = (which: SegmentEnd, lat: number, lng: number) => {
		dragTo(which, lat, lng);
		setMarkerKeys(prev => ({ ...prev, [which]: prev[which] + 1 }));
	};

	const clear = () => setPoints({ start: null, end: null });

	return {
		start,
		end,
		markerKeys,
		distance,
		isComplete: distance !== null && distance > 0,
		selectAt,
		dragTo,
		dropAt,
		clear,
	};
}
