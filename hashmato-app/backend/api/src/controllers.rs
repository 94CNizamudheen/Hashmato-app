use axum::{
    extract::{State, Path, Multipart, WebSocketUpgrade, Query},
    response::IntoResponse,
    Json,
    http::StatusCode,
};
use serde_json::json;
use sqlx::Row;
use std::{fs, sync::Arc};
use uuid::Uuid;
use crate::models::{
    MenuItem, Order, QueueToken, CreateOrder, OrderDetailed,
    OrderItemDetailed, UpdateOrderStatus,
};
use axum::extract::ws::{Message, WebSocket};
use chrono::{Utc, DateTime};
use crate::AppState;

const ALLOWED_STATUSES: &[&str] = &["pending", "preparing", "ready", "completed"];

/// List available menu items
pub async fn list_menu(State(state): State<AppState>) -> Json<Vec<MenuItem>> {
    let items = sqlx::query_as::<_, MenuItem>(
        "SELECT * FROM menu_items WHERE available = true ORDER BY id ASC"
    )
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();
    Json(items)
}

/// Create menu item
pub async fn create_menu_item(
    State(state): State<AppState>,
    Json(payload): Json<serde_json::Value>
) -> Json<serde_json::Value> {
    let name = payload.get("name").and_then(|v| v.as_str()).unwrap_or_default();
    let price = payload.get("price").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let image_url = payload.get("image_url").and_then(|v| v.as_str());

    let rec = sqlx::query(
        "INSERT INTO menu_items (name, price, available, image_url) VALUES ($1, $2, true, $3) RETURNING id"
    )
        .bind(name)
        .bind(price as f64)
        .bind(image_url)
        .fetch_one(&state.pool)
        .await;

    match rec {
        Ok(r) => {
            let id: i32 = r.get("id");
            Json(json!({"id": id, "status": "created"}))
        }
        Err(e) => Json(json!({"error": format!("{}", e)})),
    }
}

/// Upload image (multipart)
pub async fn upload_image(
    mut multipart: Multipart,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let upload_dir = std::env::var("UPLOAD_DIR").unwrap_or_else(|_| "./uploads".to_string());
    fs::create_dir_all(&upload_dir)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("create upload dir: {}", e)))?;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| (StatusCode::BAD_REQUEST, format!("multipart: {}", e)))?
    {
        let name = field.name().unwrap_or("file").to_string();
        let file_name = field.file_name().map(|s| s.to_string())
            .unwrap_or_else(|| format!("upload-{}", Uuid::new_v4()));
        let data = field.bytes()
            .await
            .map_err(|e| (StatusCode::BAD_REQUEST, format!("read bytes: {}", e)))?;

        let ext = std::path::Path::new(&file_name)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("bin");
        let out_name = format!("{}-{}.{}", name, Uuid::new_v4(), ext);
        let out_path = std::path::Path::new(&upload_dir).join(&out_name);
        tokio::fs::write(&out_path, &data)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("write: {}", e)))?;

        let url = format!("/uploads/{}", out_name);
        return Ok(Json(json!({"url": url})));
    }

    Err((StatusCode::BAD_REQUEST, "no file field".to_string()))
}

