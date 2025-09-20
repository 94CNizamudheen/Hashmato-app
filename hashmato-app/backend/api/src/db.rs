 use sqlx::postgres::PgPoolOptions;

pub async fn connect() -> sqlx::Pool<sqlx::Postgres> {
    let db_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL is missing from .env file");

    PgPoolOptions::new()
        .max_connections(10)
        .connect(&db_url)
        .await
        .expect("Failed to connect to Postgres")
}
