from typing import Literal

from pydantic import BaseModel, Field

ALLOWED_STYLES = [
    "Summary",
    "Educational",
    "Balanced",
    "QA Generation",
    "Narrative",
]

REQUEST_TO_API_STYLE = {
    "Summary": "Summary",
    "Educational": "Educational",
    "Balanced": "Balanced and Detailed",
    "QA Generation": "Q&A Generation",
    "Narrative": "Narrative Rewriting",
}

API_STYLE_TO_RESULT_KEY = {
    "Summary": "summary",
    "Educational": "educational",
    "Balanced and Detailed": "balanced",
    "Q&A Generation": "qa_generation",
    "Narrative Rewriting": "narrative",
}


class VideoProcessRequest(BaseModel):
    video_url: str
    styles: list[str] | None = None
    output_language: str = Field(default="English")


class VideoProcessResults(BaseModel):
    summary: str | None = None
    educational: str | None = None
    balanced: str | None = None
    qa_generation: str | None = None
    narrative: str | None = None


class VideoProcessMetadata(BaseModel):
    processing_time: float
    language: str
    styles_processed: list[str]


class VideoProcessData(BaseModel):
    video_url: str
    video_title: str
    processed_at: str
    results: VideoProcessResults
    metadata: VideoProcessMetadata


class VideoProcessResponse(BaseModel):
    status: Literal["success"] = "success"
    data: VideoProcessData


class ErrorResponse(BaseModel):
    status: Literal["error"] = "error"
    error: str
    code: int