/// Create an order
pub async fn create_order(
    State(state): State<AppState>,
    Json(payload): Json<CreateOrder>
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let mut tx = state.pool.begin().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let rec = sqlx::query("INSERT INTO orders (source, status) VALUES ($1, 'pending') RETURNING id")
        .bind(&payload.source)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let order_id: i32 = rec.get("id");

    for item in payload.items.iter() {
        sqlx::query("INSERT INTO order_items (order_id, menu_item_id, quantity) VALUES ($1, $2, $3)")
            .bind(order_id)
            .bind(item.menu_item_id)
            .bind(item.quantity)
            .execute(&mut *tx)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    sqlx::query("INSERT INTO queue_tokens (order_id, token_number, status) VALUES ($1, $2, 'waiting')")
        .bind(order_id)
        .bind(order_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    tx.commit().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    broadcast_queue_inner(&state).await;

    Ok(Json(json!({ "order_id": order_id, "status": "created" })))
}

/// List orders
pub async fn list_orders(State(state): State<AppState>) -> Json<Vec<Order>> {
    let orders = sqlx::query_as::<_, Order>("SELECT * FROM orders ORDER BY created_at DESC")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();
    Json(orders)
}

/// List detailed orders
pub async fn list_orders_detailed(State(state): State<AppState>) -> Json<Vec<OrderDetailed>> {
    let orders = sqlx::query_as::<_, Order>("SELECT * FROM orders ORDER BY created_at DESC")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    let mut result = Vec::new();
    for order in orders.into_iter() {
        let items = sqlx::query!(
            r#"
            SELECT oi.id, oi.order_id, oi.menu_item_id, oi.quantity,
                   mi.name as menu_name, mi.price as "menu_price!", mi.image_url as menu_image
            FROM order_items oi
            JOIN menu_items mi ON mi.id = oi.menu_item_id
            WHERE oi.order_id = $1
            "#,
            order.id
        )
            .fetch_all(&state.pool)
            .await
            .unwrap_or_default();

        let items_detailed: Vec<OrderItemDetailed> = items.into_iter().map(|r| {
            OrderItemDetailed {
                id: r.id,
                order_id: r.order_id,
                menu_item_id: r.menu_item_id,
                quantity: r.quantity,
                menu_name: r.menu_name,
                menu_price: r.menu_price.to_string().parse::<f64>().unwrap_or(0.0),
                menu_image: r.menu_image,
            }
        }).collect();

        result.push(OrderDetailed { order, items: items_detailed });
    }

    Json(result)
}

/// List queue tokens
pub async fn list_queue(State(state): State<AppState>) -> Json<Vec<QueueToken>> {
    let q = sqlx::query_as::<_, QueueToken>("SELECT * FROM queue_tokens ORDER BY id ASC")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();
    Json(q)
}

/// Broadcast queue manually
pub async fn broadcast_queue(State(state): State<AppState>) {
    broadcast_queue_inner(&state).await;
}

async fn broadcast_queue_inner(state: &AppState) {
    let queue = sqlx::query_as::<_, QueueToken>("SELECT * FROM queue_tokens ORDER BY id ASC")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();

    if let Ok(msg) = serde_json::to_string(&queue) {
        let _ = state.bcast.send(msg);
    }
}

/// Update order status
pub async fn update_order_status(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateOrderStatus>
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let new_status = payload.status.to_lowercase();

    if !ALLOWED_STATUSES.contains(&new_status.as_str()) {
        return Ok(Json(json!({ "error": "Invalid status" })));
    }

    sqlx::query("UPDATE orders SET status = $1, updated_at = now() WHERE id = $2")
        .bind(&new_status)
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if new_status == "ready" {
        sqlx::query("UPDATE queue_tokens SET status = 'ready' WHERE order_id = $1")
            .bind(id)
            .execute(&state.pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    } else if new_status == "completed" {
        sqlx::query("DELETE FROM queue_tokens WHERE order_id = $1")
            .bind(id)
            .execute(&state.pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    broadcast_queue_inner(&state).await;

    Ok(Json(json!({ "order_id": id, "new_status": new_status })))
}

/// WebSocket handler
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>
) -> impl IntoResponse {
    let bcast = state.bcast.clone();
    ws.on_upgrade(move |socket| handle_socket(socket, bcast))
}

async fn handle_socket(mut socket: WebSocket, bcast: Arc<tokio::sync::broadcast::Sender<String>>) {
    let mut rx = bcast.subscribe();

    loop {
        tokio::select! {
            msg = socket.recv() => {
                match msg {
                    Some(Ok(Message::Text(t))) => {
                        let _ = socket.send(Message::Text(format!("echo: {}", t))).await;
                    }
                    Some(Ok(Message::Ping(_))) => {
                        let _ = socket.send(Message::Pong(vec![])).await;
                    }
                    Some(Ok(Message::Close(_))) | None => {
                        let _ = socket.close().await;
                        break;
                    }
                    _ => {}
                }
            }
            res = rx.recv() => {
                match res {
                    Ok(text) => {
                        if socket.send(Message::Text(text)).await.is_err() {
                            let _ = socket.close().await;
                            break;
                        }
                    }
                    Err(_) => break,
                }
            }
        }
    }
}

/// Sync menu
#[derive(serde::Deserialize)]
pub struct SinceQuery {
    pub since: Option<String>,
}

pub async fn sync_menu(
    State(state): State<AppState>,
    Query(q): Query<SinceQuery>
) -> Json<serde_json::Value> {
    let rows = if let Some(since) = q.since {
        let parsed = DateTime::parse_from_rfc3339(&since).ok();
        if let Some(dt) = parsed {
            let dt_utc = dt.with_timezone(&Utc);
            let res = sqlx::query_as::<_, MenuItem>(
                "SELECT * FROM menu_items WHERE updated_at > $1 ORDER BY id ASC"
            )
                .bind(dt_utc)
                .fetch_all(&state.pool)
                .await
                .unwrap_or_default();
            serde_json::to_value(res).unwrap_or(json!([]))
        } else {
            let res = sqlx::query_as::<_, MenuItem>("SELECT * FROM menu_items ORDER BY id ASC")
                .fetch_all(&state.pool)
                .await
                .unwrap_or_default();
            serde_json::to_value(res).unwrap_or(json!([]))
        }
    } else {
        let res = sqlx::query_as::<_, MenuItem>("SELECT * FROM menu_items ORDER BY id ASC")
            .fetch_all(&state.pool)
            .await
            .unwrap_or_default();
        serde_json::to_value(res).unwrap_or(json!([]))
    };

    Json(json!({ "menu": rows }))
}

/// Sync orders
pub async fn sync_orders(
    State(state): State<AppState>,
    Query(q): Query<SinceQuery>
) -> Json<serde_json::Value> {
    if let Some(since) = q.since {
        if let Ok(parsed) = DateTime::parse_from_rfc3339(&since) {
            let dt_utc = parsed.with_timezone(&Utc);
            let orders = sqlx::query_as::<_, Order>(
                "SELECT * FROM orders WHERE updated_at > $1 ORDER BY updated_at DESC"
            )
                .bind(dt_utc)
                .fetch_all(&state.pool)
                .await
                .unwrap_or_default();
            return Json(json!({ "orders": orders }));
        }
    }
    let orders = sqlx::query_as::<_, Order>("SELECT * FROM orders ORDER BY updated_at DESC")
        .fetch_all(&state.pool)
        .await
        .unwrap_or_default();
    Json(json!({ "orders": orders }))
}

/// Printer stub
pub async fn print_receipt(Path(order_id): Path<i32>) -> Json<serde_json::Value> {
    Json(json!({"order_id": order_id, "status": "print job queued"}))
}

/// Drawer stub
pub async fn open_drawer() -> Json<serde_json::Value> {
    Json(json!({"status": "ok", "note": "client should trigger cash drawer"}))
}

/// Auto-update feed
pub async fn latest_update() -> Json<serde_json::Value> {
    let version = std::env::var("APP_VERSION").unwrap_or_else(|_| "0.1.0".to_string());
    let url = std::env::var("UPDATE_URL").unwrap_or_else(|_| "".to_string());
    Json(json!({ "version": version, "url": url }))
}

/// Root
pub async fn root() -> &'static str {
    "Hashmato API"
}
