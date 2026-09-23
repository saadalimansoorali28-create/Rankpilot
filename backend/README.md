# RankPilot Bilibili backend

This service keeps the downloader engine off the GitHub Pages frontend.

## Engine

The first production engine is **yt-dlp**, which currently lists BiliBili among its supported extractors. BBDown remains a compatible alternative for a later server deployment where its API/server mode is preferred.

## Environment

- `PORT` — default `8080`
- `ALLOWED_ORIGIN` — set to `https://rankpilot.eu.cc` in production
- `YTDLP_BIN` — optional custom yt-dlp executable path

## Endpoint

POST `/api/bilibili/parse`

Body:

```json
{"url":"https://www.bilibili.com/video/BV..."}
```

The response contains source-provided format URLs. URLs may expire and some formats may require authentication or be unavailable in a user's region.

This service does not remove embedded watermarks, bypass DRM, or bypass access restrictions.

## Deployment

The GitHub Pages frontend is already wired to call `/api/bilibili/parse`. Deploy this backend on a server/container platform and set the frontend's `window.RANKPILOT_API_BASE` to that backend's public API base URL.
