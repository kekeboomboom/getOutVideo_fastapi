from fastapi.testclient import TestClient

from app.api.routes.video import get_video_service
from app.core.config import settings
from app.main import app
from app.video_processor.exceptions import ExternalServiceError, ProcessingTimeoutError
from app.video_processor.schemas import (
    VideoProcessData,
    VideoProcessMetadata,
    VideoProcessResults,
)


def _build_response(
    video_url: str,
    output_language: str,
    styles: list[str],
) -> VideoProcessData:
    return VideoProcessData(
        video_url=video_url,
        video_title="Test Video",
        processed_at="2024-01-01T12:00:00Z",
        results=VideoProcessResults(summary="Summary text"),
        metadata=VideoProcessMetadata(
            processing_time=1.23,
            language=output_language,
            styles_processed=styles,
        ),
    )


def test_video_process_success(
    client: TestClient,
) -> None:
    payload = {
        "video_url": "https://www.youtube.com/watch?v=abc123",
        "styles": ["Summary"],
        "output_language": "English",
    }

    class FakeService:
        def process_video(self, video_url: str, styles: list[str], output_language: str):
            return _build_response(video_url, output_language, styles)

    app.dependency_overrides[get_video_service] = lambda: FakeService()
    try:
        response = client.post(
            f"{settings.API_V1_STR}/video/process/",
            json=payload,
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    content = response.json()
    assert content["status"] == "success"
    assert content["data"]["video_url"] == payload["video_url"]
    assert content["data"]["metadata"]["language"] == payload["output_language"]
    assert content["data"]["results"]["summary"] == "Summary text"


def test_video_process_defaults_output_language(client: TestClient) -> None:
    payload = {"video_url": "https://youtu.be/abc123"}
    captured: dict[str, str] = {}

    class FakeService:
        def process_video(self, video_url: str, styles: list[str] | None, output_language: str):
            captured["output_language"] = output_language
            styles_processed = styles or ["Summary"]
            return _build_response(video_url, output_language, styles_processed)

    app.dependency_overrides[get_video_service] = lambda: FakeService()
    try:
        response = client.post(
            f"{settings.API_V1_STR}/video/process/",
            json=payload,
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert captured["output_language"] == "English"


def test_video_process_invalid_url(client: TestClient) -> None:
    payload = {
        "video_url": "https://example.com/not-youtube",
        "styles": ["Summary"],
        "output_language": "English",
    }
    response = client.post(
        f"{settings.API_V1_STR}/video/process/",
        json=payload,
    )
    assert response.status_code == 400
    content = response.json()
    assert content["status"] == "error"
    assert "Invalid YouTube URL" in content["error"]


def test_video_process_invalid_style(client: TestClient) -> None:
    payload = {
        "video_url": "https://www.youtube.com/watch?v=abc123",
        "styles": ["NotAStyle"],
        "output_language": "English",
    }
    response = client.post(
        f"{settings.API_V1_STR}/video/process/",
        json=payload,
    )
    assert response.status_code == 400
    content = response.json()
    assert content["status"] == "error"
    assert "Invalid styles" in content["error"]


def test_video_process_configuration_error(
    client: TestClient, monkeypatch
) -> None:
    monkeypatch.setattr(settings, "OPENAI_API_KEY", None)
    if hasattr(app.state, "getoutvideo_api"):
        delattr(app.state, "getoutvideo_api")

    payload = {
        "video_url": "https://www.youtube.com/watch?v=abc123",
        "styles": ["Summary"],
        "output_language": "English",
    }
    response = client.post(
        f"{settings.API_V1_STR}/video/process/",
        json=payload,
    )
    assert response.status_code == 500
    content = response.json()
    assert content["status"] == "error"
    assert "OPENAI_API_KEY" in content["error"]


def test_video_process_external_service_error(client: TestClient) -> None:
    payload = {
        "video_url": "https://www.youtube.com/watch?v=abc123",
        "styles": ["Summary"],
        "output_language": "English",
    }

    class FakeService:
        def process_video(self, *_args, **_kwargs):
            raise ExternalServiceError("External failure.")

    app.dependency_overrides[get_video_service] = lambda: FakeService()
    try:
        response = client.post(
            f"{settings.API_V1_STR}/video/process/",
            json=payload,
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 502
    content = response.json()
    assert content["status"] == "error"
    assert content["error"] == "External failure."


def test_video_process_timeout_error(client: TestClient) -> None:
    payload = {
        "video_url": "https://www.youtube.com/watch?v=abc123",
        "styles": ["Summary"],
        "output_language": "English",
    }

    class FakeService:
        def process_video(self, *_args, **_kwargs):
            raise ProcessingTimeoutError("Timed out.")

    app.dependency_overrides[get_video_service] = lambda: FakeService()
    try:
        response = client.post(
            f"{settings.API_V1_STR}/video/process/",
            json=payload,
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422
    content = response.json()
    assert content["status"] == "error"
    assert content["error"] == "Timed out."
