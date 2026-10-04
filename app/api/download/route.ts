import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const source = searchParams.get("source") || "subdl";

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    const headers: Record<string, string> = {};
    let downloadUrl = url;

    if (source === "subdl") {
      const apiKey = process.env.SUBDL_API_KEY;
      // Build proper SubDL download URL
      if (url.startsWith("/subtitle/")) {
        downloadUrl = `https://dl.subdl.com${url}${apiKey ? `?api_key=${apiKey}` : ""}`;
      } else if (!url.startsWith("http")) {
        downloadUrl = `https://dl.subdl.com${url}`;
      }
    } else if (source === "subsource") {
      const apiKey = process.env.SUBSOURCE_API_KEY;
      if (apiKey) headers["X-API-Key"] = apiKey;
      if (!url.startsWith("http")) {
        downloadUrl = `https://api.subsource.net${url}`;
      }
    }

    const res = await fetch(downloadUrl, { headers });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Download failed: ${res.status}` },
        { status: res.status }
      );
    }

    const blob = await res.blob();
    const contentType =
      res.headers.get("content-type") || "application/octet-stream";
    const contentDisposition =
      res.headers.get("content-disposition") ||
      `attachment; filename="subtitle.zip"`;

    return new NextResponse(blob, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition,
      },
    });
  } catch (e) {
    console.error("Download error:", e);
    return NextResponse.json(
      { error: "Download failed" },
      { status: 500 }
    );
  }
}
