export type PoiCategory = "food" | "lodging" | "grocery" | "bike";

export const OVERTURE_CATALOG_URL = "https://stac.overturemaps.org/catalog.json";
export const OVERTURE_BUCKET = "s3://overturemaps-us-west-2";
export const OVERTURE_REGION = "us-west-2";
export const ATTRIBUTION = "© Overture Maps Foundation";

export const SCHEMA_VERSION = 1;
export const CORRIDOR_MILES = 2;
export const MIN_CONFIDENCE = 0.5;
export const CLOSED_STATUSES = ["permanently_closed", "temporarily_closed"];
export const DEDUPE_MILES = 0.1;
export const RIVER_NAME = "Missouri River";

// A warning is shown before publishing when counts fall by more than these fractions against the published file
export const MAX_TOTAL_DROP = 0.2;
export const MAX_CATEGORY_DROP = 0.3;

export const S3_POIS_KEY = "pois.json";
export const S3_MANIFEST_KEY = "manifest.json";
export const S3_CACHE_CONTROL = "public, max-age=3600";

// Overture primary category -> [app category, subcategory]
const CATEGORY_MAP: Record<string, [PoiCategory, string]> = {
	restaurant: ["food", "restaurant"],
	steakhouse: ["food", "restaurant"],
	diner: ["food", "restaurant"],
	bistro: ["food", "restaurant"],
	soul_food: ["food", "restaurant"],
	food: ["food", "restaurant"],
	food_truck: ["food", "restaurant"],
	sandwich_shop: ["food", "restaurant"],
	delicatessen: ["food", "restaurant"],
	bar: ["food", "bar"],
	pub: ["food", "bar"],
	irish_pub: ["food", "bar"],
	gastropub: ["food", "bar"],
	sports_bar: ["food", "bar"],
	cocktail_bar: ["food", "bar"],
	dive_bar: ["food", "bar"],
	beer_bar: ["food", "bar"],
	beer_garden: ["food", "bar"],
	wine_bar: ["food", "bar"],
	whiskey_bar: ["food", "bar"],
	tapas_bar: ["food", "bar"],
	piano_bar: ["food", "bar"],
	tiki_bar: ["food", "bar"],
	gay_bar: ["food", "bar"],
	lounge: ["food", "bar"],
	brewery: ["food", "brewery"],
	winery: ["food", "winery"],
	wine_tasting_room: ["food", "winery"],
	distillery: ["food", "distillery"],
	coffee_shop: ["food", "cafe"],
	cafe: ["food", "cafe"],
	tea_room: ["food", "cafe"],
	coffee_roastery: ["food", "cafe"],
	bubble_tea: ["food", "cafe"],
	smoothie_juice_bar: ["food", "cafe"],
	bakery: ["food", "bakery"],
	donuts: ["food", "bakery"],
	ice_cream_shop: ["food", "dessert"],
	desserts: ["food", "dessert"],

	bed_and_breakfast: ["lodging", "bed_and_breakfast"],
	inn: ["lodging", "bed_and_breakfast"],
	hotel: ["lodging", "hotel"],
	motel: ["lodging", "hotel"],
	resort: ["lodging", "hotel"],
	lodge: ["lodging", "hotel"],
	hostel: ["lodging", "hotel"],
	accommodation: ["lodging", "other"],
	holiday_rental_home: ["lodging", "rental"],
	cottage: ["lodging", "rental"],
	cabin: ["lodging", "rental"],
	campground: ["lodging", "camping"],
	rv_park: ["lodging", "camping"],

	grocery_store: ["grocery", "grocery"],
	supermarket: ["grocery", "grocery"],
	organic_grocery_store: ["grocery", "grocery"],
	international_grocery_store: ["grocery", "grocery"],
	health_food_store: ["grocery", "grocery"],
	farmers_market: ["grocery", "grocery"],
	convenience_store: ["grocery", "convenience"],
	gas_station: ["grocery", "convenience"],
	truck_gas_station: ["grocery", "convenience"],
	pharmacy: ["grocery", "pharmacy"],

	bicycle_shop: ["bike", "shop"],
	bike_repair_maintenance: ["bike", "shop"],
	bike_rentals: ["bike", "rental"],
};

// Covers the long tail of cuisine-specific categories such as mexican_restaurant
const RESTAURANT_SUFFIX = "_restaurant";

export const OVERTURE_CATEGORY_SQL =
	`(categories.primary IN (${Object.keys(CATEGORY_MAP).map(c => `'${c}'`).join(", ")})` +
	` OR categories.primary LIKE '%${RESTAURANT_SUFFIX.replace("_", "\\_")}' ESCAPE '\\')`;

export function categorize(overtureCategory: string): [PoiCategory, string] | null {
	if (overtureCategory in CATEGORY_MAP) return CATEGORY_MAP[overtureCategory];
	if (overtureCategory.endsWith(RESTAURANT_SUFFIX)) {
		return ["food", overtureCategory === "fast_food_restaurant" ? "fast_food" : "restaurant"];
	}
	return null;
}
