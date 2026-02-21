use axum::{
    extract::{
        ws::{Message, WebSocket},
        State, WebSocketUpgrade,
    },
    response::IntoResponse,
};
use std::sync::Arc;
use tracing::{error, info};

use crate::state::AppState;

/// WebSocket upgrade handler. Clients connect to `GET /ws/events` and receive
/// a stream of JSON-encoded `AnalysisEvent` objects as they arrive.
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(mut socket: WebSocket, state: Arc<AppState>) {
    info!("WebSocket client connected");

    let mut rx = state.event_tx.subscribe();

    loop {
        tokio::select! {
            // New analysis event from the broadcast channel
            result = rx.recv() => {
                match result {
                    Ok(event) => {
                        match serde_json::to_string(&event) {
                            Ok(json) => {
                                if socket.send(Message::Text(json.into())).await.is_err() {
                                    // Client disconnected
                                    break;
                                }
                            }
                            Err(e) => error!("Failed to serialize event: {e}"),
                        }
                    }
                    Err(tokio::sync::broadcast::error::RecvError::Lagged(n)) => {
                        // We missed some events; notify the client and continue.
                        let msg = serde_json::json!({
                            "type": "lag_warning",
                            "missed": n
                        });
                        let _ = socket.send(Message::Text(msg.to_string().into())).await;
                    }
                    Err(tokio::sync::broadcast::error::RecvError::Closed) => break,
                }
            }

            // Ping / close frames from the client
            msg = socket.recv() => {
                match msg {
                    Some(Ok(Message::Close(_))) | None => break,
                    Some(Ok(Message::Ping(data))) => {
                        let _ = socket.send(Message::Pong(data)).await;
                    }
                    _ => {}
                }
            }
        }
    }

    info!("WebSocket client disconnected");
}
