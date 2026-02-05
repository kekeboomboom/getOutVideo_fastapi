from fastapi import APIRouter, Depends, Request

from app.video_processor.schemas import ErrorResponse, VideoProcessRequest, VideoProcessResponse
from app.video_processor.service import VideoProcessingService


router = APIRouter(prefix="/video", tags=["video"])


def get_video_service(request: Request) -> VideoProcessingService:
    api_client = getattr(request.app.state, "getoutvideo_api", None)
    return VideoProcessingService(api_client=api_client)


@router.post(
    "/process/",
    response_model=VideoProcessResponse,
    response_model_exclude_none=True,
    responses={
        400: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
        502: {"model": ErrorResponse},
    },
)
def process_video(
    payload: VideoProcessRequest,
    service: VideoProcessingService = Depends(get_video_service),
) -> VideoProcessResponse:
    data = service.process_video(
        video_url=payload.video_url,
        styles=payload.styles,
        output_language=payload.output_language,
    )
    return VideoProcessResponse(data=data)
