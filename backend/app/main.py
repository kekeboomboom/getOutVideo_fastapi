import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware

try:
    from getoutvideo import GetOutVideoAPI
except ImportError:  # pragma: no cover - dependency handled by project config
    GetOutVideoAPI = None  # type: ignore[assignment]

from app.api.main import api_router
from app.core.config import settings
from app.video_processor.exceptions import register_video_exception_handlers


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
)

register_video_exception_handlers(app)


@app.exception_handler(RequestValidationError)
async def video_request_validation_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    video_process_paths = {
        f"{settings.API_V1_STR}/video/process",
        f"{settings.API_V1_STR}/video/process/",
    }
    if request.url.path in video_process_paths:
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "error": _format_validation_error(exc),
                "code": 400,
            },
        )
    return await request_validation_exception_handler(request, exc)


@app.on_event("startup")
def init_getoutvideo_client() -> None:
    if settings.OPENAI_API_KEY and GetOutVideoAPI is not None:
        app.state.getoutvideo_api = GetOutVideoAPI(
            openai_api_key=settings.OPENAI_API_KEY
        )


def _format_validation_error(exc: RequestValidationError) -> str:
    errors = exc.errors()
    if not errors:
        return "Invalid request."
    parts = []
    for err in errors:
        loc = err.get("loc", [])
        if loc and loc[0] == "body":
            loc = loc[1:]
        field = ".".join(str(item) for item in loc if item is not None)
        msg = err.get("msg", "Invalid value")
        parts.append(f"{field}: {msg}" if field else msg)
    return "; ".join(parts)

# Set all CORS enabled origins
if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)
