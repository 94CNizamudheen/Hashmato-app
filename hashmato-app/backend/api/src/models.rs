use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct MenuItem {
    pub id: i32,
    pub name: String,
    pub price: f64,
    pub available: bool,
    pub image_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Order {
    pub id: i32,
    pub source: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct OrderItem {
    pub id: i32,
    pub order_id: i32,
    pub menu_item_id: i32,
    pub quantity: i32,
}

#[derive(Debug, Deserialize)]
pub struct CreateOrderItem {
    pub menu_item_id: i32,
    pub quantity: i32,
}

#[derive(Debug, Deserialize)]
pub struct CreateOrder {
    pub source: String,
    pub items: Vec<CreateOrderItem>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct QueueToken {
    pub id: i32,
    pub order_id: i32,
    pub token_number: i32,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, serde::Deserialize)]
pub struct UpdateOrderStatus {
    pub status: String,
}

#[derive(Debug, Serialize)]
pub struct OrderDetailed {
    pub order: Order,
    pub items: Vec<OrderItemDetailed>,
}

#[derive(Debug, Serialize)]
pub struct OrderItemDetailed {
    pub id: i32,
    pub order_id: i32,
    pub menu_item_id: i32,
    pub quantity: i32,
    pub menu_name: String,
    pub menu_price: f64,
    pub menu_image: Option<String>,
}
