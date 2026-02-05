# FastAPI Migration Guide: Video Processing API Only

## 1) Scope (What to migrate)
Only the HTTP API for processing a YouTube video and returning processed content.
Exclude everything else: users/auth, admin, templates/static, DB models/migrations, and any non-API features.

Source of truth in this repo:
- `getoutvideo_django/video_processor/views.py`
- `getoutvideo_django/video_processor/services.py`
- `getoutvideo_django/video_processor/serializers.py`
- `getoutvideo_django/video_processor/exceptions.py`
- `getoutvideo_django/video_processor/urls.py`

## 2) Minimal Dependencies
Required:
- `fastapi`
- `uvicorn`
- `getoutvideo==1.1.1`

Optional (for `.env` support):
- `python-dotenv`

Standard library used:
- `tempfile`, `pathlib`, `datetime`, `time`, `logging`

## 3) Environment / Config
Required env var:
- `OPENAI_API_KEY`

In Django, it is read via `GETOUTVIDEO_CONFIG["OPENAI_API_KEY"]`.
In FastAPI, read directly from env (or via `python-dotenv`).

Example `.env`:
```
OPENAI_API_KEY=sk-...
```

## 4) Database Tables
None.
`getoutvideo_django/video_processor/models.py` is empty.
No migrations required.

## 5) HTTP API Contract (Keep as-is)
**Endpoint:** `POST /api/v1/video/process/`
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

## 6) Validation Rules (Port from serializers)
- `video_url` must be a valid YouTube URL:
  - `https://www.youtube.com/watch?v=...`
  - `https://youtu.be/...`
  - `https://www.youtube.com/embed/...`
  - `https://www.youtube.com/v/...`
- `styles` (if provided) must be one of:
  - `Summary`, `Educational`, `Balanced`, `QA Generation`, `Narrative`
- `output_language` defaults to `"English"`

Note: The service also validates styles against the API's available styles.
If you want fewer rejections, you can relax the static `styles` list and rely on the service validation.

## 7) Processing Logic (Service to Port)
Port `VideoProcessingService` from `getoutvideo_django/video_processor/services.py`.

Key behaviors:
- Initialize `GetOutVideoAPI(openai_api_key=OPENAI_API_KEY)` at startup.
- If `styles` is None, fetch all available styles.
- Validate styles against `GetOutVideoAPI.get_available_styles()`.
- Use temporary directory for output files:
  - `GetOutVideoAPI.process_youtube_url(url, output_dir, styles, output_language)`
- Parse output files:
  - Map file names to result keys (`summary`, `educational`, `balanced`, `qa_generation`, `narrative`).
  - Extract video title from filename prefix.
- Return structured response with metadata and processing time.

### Style Mapping Used
```
"Balanced and Detailed" -> "balanced"
"Summary"               -> "summary"
"Educational"           -> "educational"
"Narrative Rewriting"   -> "narrative"
"Q&A Generation"        -> "qa_generation"
```

## 8) Exceptions to Port
From `getoutvideo_django/video_processor/exceptions.py`:

- `VideoValidationError` -> HTTP 400
- `ProcessingTimeoutError` -> HTTP 422
- `ConfigurationError` -> HTTP 500
- `ExternalServiceError` -> HTTP 502

Create FastAPI exception handlers to return:
```
{"status": "error", "error": message, "code": status_code}
```

## 9) FastAPI Skeleton (Example Structure)
Recommended files:
- `app/main.py` (FastAPI app + router)
- `app/schemas.py` (Pydantic models)
- `app/services.py` (VideoProcessingService)
- `app/exceptions.py` (custom exceptions + handlers)

Minimal endpoint behavior:
1) Validate request body.
2) Call `VideoProcessingService.process_video(...)`.
3) Return response in the same envelope format.

## 10) Migration Steps Checklist
1) Create FastAPI project and install dependencies.
2) Add `.env` and load `OPENAI_API_KEY`.
3) Copy service logic and exceptions.
4) Implement request/response models in Pydantic.
5) Implement endpoint with the same path.
6) Add exception handlers for custom errors.
7) Test with a real YouTube URL.

## 11) Test Scenarios
- Valid request with styles and output_language -> 200.
- Valid request with only video_url -> 200 (defaults apply).
- Invalid YouTube URL -> 400.
- Invalid style -> 400.
- Missing API key -> 500.
- External API failure -> 502.
- Timeout -> 422.
