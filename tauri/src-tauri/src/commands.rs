use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::api::dialog::{FileDialogBuilder, MessageDialogBuilder};

#[derive(Debug, Serialize, Deserialize)]
pub struct FileContent {
    pub path: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileResult {
    pub success: bool,
    pub content: Option<String>,
    pub error: Option<String>,
}

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
pub fn read_file(path: &str) -> FileResult {
    match fs::read_to_string(path) {
        Ok(content) => FileResult {
            success: true,
            content: Some(content),
            error: None,
        },
        Err(e) => FileResult {
            success: false,
            content: None,
            error: Some(e.to_string()),
        },
    }
}

#[tauri::command]
pub fn write_file(path: &str, content: &str) -> FileResult {
    match fs::write(path, content) {
        Ok(_) => FileResult {
            success: true,
            content: None,
            error: None,
        },
        Err(e) => FileResult {
            success: false,
            content: None,
            error: Some(e.to_string()),
        },
    }
}

#[tauri::command]
pub async fn open_file_dialog() -> Option<String> {
    // Note: This is a placeholder - actual implementation would use tauri::api::dialog
    None
}

#[tauri::command]
pub async fn save_file_dialog() -> Option<String> {
    // Note: This is a placeholder - actual implementation would use tauri::api::dialog
    None
}
