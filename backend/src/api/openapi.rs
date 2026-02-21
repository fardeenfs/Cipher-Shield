use utoipa::OpenApi;

use crate::storage::models::{
    AnalysisEvent, BlueprintCamera, BlueprintResponse, BlueprintSummary,
    CreateBlueprintCameraRequest, CreateBlueprintRequest, CreateRuleRequest,
    CreateStreamRequest, Stream, StreamRule, UpdateBlueprintCameraRequest,
    UpdateBlueprintRequest, UpdateRuleRequest, UpdateStreamRequest,
};
use super::routes;

#[derive(OpenApi)]
#[openapi(
    info(
        title = "Cipher-Shield API",
        version = "0.1.0",
        description = "REST API for the Cipher-Shield video stream analysis platform. \
                        Manage streams, blueprints, cameras, and analysis events.",
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
        routes::list_rules,
        routes::create_rule,
        routes::update_rule,
        routes::delete_rule,
        routes::list_blueprints,
        routes::get_blueprint,
        routes::create_blueprint,
        routes::update_blueprint,
        routes::delete_blueprint,
        routes::list_blueprint_cameras,
        routes::create_blueprint_camera,
        routes::update_blueprint_camera,
        routes::delete_blueprint_camera,
    ),
    components(
        schemas(
            Stream,
            CreateStreamRequest,
            UpdateStreamRequest,
            AnalysisEvent,
            StreamRule,
            CreateRuleRequest,
            UpdateRuleRequest,
            BlueprintSummary,
            BlueprintResponse,
            CreateBlueprintRequest,
            UpdateBlueprintRequest,
            BlueprintCamera,
            CreateBlueprintCameraRequest,
            UpdateBlueprintCameraRequest,
        )
    ),
    tags(
        (name = "health",  description = "Service health check"),
        (name = "streams", description = "Video stream management"),
        (name = "events",  description = "Analysis event retrieval"),
        (name = "rules",   description = "Per-stream VLM threat assessment rules"),
        (name = "blueprints", description = "Blueprints (floor plan images) and placed cameras"),
    )
)]
pub struct ApiDoc;
