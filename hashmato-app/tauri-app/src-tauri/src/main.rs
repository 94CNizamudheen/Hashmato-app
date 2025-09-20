#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::command;
use serde::{Serialize, Deserialize};

/// Command: open cash drawer
#[command]
fn open_drawer() -> Result<String, String> {
    // TODO: send signal to actual cash drawer (USB/serial/ESC/POS)
    println!("💵 Open drawer called!");
    Ok("Drawer opened".into())
}

/// Command: print receipt
#[derive(Debug, Deserialize)]
struct ReceiptItem {
    name: String,
    qty: u32,
    price: f64,
}

#[derive(Debug, Deserialize)]
struct ReceiptPayload {
    order_id: i32,
    items: Vec<ReceiptItem>,
    total: f64,
}

#[command]
fn print_receipt(payload: ReceiptPayload) -> Result<String, String> {
    println!("🖨 Printing receipt for order {}", payload.order_id);
    for item in payload.items {
        println!("- {} x{} = ${}", item.name, item.qty, item.price);
    }
    println!("TOTAL = ${}", payload.total);

    // TODO: replace println! with actual ESC/POS print driver
    Ok("Print job queued".into())
}

/// Command: get current app version
#[command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Command: check for updates (stub)
#[command]
fn latest_update() -> Result<String, String> {
    // Ideally call your backend /latest_update endpoint
    Ok("No updates available".into())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            open_drawer,
            print_receipt,
            get_app_version,
            latest_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
