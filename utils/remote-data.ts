export async function fetchOk(url: string) {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`${url} returned ${response.status}`);
	return response;
}

// CDN caches expire independently, so a fresh manifest can arrive alongside a stale file
export async function fetchManifestFile<T extends { generatedAt: string }>(baseUrl: string, file: string, manifest: { generatedAt: string }) {
	const json = await (await fetchOk(`${baseUrl}/${file}`)).text();
	const parsed: T = JSON.parse(json);
	if (parsed.generatedAt !== manifest.generatedAt) {
		throw new Error(`${file} does not match the manifest`);
	}
	return { json, parsed };
}
