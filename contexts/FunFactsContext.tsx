import bundledFile from "@/scripts/facts/facts.json";
import type { FunFact } from "@/types/FunFact";
import { FACTS_CHECK_INTERVAL_MS, fetchFunFactsIfChanged, parseFunFacts } from "@/utils/fun-facts";
import { getCachedFunFacts, getFunFactsCheckedAt, saveFunFactsCheckedAt } from "@/utils/storage";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

const FunFactsContext = createContext<FunFact[] | undefined>(undefined);

// Shown until a published copy has been downloaded
const BUNDLED_FACTS = parseFunFacts(bundledFile);

// The cached copy, when it has facts this app version can show
async function readCache() {
	try {
		const cached = await getCachedFunFacts();
		const facts = parseFunFacts(cached?.file);
		return cached && facts.length > 0 ? { facts, sha: cached.sha } : null;
	} catch (error) {
		console.warn('Error reading cached fun facts:', error);
		return null;
	}
}

export function FunFactsProvider({ children }: { children: ReactNode }) {
	const [facts, setFacts] = useState(BUNDLED_FACTS);

	useEffect(() => {
		let cancelled = false;

		const load = async () => {
			const cached = await readCache();
			if (cancelled) return;
			if (cached) setFacts(cached.facts);

			try {
				const checkedAt = await getFunFactsCheckedAt();
				if (cached && checkedAt !== null && Date.now() - checkedAt < FACTS_CHECK_INTERVAL_MS) return;

				const updatedFacts = parseFunFacts(await fetchFunFactsIfChanged(cached?.sha));
				if (updatedFacts.length > 0 && !cancelled) setFacts(updatedFacts);
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
