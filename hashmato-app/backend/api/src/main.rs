mod db;
mod models;
mod routes;
mod controllers;

use axum::{routing::get, Router};
use dotenvy::dotenv;
use std::net::SocketAddr;
use tokio::net::TcpListener;

#[tokio::main]
async fn main() {
    dotenv().ok();

    let pool = db::connect().await;

    let app = Router::new()
        .route("/", get(|| async { "Hashmato API " }))
        .merge(routes::routes(pool.clone()));

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    println!("Server running at http://{}", addr);

    let listener = TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
