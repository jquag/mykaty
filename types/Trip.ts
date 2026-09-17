export interface Coordinate {
  lat: number;
  lng: number;
}

export type TripType = 'bike' | 'run' | 'walk';

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
  notes?: string;
  createdAt: string;
}
