import bundledFile from "@/scripts/facts/facts.json";
import type { FunFact } from "@/types/FunFact";
import { FACTS_CHECK_INTERVAL_MS, fetchFunFactsIfChanged, getFactImageUrl, parseFunFacts } from "@/utils/fun-facts";
import { getCachedFunFacts, getFunFactsCheckedAt, saveFunFactsCheckedAt } from "@/utils/storage";
import { Image } from "expo-image";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

const FunFactsContext = createContext<FunFact[] | undefined>(undefined);

// Shown until a published copy has been downloaded
const BUNDLED_FACTS = parseFunFacts(bundledFile);

// Saves images to disk when a new copy arrives, so they still show without signal on the trail.
// Prefetching always downloads, even when the image is already cached.
function prefetchImages(facts: FunFact[]) {
	const urls = facts.flatMap(fact => getFactImageUrl(fact) ?? []);
	if (urls.length === 0) return;
	Image.prefetch(urls, 'disk').catch(error => console.warn('Error prefetching fun fact images:', error));
}

export function FunFactsProvider({ children }: { children: ReactNode }) {
	const [facts, setFacts] = useState(BUNDLED_FACTS);

	useEffect(() => {
		let cancelled = false;

		const load = async () => {
			let cached = null;
			try {
				cached = await getCachedFunFacts();
			} catch (error) {
				console.warn('Error reading cached fun facts:', error);
			}
			const cachedFacts = cached ? parseFunFacts(cached.file) : [];
			if (cancelled) return;
			if (cachedFacts.length > 0) setFacts(cachedFacts);

			try {
				const checkedAt = await getFunFactsCheckedAt();
				if (cachedFacts.length > 0 && checkedAt !== null && Date.now() - checkedAt < FACTS_CHECK_INTERVAL_MS) return;

				const updated = await fetchFunFactsIfChanged(cachedFacts.length > 0 ? cached?.sha : undefined);
				const updatedFacts = updated ? parseFunFacts(updated) : [];
				if (updatedFacts.length > 0) {
					if (!cancelled) setFacts(updatedFacts);
					prefetchImages(updatedFacts);
				}
				await saveFunFactsCheckedAt(Date.now());
			} catch (error) {
				console.warn('Error updating fun facts:', error);
			}
		};

		load();
		return () => {
			cancelled = true;
		};
	}, []);

	return <FunFactsContext.Provider value={facts}>{children}</FunFactsContext.Provider>;
}

export function useFunFacts() {
	const context = useContext(FunFactsContext);
	if (context === undefined) {
		throw new Error('useFunFacts must be used within a FunFactsProvider');
	}
	return context;
}
