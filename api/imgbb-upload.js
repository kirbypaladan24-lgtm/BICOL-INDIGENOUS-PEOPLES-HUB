export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.IMGBB_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing IMGBB_KEY environment variable" });
  }

  const image = typeof req.body?.image === "string" ? req.body.image.trim() : "";
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "upload.jpg";

  if (!image) {
    return res.status(400).json({ error: "Missing image payload" });
  }

  try {
    const form = new FormData();
    form.append("image", image);
    form.append("name", name);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: form,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorMessage =
        payload?.error?.message ||
        payload?.data?.error?.message ||
        "ImgBB upload failed";
      return res.status(response.status).json({ error: errorMessage });
    }

    return res.status(200).json({
      url: payload?.data?.display_url || payload?.data?.url || null,
    });
  } catch (error) {
    console.error("[imgbb-upload] Upload failed:", error);
    return res.status(500).json({ error: "Upload proxy failed" });
  }
}
