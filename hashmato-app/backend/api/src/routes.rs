use axum::{
    routing::{get, post, put},
    Router,
};
use crate::{controllers, AppState};

pub fn routes() -> Router<AppState> {
    Router::new()
        // Root endpoint
        .route("/", get(controllers::root))
        
        // Menu endpoints
        .route("/menu", get(controllers::list_menu))
        .route("/menu", post(controllers::create_menu_item))
        .route("/menu/sync", get(controllers::sync_menu))
        
        // Order endpoints
        .route("/orders", get(controllers::list_orders))
        .route("/orders", post(controllers::create_order))
        .route("/orders/detailed", get(controllers::list_orders_detailed))
        .route("/orders/:id/status", put(controllers::update_order_status))
        .route("/orders/sync", get(controllers::sync_orders))
        
        // Queue endpoints
        .route("/queue", get(controllers::list_queue))
        .route("/queue/broadcast", post(controllers::broadcast_queue))
        
        // File upload
        .route("/upload", post(controllers::upload_image))
        
        // WebSocket for real-time updates
        .route("/ws", get(controllers::ws_handler))
        
        // Hardware integration stubs
        .route("/print/:order_id", post(controllers::print_receipt))
        .route("/drawer/open", post(controllers::open_drawer))
        
        // Auto-update endpoint
        .route("/version", get(controllers::latest_update))
}