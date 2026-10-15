import type { PoiCategory } from '@/constants/pois';

export interface Coordinate {
  lat: number;
  lng: number;
}

export type TripType = 'bike' | 'run' | 'walk';

/** 'back' stops are on the return from the turnaround of a round trip */
export type StopLeg = 'out' | 'back';

/** A copy of the place's details, so the stop survives the place leaving the published data */
export interface TripStop {
  leg: StopLeg;
  poiId: string;
  name: string;
  category: PoiCategory;
  lat: number;
  lng: number;
  /** Trail point where the route to the stop leaves the trail */
  exit: Coordinate;
  milesFromTrail: number;
}

export interface Trip {
  id: string;
  title?: string;
  /** Local calendar date, 'YYYY-MM-DD' */
  date: string;
  /** Local time of day, 'HH:mm' */
  time?: string;
  /** Trail point the trip starts from */
  start: Coordinate;
  /** Trail point the trip ends at, or turns around at for a round trip */
  end: Coordinate;
  type: TripType;
  isRoundTrip: boolean;
  stops?: TripStop[];
  notes?: string;
  createdAt: string;
}
