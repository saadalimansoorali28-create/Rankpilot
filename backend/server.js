const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");

const app = express();
const port = process.env.PORT || 8080;
const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";

app.use(cors({
  origin: allowedOrigin === "*" ? true : allowedOrigin,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "32kb" }));

function validBilibiliUrl(value) {
  try {
    const u = new URL(String(value));
    return u.protocol === "http:" || u.protocol === "https:"
      ? /(^|\.)bilibili\.com$/i.test(u.hostname) || /(^|\.)bilibili\.tv$/i.test(u.hostname)
      : false;
  } catch {
    return false;
  }
}

function runYtDlp(url) {
  return new Promise((resolve, reject) => {
    const args = [
      "--dump-single-json",
      "--skip-download",
      "--no-playlist",
      "--no-warnings",
      "--no-check-certificates",
      url
    ];
    const child = spawn(process.env.YTDLP_BIN || "yt-dlp", args, {
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", chunk => { stdout += chunk.toString(); });
    child.stderr.on("data", chunk => { stderr += chunk.toString(); });

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Downloader timed out."));
    }, 45000);

    child.on("error", err => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", code => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(stderr.trim() || "yt-dlp could not parse this video."));
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error("Downloader returned an invalid response."));
      }
    });
  });
}

function formatsFromInfo(info) {
  const seen = new Set();
  return (info.formats || [])
    .filter(f => f.url && (f.vcodec !== "none" || f.acodec !== "none"))
    .sort((a, b) => ((b.height || 0) - (a.height || 0)) || ((b.tbr || 0) - (a.tbr || 0)))
    .map(f => {
      const height = f.height ? f.height + "p" : "audio";
      const codec = f.vcodec && f.vcodec !== "none" ? f.vcodec : f.acodec || "media";
      const label = [height, f.fps ? Math.round(f.fps) + "fps" : "", codec].filter(Boolean).join(" · ");
      return {
        id: f.format_id,
        label,
        url: f.url,
        ext: f.ext || "mp4",
        height: f.height || 0,
        hasVideo: f.vcodec && f.vcodec !== "none",
        hasAudio: f.acodec && f.acodec !== "none"
      };
    })
    .filter(f => {
      const key = f.label + "|" + f.ext;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);
}

app.get("/health", (_req, res) => res.json({ ok: true, engine: "yt-dlp" }));

app.post("/api/bilibili/parse", async (req, res) => {
  const url = req.body?.url;
  if (!validBilibiliUrl(url)) {
    return res.status(400).json({ ok: false, error: "Only Bilibili URLs are accepted." });
  }

  try {
    const info = await runYtDlp(url);
    const formats = formatsFromInfo(info);
    if (!formats.length) {
      return res.status(422).json({ ok: false, error: "No downloadable source format was returned." });
    }
    res.json({
      ok: true,
      title: info.title || "Bilibili video",
      thumbnail: info.thumbnail || null,
      duration: info.duration || null,
      formats
    });
  } catch (error) {
    res.status(502).json({ ok: false, error: error.message || "Downloader error." });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log("RankPilot Bilibili backend listening on " + port);
});
