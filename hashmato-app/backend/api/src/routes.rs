use axum::{Router, routing::{get, post, put}};
use sqlx::PgPool;
use crate::controllers::*;

pub fn routes(pool: PgPool) -> Router {
    Router::new()
    
        .route("/menu", get(list_menu))
        .route("/orders", get(list_orders).post(create_order))
        
        .route("/kds/orders", get(list_orders))
       
        .route("/queue", get(list_queue))
        .route("/queue/:id", put(update_queue))
        .with_state(pool)
}
