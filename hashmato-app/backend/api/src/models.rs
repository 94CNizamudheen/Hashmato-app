use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct MenuItem {
    pub id: i32,
    pub name: String,
    pub price: f64,
    pub available: bool,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Order {
    pub id: i32,
    pub source: String,
    pub status: String,
    pub created_at: chrono::NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct OrderItem {
    pub id: i32,
    pub order_id: i32,
    pub menu_item_id: i32,
    pub quantity: i32,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct QueueToken {
    pub id: i32,
    pub order_id: i32,
    pub token_number: i32,
    pub status: String,
}
