from types import SimpleNamespace

from app.video_processor.service import (
    VideoProcessingService,
    _choose_language_priority,
    _extract_video_id,
)
from app.video_processor.exceptions import VideoValidationError


def test_extract_video_id_supports_youtube_variants() -> None:
    assert _extract_video_id("https://www.youtube.com/watch?v=abc123") == "abc123"
    assert _extract_video_id("https://youtu.be/abc123?t=5") == "abc123"
    assert _extract_video_id("https://www.youtube.com/embed/abc123") == "abc123"
    assert _extract_video_id("https://www.youtube.com/v/abc123?foo=bar") == "abc123"


def test_extract_video_id_rejects_non_youtube_url() -> None:
    assert _extract_video_id("https://example.com/watch?v=abc123") is None


def test_choose_language_priority_prefers_chinese_then_english() -> None:
    assert _choose_language_priority(["en", "zh-Hans", "ja"]) == [
        "zh-Hans",
        "en",
        "ja",
    ]
    assert _choose_language_priority(["fr", "en-US", "de"]) == [
        "en-US",
        "fr",
        "de",
    ]
    assert _choose_language_priority(["fr", "de"]) == ["fr", "de"]
    assert _choose_language_priority([]) is None


def test_configure_transcript_language_preferences_sets_priority(monkeypatch) -> None:
    service = VideoProcessingService()
    transcript_config = SimpleNamespace(transcript_languages=None)
    api = SimpleNamespace(config=SimpleNamespace(transcript_config=transcript_config))

    monkeypatch.setattr(
        "app.video_processor.service._fetch_available_transcript_languages",
        lambda _video_id: ["en", "zh", "ja"],
    )

    service._configure_transcript_language_preferences(
        api, "https://www.youtube.com/watch?v=abc123"
    )

    assert transcript_config.transcript_languages == ["zh", "en", "ja"]


def test_process_video_returns_400_when_no_subtitles(monkeypatch) -> None:
    transcript_config = SimpleNamespace(transcript_languages=None)
    fake_api = SimpleNamespace(config=SimpleNamespace(transcript_config=transcript_config))
    service = VideoProcessingService(api_client=fake_api)

    monkeypatch.setattr(
        "app.video_processor.service._fetch_available_transcript_languages",
        lambda _video_id: [],
    )
    monkeypatch.setattr(
        "app.video_processor.service._ensure_youtube_transcript_api_compat",
        lambda: None,
    )

    try:
        service.process_video(
            video_url="https://www.youtube.com/watch?v=abc123",
            styles=["Summary"],
            output_language="Chinese",
        )
    except VideoValidationError as exc:
        assert str(exc) == "No subtitles found for this video."
    else:  # pragma: no cover - defensive
        raise AssertionError("Expected VideoValidationError when no subtitles exist.")
