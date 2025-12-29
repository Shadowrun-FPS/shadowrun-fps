/**
 * Cloudflare R2 Client for generating presigned URLs and accessing objects
 * Uses AWS S3-compatible API
 */

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { safeLog } from "@/lib/security";

// Validate required environment variables (lazy check to avoid module load errors)
function validateR2Config() {
  if (!process.env.R2_ACCOUNT_ID) {
    throw new Error("Missing R2_ACCOUNT_ID environment variable");
  }
  if (!process.env.R2_ACCESS_KEY_ID) {
    throw new Error("Missing R2_ACCESS_KEY_ID environment variable");
  }
  if (!process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error("Missing R2_SECRET_ACCESS_KEY environment variable");
  }
  if (!process.env.R2_BUCKET_NAME) {
    throw new Error("Missing R2_BUCKET_NAME environment variable");
  }
}

// Create S3-compatible client for R2 (lazy initialization)
let r2Client: S3Client | null = null;
let BUCKET_NAME: string | null = null;

function getR2ClientInstance(): S3Client {
  if (!r2Client) {
    validateR2Config();
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
    BUCKET_NAME = process.env.R2_BUCKET_NAME!;
  }
  return r2Client;
}

function getBucketNameInternal(): string {
  if (!BUCKET_NAME) {
    validateR2Config();
    BUCKET_NAME = process.env.R2_BUCKET_NAME!;
  }
  return BUCKET_NAME;
}

/**
 * Generate a presigned URL for downloading a file from R2
 * @param objectKey - The object key (path) in R2, e.g., "launcher/Shadowrun FPS Launcher Setup 0.9.93.exe"
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Presigned URL that can be used to download the file
 */
export async function generatePresignedDownloadUrl(
  objectKey: string,
  expiresIn: number = 3600, // 1 hour default
  filename?: string // Optional filename for Content-Disposition header
): Promise<string> {
  const client = getR2ClientInstance();
  const bucket = getBucketNameInternal();

  // Extract filename from objectKey if not provided
  const downloadFilename = filename || objectKey.split("/").pop() || "download";

  // Clean filename - remove any problematic characters
  const cleanFilename = downloadFilename.replace(/[^\w\s.-]/g, "_");

  // Format Content-Disposition header
  // Use simple format first - some browsers have issues with filename*
  // Escape quotes properly for the header value
  const contentDisposition = `attachment; filename="${cleanFilename.replace(
    /"/g,
    '\\"'
  )}"`;

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    // Add Content-Disposition header to force download with proper filename
    ResponseContentDisposition: contentDisposition,
  });

  safeLog.log(
    `[R2] Generating presigned URL with Content-Disposition: ${contentDisposition}`
  );
  safeLog.log(`[R2] Filename: ${cleanFilename}`);

  const url = await getSignedUrl(client, command, { expiresIn });

  // Verify the URL contains the response-content-disposition parameter
  safeLog.log(
    `[R2] Generated URL contains 'response-content-disposition': ${url.includes(
      "response-content-disposition"
    )}`
  );

  return url;
}

/**
 * Fetch a text file from R2 (e.g., latest.yml, changelog.json)
 * @param objectKey - The object key (path) in R2
 * @returns The file content as text
 */
export async function fetchTextFromR2(objectKey: string): Promise<string> {
  const client = getR2ClientInstance();
  const bucket = getBucketNameInternal();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: objectKey,
  });

  const response = await client.send(command);

  if (!response.Body) {
    throw new Error(`No body in response for ${objectKey}`);
  }

  // Convert stream to text
  const chunks: Uint8Array[] = [];
  const reader = response.Body.transformToWebStream().getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const buffer = Buffer.concat(chunks);
  return buffer.toString("utf-8");
}

/**
 * Get the R2 client instance (for advanced usage)
 */
export function getR2Client(): S3Client {
  return getR2ClientInstance();
}

/**
 * Get the bucket name (exported function)
 */
export function getBucketName(): string {
  return getBucketNameInternal();
}
