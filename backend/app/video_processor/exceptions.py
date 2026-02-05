from fastapi import FastAPI
from fastapi.responses import JSONResponse


class VideoValidationError(Exception):
    pass


class ProcessingTimeoutError(Exception):
    pass


class ConfigurationError(Exception):
    pass


class ExternalServiceError(Exception):
    pass


def _error_response(message: str, code: int) -> JSONResponse:
    return JSONResponse(
        status_code=code,
        content={"status": "error", "error": message, "code": code},
    )


def register_video_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(VideoValidationError)
    async def _handle_video_validation_error(
        _request, exc: VideoValidationError
    ) -> JSONResponse:
        return _error_response(str(exc), 400)

    @app.exception_handler(ProcessingTimeoutError)
    async def _handle_processing_timeout(
        _request, exc: ProcessingTimeoutError
    ) -> JSONResponse:
        return _error_response(str(exc), 422)

    @app.exception_handler(ConfigurationError)
    async def _handle_configuration_error(
        _request, exc: ConfigurationError
    ) -> JSONResponse:
        return _error_response(str(exc), 500)

    @app.exception_handler(ExternalServiceError)
    async def _handle_external_service_error(
        _request, exc: ExternalServiceError
    ) -> JSONResponse:
        return _error_response(str(exc), 502)
