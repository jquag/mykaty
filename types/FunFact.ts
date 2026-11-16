export type FunFactLocation =
	| { trailhead: string }
	| { lat: number; lng: number };

// Mirrors the output of scripts/facts; see scripts/facts/README.md
export interface FunFact {
	id: string;
	/** Defaults to the trailhead's name */
	title?: string;
	text: string;
	/** File name under the published images folder */
	image?: string;
	location?: FunFactLocation;
}

export interface FunFactFile {
	schemaVersion: number;
	generatedAt: string;
	facts: FunFact[];
}

export interface FunFactManifest {
	schemaVersion: number;
	generatedAt: string;
	sha256: string;
	count: number;
	file: string;
	images: Record<string, string>;
}
