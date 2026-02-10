use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::{AppHandle, Manager};

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
    use tauri_plugin_dialog::FileDialogExt;

    let file_path = app
        .dialog()
        .file()
        .add_filter("Markdown", &["md", "markdown", "mdown", "mkd"])
        .add_filter("Text", &["txt"])
        .add_filter("All Files", &["*"])
        .blocking_pick_file();

    match file_path {
        Some(path) => {
            let path_str = path.to_string();
            Ok(DialogResult {
                path: Some(path_str),
                canceled: false,
            })
        }
        None => Ok(DialogResult {
            path: None,
            canceled: true,
        }),
    }
}

/// Save file dialog to select a location for saving
#[tauri::command]
pub async fn save_file_dialog(app: AppHandle, default_name: Option<String>) -> Result<DialogResult, String> {
    use tauri_plugin_dialog::FileDialogExt;

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

    let file_path = dialog.blocking_save_file();

    match file_path {
        Some(path) => {
            let path_str = path.to_string();
            Ok(DialogResult {
                path: Some(path_str),
                canceled: false,
            })
        }
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
