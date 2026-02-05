import time
from datetime import datetime, timezone
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Iterable

from getoutvideo import GetOutVideoAPI

from app.core.config import settings
from app.video_processor.exceptions import (
    ConfigurationError,
    ExternalServiceError,
    ProcessingTimeoutError,
    VideoValidationError,
)
from app.video_processor.schemas import (
    ALLOWED_STYLES,
    API_STYLE_TO_RESULT_KEY,
    REQUEST_TO_API_STYLE,
    VideoProcessData,
    VideoProcessMetadata,
    VideoProcessResults,
)


YOUTUBE_URL_PATTERNS = [
    r"^https?://(www\.)?youtube\.com/watch\?.*v=[^&]+",
    r"^https?://youtu\.be/[^?]+",
    r"^https?://(www\.)?youtube\.com/embed/[^?]+",
    r"^https?://(www\.)?youtube\.com/v/[^?]+",
]


class VideoProcessingService:
    def __init__(self, api_client: GetOutVideoAPI | None = None) -> None:
        self._api_client = api_client

    def process_video(
        self, video_url: str, styles: list[str] | None, output_language: str
    ) -> VideoProcessData:
        start_time = time.perf_counter()
        self._validate_video_url(video_url)
        if styles is not None:
            self._validate_styles(styles)

        api = self._get_api_client()
        selected_styles = self._resolve_styles(styles, api)

        with TemporaryDirectory() as temp_dir:
            output_dir = Path(temp_dir)
            try:
                api.process_youtube_url(
                    video_url,
                    output_dir=output_dir,
                    styles=selected_styles,
                    output_language=output_language,
                )
            except TimeoutError as exc:
                raise ProcessingTimeoutError("Video processing timed out.") from exc
            except Exception as exc:  # noqa: BLE001 - external library surface
                raise ExternalServiceError("Video processing failed.") from exc

            results, video_title = self._parse_outputs(output_dir)

        if not results:
            raise ExternalServiceError("No processed results were returned.")

        processing_time = round(time.perf_counter() - start_time, 2)
        processed_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        styles_processed = self._resolve_processed_styles(styles, selected_styles)

        return VideoProcessData(
            video_url=video_url,
            video_title=video_title or video_url,
            processed_at=processed_at,
            results=VideoProcessResults(**results),
            metadata=VideoProcessMetadata(
                processing_time=processing_time,
                language=output_language,
                styles_processed=styles_processed,
            ),
        )

    def _get_api_client(self) -> GetOutVideoAPI:
        if self._api_client is not None:
            return self._api_client
        if not settings.OPENAI_API_KEY:
            raise ConfigurationError("OPENAI_API_KEY is not configured.")
        return GetOutVideoAPI(openai_api_key=settings.OPENAI_API_KEY)

    def _validate_video_url(self, video_url: str) -> None:
        if not any(_matches_pattern(video_url, pattern) for pattern in YOUTUBE_URL_PATTERNS):
            raise VideoValidationError("Invalid YouTube URL.")

    def _validate_styles(self, styles: Iterable[str]) -> None:
        invalid = [style for style in styles if style not in ALLOWED_STYLES]
        if invalid:
            raise VideoValidationError(f"Invalid styles: {', '.join(invalid)}.")

    def _resolve_styles(
        self, styles: list[str] | None, api: GetOutVideoAPI
    ) -> list[str]:
        try:
            available_styles = set(api.get_available_styles())
        except Exception as exc:  # noqa: BLE001 - external library surface
            raise ExternalServiceError("Failed to retrieve available styles.") from exc
        if styles is None:
            resolved = [
                api_style
                for api_style in REQUEST_TO_API_STYLE.values()
                if api_style in available_styles
            ]
            if not resolved:
                raise ExternalServiceError("No compatible styles returned by the API.")
            return resolved

        api_styles = [REQUEST_TO_API_STYLE[style] for style in styles]
        unsupported = [style for style in api_styles if style not in available_styles]
        if unsupported:
            raise VideoValidationError(
                f"Styles not supported by the API: {', '.join(unsupported)}."
            )
        return api_styles

    def _resolve_processed_styles(
        self, styles: list[str] | None, selected_styles: list[str]
    ) -> list[str]:
        if styles is not None:
            return styles
        api_to_request = {value: key for key, value in REQUEST_TO_API_STYLE.items()}
        return [api_to_request.get(style, style) for style in selected_styles]

    def _parse_outputs(self, output_dir: Path) -> tuple[dict[str, str], str]:
        results: dict[str, str] = {}
        video_title = ""
        for file_path in sorted(output_dir.iterdir()):
            if not file_path.is_file():
                continue
            api_style = self._detect_style(file_path.name)
            if not api_style:
                continue
            result_key = API_STYLE_TO_RESULT_KEY.get(api_style)
            if not result_key:
                continue
            content = file_path.read_text(encoding="utf-8").strip()
            results[result_key] = content
            if not video_title:
                video_title = self._extract_title(file_path.stem, api_style)
        return results, video_title

    def _detect_style(self, filename: str) -> str | None:
        lower_name = filename.lower()
        for api_style in API_STYLE_TO_RESULT_KEY:
            if api_style.lower() in lower_name:
                return api_style
        return None

    def _extract_title(self, stem: str, api_style: str) -> str:
        lower_stem = stem.lower()
        index = lower_stem.find(api_style.lower())
        if index == -1:
            return _cleanup_title(stem)
        title_part = stem[:index].rstrip(" -_")
        return _cleanup_title(title_part or stem)


def _matches_pattern(value: str, pattern: str) -> bool:
    import re

    return re.match(pattern, value) is not None


def _cleanup_title(value: str) -> str:
    return value.replace("_", " ").replace("-", " ").strip()
