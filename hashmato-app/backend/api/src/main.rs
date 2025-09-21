mod db;
mod models;
mod controllers;
mod routes;

use axum::Router;
use dotenvy::dotenv;
use std::net::SocketAddr;
use tower_http::cors::{CorsLayer, Any};
use tower_http::services::ServeDir;
use std::sync::Arc;
use tokio::net::TcpListener;
use tokio::sync::broadcast;
use sqlx::PgPool;

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub bcast: Arc<broadcast::Sender<String>>,
}

#[tokio::main]
async fn main() {
    dotenv().ok();
    tracing_subscriber::fmt::init();

    let pool = db::connect().await;

    sqlx::migrate!()
        .run(&pool)
        .await
        .expect("Failed to run migrations");
    let (bcast_tx, _rx) = broadcast::channel::<String>(128);
    let bcast = Arc::new(bcast_tx);
    let state = AppState { pool, bcast };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);
    let upload_dir = std::env::var("UPLOAD_DIR")
        .unwrap_or_else(|_| "./uploads".to_string());
    let serve_uploads = ServeDir::new(&upload_dir);

    std::fs::create_dir_all(&upload_dir)
        .expect("Failed to create upload directory");

    let app = Router::new()
        .nest_service("/uploads", serve_uploads)
        .merge(routes::routes())
        .layer(cors)
        .with_state(state);

    let bind_addr = std::env::var("BIND_ADDR")
        .unwrap_or_else(|_| "0.0.0.0:8080".to_string());
    let addr: SocketAddr = bind_addr
        .parse()
        .expect("Invalid BIND_ADDR format");
    
    println!("Server running at http://{}", addr);
    println!("Upload directory: {}", upload_dir);
    
    let listener = TcpListener::bind(addr)
        .await
        .expect("Failed to bind to address");

    axum::serve(listener, app)
        .await
        .expect("Server failed to start");
}