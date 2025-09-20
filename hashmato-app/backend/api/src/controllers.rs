use axum::{extract::{State, Path}, Json};
use serde_json::json;
use sqlx::PgPool;
use crate::models::{MenuItem, Order, QueueToken};

// -------- MENU ----------
pub async fn list_menu(State(pool): State<PgPool>) -> Json<Vec<MenuItem>> {
    let items = sqlx::query_as::<_, MenuItem>("SELECT * FROM menu_items WHERE available = true")
        .fetch_all(&pool)
        .await
        .unwrap_or_default();
    Json(items)
}

// -------- ORDERS ----------
pub async fn create_order(State(pool): State<PgPool>) -> Json<serde_json::Value> {
    let rec = sqlx::query("INSERT INTO orders (source, status) VALUES ($1, $2) RETURNING id")
        .bind("POS")
        .bind("pending")
        .fetch_one(&pool)
        .await
        .unwrap();
    Json(json!({ "order_id": rec.get::<i32, _>("id") }))
}

pub async fn list_orders(State(pool): State<PgPool>) -> Json<Vec<Order>> {
    let orders = sqlx::query_as::<_, Order>("SELECT * FROM orders ORDER BY created_at DESC")
        .fetch_all(&pool)
        .await
        .unwrap_or_default();
    Json(orders)
}

// -------- QUEUE ----------
pub async fn list_queue(State(pool): State<PgPool>) -> Json<Vec<QueueToken>> {
    let queue = sqlx::query_as::<_, QueueToken>("SELECT * FROM queue_tokens WHERE status = 'waiting'")
        .fetch_all(&pool)
        .await
        .unwrap_or_default();
    Json(queue)
}

pub async fn update_queue(
    State(pool): State<PgPool>,
    Path(id): Path<i32>
) -> Json<serde_json::Value> {
    sqlx::query("UPDATE queue_tokens SET status = 'called' WHERE id = $1")
        .bind(id)
        .execute(&pool)
        .await
        .unwrap();
    Json(json!({ "status": "called" }))
}
