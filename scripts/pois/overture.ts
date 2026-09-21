import { DuckDBInstance } from "@duckdb/node-api";
import type { DuckDBConnection } from "@duckdb/node-api";
import { OVERTURE_BUCKET, OVERTURE_CATALOG_URL, OVERTURE_CATEGORY_SQL, OVERTURE_REGION, RIVER_NAME } from "./config.ts";
import type { LatLng, Segment } from "./geo.ts";

export interface OverturePlace {
	id: string;
	name: string | null;
	category: string;
	confidence: number;
	operatingStatus: string | null;
	website: string | null;
	phone: string | null;
	street: string | null;
	locality: string | null;
	lat: number;
	lng: number;
}

interface Bbox {
	minLat: number;
	maxLat: number;
	minLng: number;
	maxLng: number;
}

const SETUP = [
	"INSTALL httpfs",
	"LOAD httpfs",
	"INSTALL spatial",
	"LOAD spatial",
	// Anonymous access scoped to Overture's bucket, so AWS credentials in the environment are never sent to it
	`CREATE SECRET overture (TYPE s3, PROVIDER config, KEY_ID '', SECRET '', REGION '${OVERTURE_REGION}', ENDPOINT 's3.${OVERTURE_REGION}.amazonaws.com', SCOPE '${OVERTURE_BUCKET}')`,
	"SET geometry_always_xy = true",
];

// Overture only keeps its most recent releases online, so the release is looked up rather than pinned
async function resolveRelease() {
	if (process.env.OVERTURE_RELEASE) return process.env.OVERTURE_RELEASE;
	const response = await fetch(OVERTURE_CATALOG_URL);
	if (!response.ok) throw new Error(`Overture catalog request failed: ${response.status}`);
	const { latest } = (await response.json()) as { latest?: string };
	if (!latest) throw new Error("Overture catalog has no 'latest' release");
	return latest;
}

async function rows<T>(connection: DuckDBConnection, sql: string) {
	const reader = await connection.runAndReadAll(sql);
	return reader.getRowObjectsJson() as T[];
}

function toSegments(geojsonLines: string[]) {
	const segments: Segment[] = [];
	for (const geojson of geojsonLines) {
		const coordinates: [number, number][] = JSON.parse(geojson).coordinates;
		const line: LatLng[] = coordinates.map(([lng, lat]) => ({ lat, lng }));
		for (let i = 1; i < line.length; i++) segments.push([line[i - 1], line[i]]);
	}
	return segments;
}

export async function fetchOverture(bbox: Bbox) {
	const release = await resolveRelease();
	const source = (theme: string, type: string) =>
		`read_parquet('${OVERTURE_BUCKET}/release/${release}/theme=${theme}/type=${type}/*', hive_partitioning=1)`;

	console.log(`fetching Overture release ${release}...`);
	const instance = await DuckDBInstance.create(":memory:");
	const connection = await instance.connect();
	try {
		for (const statement of SETUP) await connection.run(statement);

		const places = await rows<OverturePlace>(connection, `
			SELECT id,
				names.primary AS name,
				categories.primary AS category,
				confidence,
				operating_status AS operatingStatus,
				websites[1] AS website,
				phones[1] AS phone,
				addresses[1].freeform AS street,
				addresses[1].locality AS locality,
				ST_Y(geometry) AS lat,
				ST_X(geometry) AS lng
			FROM ${source("places", "place")}
			WHERE bbox.xmin BETWEEN ${bbox.minLng} AND ${bbox.maxLng}
				AND bbox.ymin BETWEEN ${bbox.minLat} AND ${bbox.maxLat}
				AND ${OVERTURE_CATEGORY_SQL}
			ORDER BY id`);

		const riverLines = await rows<{ geojson: string }>(connection, `
			SELECT ST_AsGeoJSON(geometry)::VARCHAR AS geojson
			FROM ${source("base", "water")}
			WHERE names.primary = '${RIVER_NAME}'
				AND ST_GeometryType(geometry) = 'LINESTRING'
				AND bbox.xmax > ${bbox.minLng} AND bbox.xmin < ${bbox.maxLng}
				AND bbox.ymax > ${bbox.minLat} AND bbox.ymin < ${bbox.maxLat}
			ORDER BY id`);

		return { release, places, river: toSegments(riverLines.map(row => row.geojson)) };
	} finally {
		connection.closeSync();
		instance.closeSync();
	}
}
