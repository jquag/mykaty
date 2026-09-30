import { Poi, POI_CATEGORIES, POI_CHECK_INTERVAL_MS, PoiCategory, PoiFile } from "@/constants/pois";
import { fetchPoisIfChanged } from "@/utils/pois";
import { getCachedPois, getPoiCategories, getPoisCheckedAt, savePoiCategories, savePoisCheckedAt } from "@/utils/storage";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface PoisContextType {
	pois: Poi[];
	attribution: string | null;
	enabledCategories: ReadonlySet<PoiCategory>;
	allCategoriesEnabled: boolean;
	toggleCategory: (category: PoiCategory) => void;
	setCategoriesEnabled: (categories: PoiCategory[]) => void;
}

const PoisContext = createContext<PoisContextType | undefined>(undefined);

const NO_POIS: Poi[] = [];

export function PoisProvider({ children }: { children: ReactNode }) {
	const [file, setFile] = useState<PoiFile | null>(null);
	const [enabledCategories, setEnabledCategories] = useState<ReadonlySet<PoiCategory>>(new Set());

	useEffect(() => {
		let cancelled = false;

		const load = async () => {
			const cached = await getCachedPois();
			if (cancelled) return;
			if (cached) setFile(cached.file);

			const checkedAt = await getPoisCheckedAt();
			if (cached && checkedAt !== null && Date.now() - checkedAt < POI_CHECK_INTERVAL_MS) return;

			try {
				const updated = await fetchPoisIfChanged(cached?.sha);
				if (!cancelled && updated) setFile(updated);
				await savePoisCheckedAt(Date.now());
			} catch (error) {
				console.warn('Error updating POIs:', error);
			}
		};

		load();
		getPoiCategories()
			.then(categories => {
				if (!cancelled) setEnabledCategories(new Set(categories));
			})
			.catch(error => console.error('Error loading POI categories:', error));

		return () => {
			cancelled = true;
		};
	}, []);

	const setCategoriesEnabled = useCallback((categories: PoiCategory[]) => {
		setEnabledCategories(new Set(categories));
		savePoiCategories(categories).catch(error => console.error('Error saving POI categories:', error));
	}, []);

	const toggleCategory = useCallback((category: PoiCategory) => {
		const updatedCategories = new Set(enabledCategories);
		if (updatedCategories.has(category)) {
			updatedCategories.delete(category);
		} else {
			updatedCategories.add(category);
		}
		setCategoriesEnabled([...updatedCategories]);
	}, [enabledCategories, setCategoriesEnabled]);

	const value = useMemo(
		() => ({
			pois: file?.pois ?? NO_POIS,
			attribution: file?.attribution ?? null,
			enabledCategories,
			allCategoriesEnabled: POI_CATEGORIES.every(category => enabledCategories.has(category.key)),
			toggleCategory,
			setCategoriesEnabled,
		}),
		[file, enabledCategories, toggleCategory, setCategoriesEnabled]
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
