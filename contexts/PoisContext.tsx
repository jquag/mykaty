import { Poi, POI_CHECK_INTERVAL_MS, POI_SCHEMA_VERSION, PoiCategory, PoiFile, PoiRouteFile } from "@/constants/pois";
import { fetchPoiDataIfChanged } from "@/utils/pois";
import { getCachedPoiRoutes, getCachedPois, getPoiCategories, getPoisCheckedAt, savePoiCategories, savePoisCheckedAt } from "@/utils/storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

interface PoisContextType {
	pois: Poi[];
	// Encoded bike route lines keyed by POI id; see getPoiRouteCoordinates
	routes: Record<string, string>;
	attribution: string | null;
	enabledCategories: ReadonlySet<PoiCategory>;
	setCategoriesEnabled: (categories: PoiCategory[]) => void;
}

const PoisContext = createContext<PoisContextType | undefined>(undefined);

const NO_POIS: Poi[] = [];
const NO_ROUTES: Record<string, string> = {};

export function PoisProvider({ children }: { children: ReactNode }) {
	const [file, setFile] = useState<PoiFile | null>(null);
	const [routeFile, setRouteFile] = useState<PoiRouteFile | null>(null);
	const [enabledCategories, setEnabledCategories] = useState<ReadonlySet<PoiCategory>>(new Set());
	// Set once the user picks categories, so the stored selection arriving later doesn't overwrite theirs
	const categoriesChangedRef = useRef(false);

	useEffect(() => {
		let cancelled = false;

		const readCache = async <T extends { schemaVersion: number }>(read: () => Promise<{ file: T; sha: string } | null>) => {
			try {
				const cached = await read();
				return cached?.file.schemaVersion === POI_SCHEMA_VERSION ? cached : null;
			} catch (error) {
				console.warn('Error reading cached POIs:', error);
				return null;
			}
		};

		const load = async () => {
			const [cached, cachedRoutes] = await Promise.all([readCache(getCachedPois), readCache(getCachedPoiRoutes)]);
			if (cancelled) return;
			if (cached) setFile(cached.file);
			if (cachedRoutes) setRouteFile(cachedRoutes.file);

			try {
				const checkedAt = await getPoisCheckedAt();
				if (cached && checkedAt !== null && Date.now() - checkedAt < POI_CHECK_INTERVAL_MS) return;

				const updated = await fetchPoiDataIfChanged(cached?.sha, cachedRoutes?.sha);
				if (!cancelled) {
					if (updated.pois) setFile(updated.pois);
					if (updated.routes) setRouteFile(updated.routes);
				}
				await savePoisCheckedAt(Date.now());
			} catch (error) {
				console.warn('Error updating POIs:', error);
			}
		};

		load();
		getPoiCategories()
			.then(categories => {
				if (!cancelled && !categoriesChangedRef.current) setEnabledCategories(new Set(categories));
			})
			.catch(error => console.error('Error loading POI categories:', error));

		return () => {
			cancelled = true;
		};
	}, []);

	const setCategoriesEnabled = useCallback((categories: PoiCategory[]) => {
		categoriesChangedRef.current = true;
		setEnabledCategories(new Set(categories));
		savePoiCategories(categories).catch(error => console.error('Error saving POI categories:', error));
	}, []);

	const value = useMemo(
		() => ({
			pois: file?.pois ?? NO_POIS,
			// Lines from another build could start at a different trail exit than the POI lists
			routes: routeFile && routeFile.generatedAt === file?.generatedAt ? routeFile.routes : NO_ROUTES,
			attribution: file?.attribution ?? null,
			enabledCategories,
			setCategoriesEnabled,
		}),
		[file, routeFile, enabledCategories, setCategoriesEnabled]
	);

	return <PoisContext.Provider value={value}>{children}</PoisContext.Provider>;
}

export function usePois() {
	const context = useContext(PoisContext);
	if (context === undefined) {
		throw new Error('usePois must be used within a PoisProvider');
	}
	return context;
}
