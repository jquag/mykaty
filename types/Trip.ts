export interface Coordinate {
  lat: number;
  lng: number;
}

export type TripType = 'bike' | 'run' | 'walk';

export interface Trip {
  id: string;
  title?: string;
  startDate: string;
  startTime?: string;
  startPoint: Coordinate;
  startPointName?: string;
  endPoint: Coordinate;
  endPointName?: string;
  type: TripType;
  isRoundTrip: boolean;
  notes?: string;
  createdAt: string;
}