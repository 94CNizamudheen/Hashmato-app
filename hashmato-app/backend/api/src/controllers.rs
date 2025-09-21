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
use chrono::{Utc, DateTime};
use bigdecimal::BigDecimal;
use std::str::FromStr;
use crate::models::{
    MenuItem, Order, QueueToken, CreateOrder, OrderDetailed,
    OrderItemDetailed, UpdateOrderStatus,
};
use axum::extract::ws::{Message, WebSocket};
use crate::AppState;

const ALLOWED_STATUSES: &[&str] = &["pending", "preparing", "ready", "completed"];
const ALLOWED_EXTENSIONS: &[&str] = &["jpg", "jpeg", "png", "gif", "webp"];
const MAX_FILE_SIZE: usize = 5 * 1024 * 1024; // 5MB

pub async fn list_menu(State(state): State<AppState>) -> Result<Json<Vec<MenuItem>>, (StatusCode, String)> {
    let items = sqlx::query_as::<_, MenuItem>(
        "SELECT * FROM menu_items WHERE available = true ORDER BY id ASC"
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?;
    
    Ok(Json(items))
}

pub async fn create_menu_item(
    State(state): State<AppState>,
    Json(payload): Json<serde_json::Value>
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let name = payload.get("name")
        .and_then(|v| v.as_str())
        .filter(|s| !s.trim().is_empty())
        .ok_or((StatusCode::BAD_REQUEST, "Name is required and cannot be empty".to_string()))?;
    
    let price = payload.get("price")
        .and_then(|v| v.as_f64())
        .filter(|p| *p >= 0.0)
        .ok_or((StatusCode::BAD_REQUEST, "Valid price is required".to_string()))?;
    
    let price_decimal = BigDecimal::from_str(&price.to_string())
        .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid price format".to_string()))?;
    
    let image_url = payload.get("image_url").and_then(|v| v.as_str());

    let rec = sqlx::query(
        "INSERT INTO menu_items (name, price, available, image_url) VALUES ($1, $2, true, $3) RETURNING id"
    )
    .bind(name.trim())
    .bind(price_decimal)
    .bind(image_url)
    .fetch_one(&state.pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?;

    let id: i32 = rec.get("id");
    Ok(Json(json!({"id": id, "status": "created"})))
}

pub async fn upload_image(
    mut multipart: Multipart,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let upload_dir = std::env::var("UPLOAD_DIR").unwrap_or_else(|_| "./uploads".to_string());
    fs::create_dir_all(&upload_dir)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to create upload directory: {}", e)))?;

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| (StatusCode::BAD_REQUEST, format!("Multipart error: {}", e)))?
    {
        let name = field.name().unwrap_or("file").to_string();
        let file_name = field.file_name()
            .map(|s| s.to_string())
            .unwrap_or_else(|| format!("upload-{}", Uuid::new_v4()));
        let data = field.bytes()
            .await
            .map_err(|e| (StatusCode::BAD_REQUEST, format!("Failed to read file data: {}", e)))?;
        if data.len() > MAX_FILE_SIZE {
            return Err((StatusCode::PAYLOAD_TOO_LARGE, "File size exceeds 5MB limit".to_string()));
        }

        let ext = std::path::Path::new(&file_name)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("bin")
            .to_lowercase();
        
        if !ALLOWED_EXTENSIONS.contains(&ext.as_str()) {
            return Err((StatusCode::BAD_REQUEST, "Invalid file type. Only images are allowed".to_string()));
        }

        let out_name = format!("{}-{}.{}", name, Uuid::new_v4(), ext);
        let out_path = std::path::Path::new(&upload_dir).join(&out_name);
        
        tokio::fs::write(&out_path, &data)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to save file: {}", e)))?;

        let url = format!("/uploads/{}", out_name);
        return Ok(Json(json!({"url": url})));
    }

    Err((StatusCode::BAD_REQUEST, "No file field found".to_string()))
}

pub async fn create_order(
    State(state): State<AppState>,
    Json(payload): Json<CreateOrder>
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    if payload.items.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "Order must contain at least one item".to_string()));
    }

    let mut tx = state.pool.begin()
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Transaction error: {}", e)))?;

    let rec = sqlx::query("INSERT INTO orders (source, status) VALUES ($1, 'pending') RETURNING id")
        .bind(&payload.source)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to create order: {}", e)))?;

    let order_id: i32 = rec.get("id");

    for item in payload.items.iter() {
        if item.quantity <= 0 {
            return Err((StatusCode::BAD_REQUEST, "Item quantity must be greater than 0".to_string()));
        }
        
        sqlx::query("INSERT INTO order_items (order_id, menu_item_id, quantity) VALUES ($1, $2, $3)")
            .bind(order_id)
            .bind(item.menu_item_id)
            .bind(item.quantity)
            .execute(&mut *tx)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to add order item: {}", e)))?;
    }

    sqlx::query("INSERT INTO queue_tokens (order_id, token_number, status) VALUES ($1, $2, 'waiting')")
        .bind(order_id)
        .bind(order_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to create queue token: {}", e)))?;

    tx.commit()
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Transaction commit failed: {}", e)))?;

    // Broadcast queue update
    tokio::spawn({
        let state = state.clone();
        async move { broadcast_queue_inner(&state).await; }
    });

    Ok(Json(json!({ "order_id": order_id, "status": "created" })))
}

