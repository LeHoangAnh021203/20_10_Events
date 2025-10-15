import { NextRequest } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import puppeteerLocal from "puppeteer";

export const runtime = "nodejs";     // Puppeteer cần Node runtime
export const maxDuration = 60;       // Vercel: tăng timeout

type ExportPayload = {
  width?: number;     // px
  height?: number;    // px
  scale?: number;     // 1..3   (deviceScaleFactor)
  data: {
    senderName: string;
    receiverName: string;
    message: string;
    headerUrl?: string;
    footerUrl?: string;
    stickers?: string[];
    lang?: string;
  };
};

function toAbsolute(origin: string, url?: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return origin.replace(/\/+$/,"") + "/" + url.replace(/^\/+/,"");
}

export async function POST(req: NextRequest) {
  try {
    console.log("Starting export-card API...");
    const origin = req.headers.get("origin") || req.nextUrl.origin;
    console.log("Origin:", origin);
    
    const body = await req.json();
    console.log("Request body:", JSON.stringify(body, null, 2));
    
    const { width = 1440, height = 2560, scale = 2, data }: ExportPayload = body;

    // Tuyệt đối hoá đường dẫn ảnh để headless có thể tải
    const payload = {
      ...data,
      width, height,
      headerUrl: toAbsolute(origin, data.headerUrl ?? "/Header fix@4x.png"),
      footerUrl: toAbsolute(origin, data.footerUrl ?? "/Footer@4x.png"),
      stickers: (data.stickers ?? []).map(s => toAbsolute(origin, s)),
    };

    const b64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
    const targetUrl = `${origin}/export/card?payload=${encodeURIComponent(b64)}`;
    console.log("Target URL:", targetUrl);

    console.log("Getting Chromium executable path...");
    let exePath;
    let launchOptions;
    
    // Check if we're in production (Vercel) or development
    if (process.env.NODE_ENV === 'production') {
      exePath = await chromium.executablePath();
      launchOptions = {
        args: [...chromium.args, "--font-render-hinting=medium"],
        defaultViewport: { width, height, deviceScaleFactor: Math.min(3, Math.max(1, scale)) },
        executablePath: exePath,
        headless: true,
      };
    } else {
      // For local development, try to use system Chrome
      launchOptions = {
        args: ["--font-render-hinting=medium", "--no-sandbox", "--disable-setuid-sandbox"],
        defaultViewport: { width, height, deviceScaleFactor: Math.min(3, Math.max(1, scale)) },
        headless: true,
      };
    }
    
    console.log("Chromium path:", exePath);
    console.log("Launch options:", launchOptions);

    console.log("Launching Puppeteer browser...");
    const browser = process.env.NODE_ENV === 'production' 
      ? await puppeteer.launch(launchOptions)
      : await puppeteerLocal.launch(launchOptions);
    console.log("Browser launched successfully");

    const page = await browser.newPage();
    console.log("New page created");

    // Đảm bảo font & ảnh đã tải
    console.log("Navigating to target URL...");
    await page.goto(targetUrl, { waitUntil: "networkidle0", timeout: 45000 });
    console.log("Page loaded successfully");
    
    await page.evaluate(async () => {
      // Wait for fonts to be ready if supported by the browser environment
      const doc = document as Document & { fonts?: { ready?: Promise<void> } };
      if (doc.fonts?.ready) {
        await doc.fonts.ready;
      }
    });
    console.log("Fonts loaded");

    // Screenshot full khung .canvas
    console.log("Taking screenshot...");
    const el = await page.$(".canvas");
    const imageBuffer = el
      ? await el.screenshot({ type: "png" })
      : await page.screenshot({ type: "png", fullPage: false });
    console.log("Screenshot taken, buffer size:", imageBuffer.length);

    await browser.close();

    // Create a fresh Uint8Array copy to ensure ArrayBuffer compatibility
    const bodyBytes = new Uint8Array(imageBuffer.length);
    bodyBytes.set(imageBuffer);

    return new Response(bodyBytes, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="foxie-card-${Date.now()}.png"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    console.error("EXPORT ERROR", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: "EXPORT_FAILED", detail: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

