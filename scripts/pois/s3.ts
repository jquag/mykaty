import { GetObjectCommand, NoSuchKey, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { S3_CACHE_CONTROL } from "./config.ts";

const bucket = process.env.POI_S3_BUCKET;
const prefix = (process.env.POI_S3_PREFIX ?? "").replace(/^\/+|\/+$/g, "");

let client: S3Client | null = null;

function getClient() {
	client ??= new S3Client({});
	return client;
}

function keyFor(file: string) {
	return prefix ? `${prefix}/${file}` : file;
}

export const s3Configured = Boolean(bucket);
export const s3Target = `s3://${bucket}${prefix ? `/${prefix}` : ""}`;

// Returns null when nothing has been published yet
export async function downloadPublished(file: string) {
	try {
		const response = await getClient().send(new GetObjectCommand({ Bucket: bucket, Key: keyFor(file) }));
		return (await response.Body?.transformToString()) ?? null;
	} catch (error) {
		if (error instanceof NoSuchKey) return null;
		throw error;
	}
}

export async function uploadJson(file: string, body: string) {
	await getClient().send(new PutObjectCommand({
		Bucket: bucket,
		Key: keyFor(file),
		Body: body,
		ContentType: "application/json",
		CacheControl: S3_CACHE_CONTROL,
	}));
	console.log(`uploaded s3://${bucket}/${keyFor(file)}`);
}
