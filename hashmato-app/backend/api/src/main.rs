mod db;
mod models;
mod routes;
mod controllers;

use axum::{routing::get, Router};
use dotenvy::dotenv;
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tower_http::cors::{CorsLayer, Any};

#[tokio::main]
async fn main() {
    dotenv().ok();

    let pool = db::connect().await;

    sqlx::migrate!()
        .run(&pool)
        .await
        .expect(" Migration failed");

    seed_menu(&pool).await;

    let cors = CorsLayer::new()
        .allow_origin(Any) 
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/", get(|| async { "Hashmato API " }))
        .merge(routes::routes(pool.clone()))
        .layer(cors); 

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    println!(" Server running at http://{}", addr);

    let listener = TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn seed_menu(pool: &sqlx::Pool<sqlx::Postgres>) {
    let items = vec![
        ("Cheeseburger", 5.99),
        ("French Fries", 2.99),
        ("Coke", 1.49),
        ("Chicken Nuggets", 3.99),
        ("Ice Cream", 2.49),
        ("Veggie Pizza", 7.49),
        ("Grilled Sandwich", 4.25),
        ("Latte Coffee", 3.75),
        ("Caesar Salad", 6.50),
        ("Chocolate Cake", 3.95),
    ];
    for (name, price) in items {
        let _ = sqlx::query(
            "INSERT INTO menu_items (name, price, available) 
             VALUES ($1, $2, true)
             ON CONFLICT (name) DO NOTHING"
        )
        .bind(name)
        .bind(price)
        .execute(pool)
        .await;
    }

    println!("10 Sample menu items seeded");
}

