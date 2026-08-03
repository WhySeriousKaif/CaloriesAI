/**
 * ImageKit media library — server-side helper to upload meal photos.
 */
function authHeader() {
  let privateKey =
    process.env.IMAGEKIT_PRIVATE_KEY ?? process.env.IMAGEKIT_SECRET_KEY;
  if (!privateKey) throw new Error("Add IMAGEKIT_PRIVATE_KEY to your .env file");
  privateKey = privateKey.replace(/^['"]|['"]$/g, "");
  return `Basic ${btoa(`${privateKey}:`)}`;
}

/** Server-side upload: uploads base64 meal photo to ImageKit. */
export async function uploadToImageKit(base64: string, fileName: string): Promise<string> {
  const form = new FormData();
  // Ensure data URL prefix is stripped if present
  const cleanBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
  form.append("file", cleanBase64);
  form.append("fileName", fileName);
  form.append("folder", "/meals");

  const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: { Authorization: authHeader() },
    body: form,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ImageKit upload failed (${response.status}): ${errText}`);
  }

  const { url } = (await response.json()) as { url: string };
  return url;
}

/**
 * Delete all meal images for a given user from ImageKit.
 */
export async function deleteUserImages(userId: string): Promise<number> {
  const fileIds: string[] = [];

  for (let skip = 0; ; skip += 1000) {
    const query = new URLSearchParams({
      searchQuery: `name : "meal-${userId}"`,
      limit: "1000",
      skip: String(skip),
    });

    const response = await fetch(`https://api.imagekit.io/v1/files?${query}`, {
      headers: { Authorization: authHeader() },
    });

    if (!response.ok) break;

    const body = await response.json();
    const page: { fileId: string }[] = Array.isArray(body) ? body : (body?.assets ?? []);

    fileIds.push(...page.map((file) => file.fileId));
    if (page.length < 1000) break;
  }

  if (fileIds.length > 0) {
    await fetch("https://api.imagekit.io/v1/files/batch/deleteByFileIds", {
      method: "POST",
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ fileIds }),
    });
  }

  return fileIds.length;
}
