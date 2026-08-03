/**
 * ImageKit media library, server-side only. The private key is the whole auth
 * story here — never import this from a screen or component.
 *
 * The read-side URL transforms live in `src/lib/image-url.ts`, which is safe to
 * import anywhere.
 */
function authHeader() {
  let privateKey = process.env.IMAGEKIT_PRIVATE_KEY ?? process.env.IMAGEKIT_SECRET_KEY;
  if (!privateKey) throw new Error("Add IMAGEKIT_PRIVATE_KEY to your .env file");
  // Tolerate a value that was pasted into .env with surrounding quotes.
  privateKey = privateKey.replace(/^['"]|['"]$/g, "");
  return `Basic ${btoa(`${privateKey}:`)}`;
}

/** Server-side upload: private key, no signed-token dance for the client. */
export async function uploadToImageKit(base64: string, fileName: string): Promise<string> {
  const form = new FormData();
  // The upload API takes bare base64 — strip a `data:image/jpeg;base64,` prefix
  // if the client sent a full data URL.
  form.append("file", base64.includes(",") ? base64.split(",")[1] : base64);
  form.append("fileName", fileName);
  form.append("folder", "/meals");

  const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: { Authorization: authHeader() },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`ImageKit upload failed (${response.status}): ${await response.text()}`);
  }

  const { url } = (await response.json()) as { url: string };
  return url;
}

const PAGE = 1000; // the list endpoint's ceiling
const BATCH = 100; // deleteByFileIds' ceiling

/**
 * Every photo this user ever uploaded, gone. Returns how many were deleted.
 *
 * Found by filename prefix (`meal-<userId>-…`, set at upload) rather than by
 * reading their `meals` rows, because that also catches files whose row was
 * dropped or failed — exactly the orphans a row-driven delete would leave
 * behind forever.
 *
 * `userId` is the internal `users.id`, not the Clerk id.
 */
export async function deleteUserImages(userId: string): Promise<number> {
  const fileIds: string[] = [];

  for (let skip = 0; ; skip += PAGE) {
    const query = new URLSearchParams({
      searchQuery: `name : "meal-${userId}"`, // ':' is prefix match, case-sensitive
      limit: String(PAGE),
      skip: String(skip),
    });

    const response = await fetch(`https://api.imagekit.io/v1/files?${query}`, {
      headers: { Authorization: authHeader() },
    });

    if (!response.ok) {
      throw new Error(`ImageKit list failed (${response.status}): ${await response.text()}`);
    }

    // The REST API answers with a bare array; the documented SDK shape wraps it.
    const body = await response.json();
    const page: { fileId: string }[] = Array.isArray(body) ? body : (body?.assets ?? []);

    fileIds.push(...page.map((file) => file.fileId));
    if (page.length < PAGE) break;
  }

  // Chunked: deleteByFileIds rejects more than 100 ids in one call.
  for (let i = 0; i < fileIds.length; i += BATCH) {
    const response = await fetch("https://api.imagekit.io/v1/files/batch/deleteByFileIds", {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ fileIds: fileIds.slice(i, i + BATCH) }),
    });

    if (!response.ok) {
      throw new Error(`ImageKit delete failed (${response.status}): ${await response.text()}`);
    }
  }

  return fileIds.length;
}
