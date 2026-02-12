use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use tauri::menu::MenuItemKind;
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;

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

#[derive(Debug, Serialize, Deserialize)]
pub struct DialogResult {
    pub path: Option<String>,
    pub canceled: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NewFileResult {
    pub success: bool,
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

/// Create a new file - clears current content and returns success
#[tauri::command]
pub fn new_file() -> NewFileResult {
    // Simply returns success, frontend will clear the content
    NewFileResult { success: true }
}

/// Open file dialog to select a file for reading
#[tauri::command]
pub async fn open_file_dialog(app: AppHandle) -> Result<DialogResult, String> {
    let (tx, rx) = std::sync::mpsc::channel();

    app.dialog()
        .file()
        .add_filter("Markdown", &["md", "markdown", "mdown", "mkd"])
        .add_filter("Text", &["txt"])
        .add_filter("All Files", &["*"])
        .pick_file(move |file_path| {
            let _ = tx.send(file_path);
        });

    // Wait for the callback to complete
    let file_path = rx.recv().map_err(|e| e.to_string())?;

    match file_path {
        Some(path) => Ok(DialogResult {
            path: Some(path.to_string()),
            canceled: false,
        }),
        None => Ok(DialogResult {
            path: None,
            canceled: true,
        }),
    }
}

/// Save file dialog to select a location for saving
#[tauri::command]
pub async fn save_file_dialog(
    app: AppHandle,
    default_name: Option<String>,
) -> Result<DialogResult, String> {
    let (tx, rx) = std::sync::mpsc::channel();

    let mut dialog = app
        .dialog()
        .file()
        .add_filter("Markdown", &["md", "markdown"])
        .add_filter("Text", &["txt"])
        .add_filter("All Files", &["*"]);

    // Set default filename if provided
    if let Some(name) = default_name {
        dialog = dialog.set_file_name(&name);
    }

    dialog.save_file(move |file_path| {
        let _ = tx.send(file_path);
    });

    // Wait for the callback to complete
    let file_path = rx.recv().map_err(|e| e.to_string())?;

    match file_path {
        Some(path) => Ok(DialogResult {
            path: Some(path.to_string()),
            canceled: false,
        }),
        None => Ok(DialogResult {
            path: None,
            canceled: true,
        }),
    }
}

/// Exit the application safely
#[tauri::command]
pub fn exit_app(app: AppHandle) -> Result<(), String> {
    app.exit(0);
    Ok(())
}

#[tauri::command]
pub fn update_menu_labels(app: AppHandle, labels: HashMap<String, String>) -> Result<(), String> {
    let Some(menu) = app.menu() else {
        return Err("No menu found".to_string());
    };

    let items = menu.items().map_err(|e| e.to_string())?;
    for item in &items {
        if let MenuItemKind::Submenu(submenu) = item {
            let sub_id = submenu.id().as_ref().to_string();
            if let Some(label) = labels.get(&sub_id) {
                submenu.set_text(label).map_err(|e| e.to_string())?;
            }
            let children = submenu.items().map_err(|e| e.to_string())?;
            for child in &children {
                let child_id = match child {
                    MenuItemKind::MenuItem(mi) => mi.id().as_ref().to_string(),
                    MenuItemKind::Check(ci) => ci.id().as_ref().to_string(),
                    _ => continue,
                };
                if let Some(label) = labels.get(&child_id) {
                    match child {
                        MenuItemKind::MenuItem(mi) => {
                            mi.set_text(label).map_err(|e| e.to_string())?;
                        }
                        MenuItemKind::Check(ci) => {
                            ci.set_text(label).map_err(|e| e.to_string())?;
                        }
                        _ => {}
                    }
                }
            }
        }
    }
    Ok(())
}
