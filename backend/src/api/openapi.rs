use utoipa::OpenApi;

use crate::storage::models::{AnalysisEvent, CreateStreamRequest, Stream, UpdateStreamRequest};
use super::routes;

#[derive(OpenApi)]
#[openapi(
    info(
        title = "Cipher-Shield API",
        version = "0.1.0",
        description = "REST API for the Cipher-Shield video stream analysis platform. \
                        Manage streams, retrieve analysis events, and access live frames.",
        contact(name = "Cipher-Shield", email = "admin@cipher-shield.local"),
        license(name = "MIT")
    ),
    paths(
        routes::health,
        routes::list_streams,
        routes::get_stream,
        routes::create_stream,
        routes::update_stream,
        routes::delete_stream,
        routes::enable_stream,
        routes::disable_stream,
        routes::snapshot,
        routes::stream_live,
        routes::list_events,
        routes::get_event,
    ),
    components(
        schemas(
            Stream,
            CreateStreamRequest,
            UpdateStreamRequest,
            AnalysisEvent,
        )
    ),
    tags(
        (name = "health",  description = "Service health check"),
        (name = "streams", description = "Video stream management"),
        (name = "events",  description = "Analysis event retrieval"),
    )
)]
pub struct ApiDoc;
