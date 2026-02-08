# FastAPI Video Processing API Reference (Current Implementation)

## 1) Scope
This document describes the **implemented** HTTP API for processing a YouTube video and returning processed content.
It covers only the video-processing endpoint and related service logic (no users/auth/admin/DB features).

## 2) Source of Truth (FastAPI)
- `backend/app/video_processor/service.py`
- `backend/app/video_processor/schemas.py`
- `backend/app/video_processor/exceptions.py`
- `backend/app/api/routes/video.py`
- `backend/app/main.py`

## 3) Minimal Dependencies (Video API)
Required:
- `fastapi`
- `getoutvideo==1.1.1`
- `pydantic`
- `pydantic-settings`

Standard library used:
- `tempfile`, `pathlib`, `datetime`, `time`, `re`

## 4) Environment / Config
Required env var:
- `OPENAI_API_KEY`

It is loaded by `backend/app/core/config.py` from the repo root `.env` file (`env_file="../.env"`).
If `OPENAI_API_KEY` is missing, the service raises `ConfigurationError` and returns HTTP 500.

## 5) HTTP API Contract (Current)
**Endpoint:** `POST /api/v1/video/process`
**Public:** no auth required.

### Request JSON
```
{
  "video_url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "styles": ["Summary", "Educational"],
  "output_language": "English"
}
```

### Response JSON (success)
`response_model_exclude_none=True` means missing style outputs are omitted from `results`.

```
{
  "status": "success",
  "data": {
    "video_url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "video_title": "Video Title",
    "processed_at": "2024-01-01T12:00:00Z",
    "results": {
      "summary": "...",
      "educational": "...",
      "balanced": "...",
      "qa_generation": "...",
      "narrative": "..."
    },
    "metadata": {
      "processing_time": 25.5,
      "language": "English",
      "styles_processed": ["Summary", "Educational"]
    }
  }
}
```

### Response JSON (error)
```
{
  "status": "error",
  "error": "Message",
  "code": 400
}
```

## 6) Validation Rules (From schemas/service)
- `video_url` must be a valid YouTube URL:
  - `https://www.youtube.com/watch?v=...`
  - `https://youtu.be/...`
  - `https://www.youtube.com/embed/...`
  - `https://www.youtube.com/v/...`
- `styles` (if provided) must be one of:
  - `Summary`, `Educational`, `Balanced`, `QA Generation`, `Narrative`
- `output_language` defaults to `"English"`

The service also validates requested styles against `GetOutVideoAPI.get_available_styles()` using the mapping in `REQUEST_TO_API_STYLE`.

## 7) Processing Logic (Service)
Implemented in `VideoProcessingService` (`backend/app/video_processor/service.py`).

Key behaviors:
- Uses `GetOutVideoAPI` client from app startup state if available; otherwise initializes it with `OPENAI_API_KEY`.
- If `styles` is `None`, it selects available API styles based on `REQUEST_TO_API_STYLE`.
- Validates requested styles against available API styles and errors if unsupported.
- Uses a temporary directory for output files:
  - `GetOutVideoAPI.process_youtube_url(url, output_dir, styles, output_language)`
- Parses output files, mapping API style names to result keys:
  - `Summary` -> `summary`
  - `Educational` -> `educational`
  - `Balanced and Detailed` -> `balanced`
  - `Q&A Generation` -> `qa_generation`
  - `Narrative Rewriting` -> `narrative`
- Extracts video title from file names; falls back to `video_url` if missing.

## 8) Exceptions & Error Handling
From `backend/app/video_processor/exceptions.py`:

- `VideoValidationError` -> HTTP 400
- `ProcessingTimeoutError` -> HTTP 422
- `ConfigurationError` -> HTTP 500
- `ExternalServiceError` -> HTTP 502

Additionally, `backend/app/main.py` registers a request validation handler that formats
`RequestValidationError` as a `400` error envelope for `/api/v1/video/process/`.

## 9) FastAPI Flow (Implemented)
1) `POST /api/v1/video/process` accepts `VideoProcessRequest`.
2) `VideoProcessingService.process_video(...)` runs the processing pipeline.
3) Response wrapped in `VideoProcessResponse` with metadata and results.

## 10) Test Scenarios
- Valid request with styles and `output_language` -> 200.
- Valid request with only `video_url` -> 200 (defaults apply).
- Invalid YouTube URL -> 400.
- Invalid style -> 400.
- Missing API key -> 500.
- External API failure -> 502.
- Timeout -> 422.
