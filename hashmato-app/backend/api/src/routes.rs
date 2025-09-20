use axum::{Router, routing::{get, post, put}};
use crate::controllers::*;
use crate::AppState;

/// Defines all API routes
pub fn routes() -> Router<AppState> {
    Router::new()
        // Root
        .route("/", get(root))

        // Menu
        .route("/menu", get(list_menu).post(create_menu_item))
        .route("/menu/upload", post(upload_image))

        // Orders
        .route("/orders", get(list_orders).post(create_order))
        .route("/orders/detailed", get(list_orders_detailed))
        .route("/orders/:id/status", put(update_order_status))

        // Queue
        .route("/queue", get(list_queue))
        .route("/broadcast_queue", post(broadcast_queue))

        // WebSocket for real-time queue updates
        .route("/ws", get(ws_handler))

        // Sync endpoints (for offline-first clients)
        .route("/sync/menu", get(sync_menu))
        .route("/sync/orders", get(sync_orders))

        // Hardware stubs
        .route("/print/:order_id", post(print_receipt))
        .route("/drawer/open", post(open_drawer))

        // Auto-update feed
        .route("/updates/latest.json", get(latest_update))
}