pub async fn list_orders(State(state): State<AppState>) -> Result<Json<Vec<Order>>, (StatusCode, String)> {
    let orders = sqlx::query_as::<_, Order>("SELECT * FROM orders ORDER BY created_at DESC")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?;
    
    Ok(Json(orders))
}

pub async fn list_orders_detailed(State(state): State<AppState>) -> Result<Json<Vec<OrderDetailed>>, (StatusCode, String)> {
    let orders = sqlx::query_as::<_, Order>("SELECT * FROM orders ORDER BY created_at DESC")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?;

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
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?;

        let items_detailed: Vec<OrderItemDetailed> = items.into_iter().map(|r| {
            OrderItemDetailed {
                id: r.id,
                order_id: r.order_id,
                menu_item_id: r.menu_item_id,
                quantity: r.quantity,
                menu_name: r.menu_name,
                menu_price: r.menu_price, // Now this is already Decimal from the database
                menu_image: r.menu_image,
            }
        }).collect();

        result.push(OrderDetailed { order, items: items_detailed });
    }

    Ok(Json(result))
}

pub async fn list_queue(State(state): State<AppState>) -> Result<Json<Vec<QueueToken>>, (StatusCode, String)> {
    let q = sqlx::query_as::<_, QueueToken>("SELECT * FROM queue_tokens ORDER BY id ASC")
        .fetch_all(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?;
    
    Ok(Json(q))
}

pub async fn broadcast_queue(State(state): State<AppState>) -> Json<serde_json::Value> {
    broadcast_queue_inner(&state).await;
    Json(json!({"status": "queue broadcast sent"}))
}

async fn broadcast_queue_inner(state: &AppState) {
    if let Ok(queue) = sqlx::query_as::<_, QueueToken>("SELECT * FROM queue_tokens ORDER BY id ASC")
        .fetch_all(&state.pool)
        .await
    {
        if let Ok(msg) = serde_json::to_string(&queue) {
            let _ = state.bcast.send(msg);
        }
    }
}

pub async fn update_order_status(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    Json(payload): Json<UpdateOrderStatus>
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let new_status = payload.status.trim().to_lowercase();

    if !ALLOWED_STATUSES.contains(&new_status.as_str()) {
        return Err((StatusCode::BAD_REQUEST, format!("Invalid status. Allowed: {}", ALLOWED_STATUSES.join(", "))));
    }

    let result = sqlx::query("UPDATE orders SET status = $1, updated_at = now() WHERE id = $2")
        .bind(&new_status)
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Order not found".to_string()));
    }

    match new_status.as_str() {
        "ready" => {
            sqlx::query("UPDATE queue_tokens SET status = 'ready' WHERE order_id = $1")
                .bind(id)
                .execute(&state.pool)
                .await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Queue update error: {}", e)))?;
        }
        "completed" => {
            sqlx::query("DELETE FROM queue_tokens WHERE order_id = $1")
                .bind(id)
                .execute(&state.pool)
                .await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Queue cleanup error: {}", e)))?;
        }
        _ => {}
    }

    tokio::spawn({
        let state = state.clone();
        async move { broadcast_queue_inner(&state).await; }
    });

    Ok(Json(json!({ "order_id": id, "new_status": new_status })))
}

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
                    Some(Ok(Message::Ping(data))) => {
                        let _ = socket.send(Message::Pong(data)).await;
                    }
                    Some(Ok(Message::Close(_))) | None => {
                        let _ = socket.close().await;
                        break;
                    }
                    Some(Err(e)) => {
                        eprintln!("WebSocket error: {}", e);
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

#[derive(serde::Deserialize)]
pub struct SinceQuery {
    pub since: Option<String>,
}

pub async fn sync_menu(
    State(state): State<AppState>,
    Query(q): Query<SinceQuery>
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let menu_items = if let Some(since) = q.since {
        if let Ok(parsed) = DateTime::parse_from_rfc3339(&since) {
            let dt_utc = parsed.with_timezone(&Utc);
            sqlx::query_as::<_, MenuItem>(
                "SELECT * FROM menu_items WHERE updated_at > $1 ORDER BY id ASC"
            )
            .bind(dt_utc)
            .fetch_all(&state.pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?
        } else {
            return Err((StatusCode::BAD_REQUEST, "Invalid date format. Use RFC3339".to_string()));
        }
    } else {
        sqlx::query_as::<_, MenuItem>("SELECT * FROM menu_items ORDER BY id ASC")
            .fetch_all(&state.pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?
    };

    Ok(Json(json!({ "menu": menu_items })))
}

pub async fn sync_orders(
    State(state): State<AppState>,
    Query(q): Query<SinceQuery>
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    let orders = if let Some(since) = q.since {
        if let Ok(parsed) = DateTime::parse_from_rfc3339(&since) {
            let dt_utc = parsed.with_timezone(&Utc);
            sqlx::query_as::<_, Order>(
                "SELECT * FROM orders WHERE updated_at > $1 ORDER BY updated_at DESC"
            )
            .bind(dt_utc)
            .fetch_all(&state.pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?
        } else {
            return Err((StatusCode::BAD_REQUEST, "Invalid date format. Use RFC3339".to_string()));
        }
    } else {
        sqlx::query_as::<_, Order>("SELECT * FROM orders ORDER BY updated_at DESC")
            .fetch_all(&state.pool)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?
    };
    
    Ok(Json(json!({ "orders": orders })))
}

pub async fn print_receipt(Path(order_id): Path<i32>) -> Json<serde_json::Value> {
    Json(json!({"order_id": order_id, "status": "print job queued"}))
}
pub async fn open_drawer() -> Json<serde_json::Value> {
    Json(json!({"status": "ok", "note": "client should trigger cash drawer"}))
}

pub async fn latest_update() -> Json<serde_json::Value> {
    let version = std::env::var("APP_VERSION").unwrap_or_else(|_| "0.1.0".to_string());
    let url = std::env::var("UPDATE_URL").unwrap_or_else(|_| "".to_string());
    Json(json!({ "version": version, "url": url }))
}

pub async fn root() -> &'static str {
    "Hashmato API"
}

pub async fn get_order_detailed(
    State(state): State<AppState>,
    Path(order_id): Path<i32>
) -> Result<Json<OrderDetailed>, (StatusCode, String)> {
    let order = sqlx::query_as::<_, Order>("SELECT * FROM orders WHERE id = $1")
        .bind(order_id)
        .fetch_one(&state.pool)
        .await
        .map_err(|_| (StatusCode::NOT_FOUND, "Order not found".to_string()))?;

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
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Database error: {}", e)))?;

    let items_detailed: Vec<OrderItemDetailed> = items.into_iter().map(|r| {
        OrderItemDetailed {
            id: r.id,
            order_id: r.order_id,
            menu_item_id: r.menu_item_id,
            quantity: r.quantity,
            menu_name: r.menu_name,
            menu_price: r.menu_price,
            menu_image: r.menu_image,
        }
    }).collect();

    Ok(Json(OrderDetailed { order, items: items_detailed }))
}
