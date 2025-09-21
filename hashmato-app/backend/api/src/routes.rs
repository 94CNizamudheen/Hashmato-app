use axum::{
    routing::{get, post, put},
    Router,
};
use crate::{controllers, AppState};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(controllers::root))
     
        .route("/menu", get(controllers::list_menu))
        .route("/menu", post(controllers::create_menu_item))
        .route("/menu/sync", get(controllers::sync_menu))
        
        .route("/orders", get(controllers::list_orders))
        .route("/orders", post(controllers::create_order))
        .route("/orders/detailed", get(controllers::list_orders_detailed))
        .route("/orders/:id/detailed", get(controllers::get_order_detailed))
        .route("/orders/:id/status", put(controllers::update_order_status))
        .route("/orders/sync", get(controllers::sync_orders))

        .route("/queue", get(controllers::list_queue))
        .route("/queue/broadcast", post(controllers::broadcast_queue))

        .route("/upload", post(controllers::upload_image))

        .route("/ws", get(controllers::ws_handler))
  
        .route("/print/:order_id", post(controllers::print_receipt))
        .route("/drawer/open", post(controllers::open_drawer))
  
        .route("/version", get(controllers::latest_update))
}