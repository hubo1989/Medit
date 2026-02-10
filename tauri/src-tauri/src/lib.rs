use tauri::generate_context;
use tauri::{Emitter, Manager};

mod menu;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Create and set application menu
            let app_menu = menu::create_menu(app.handle())?;
            app.set_menu(app_menu)?;

            // Handle menu events
            app.on_menu_event(|app, event| {
                handle_menu_event(app, event);
            });

            Ok(())
        })
        .run(generate_context!())
        .expect("error while running tauri application");
}

/// Handle menu item clicks by emitting events to the frontend
fn handle_menu_event(app: &tauri::AppHandle, event: tauri::menu::MenuEvent) {
    let window = match app.get_webview_window("main") {
        Some(w) => w,
        None => return,
    };

    match event.id().as_ref() {
        // File menu
        "file:new" => {
            let _ = window.emit("menu:file:new", ());
        }
        "file:open" => {
            let _ = window.emit("menu:file:open", ());
        }
        "file:save" => {
            let _ = window.emit("menu:file:save", ());
        }
        "file:save-as" => {
            let _ = window.emit("menu:file:save-as", ());
        }
        "file:exit" => {
            let _ = window.emit("menu:file:exit", ());
        }

        // Edit menu
        "edit:find" => {
            let _ = window.emit("menu:edit:find", ());
        }

        // View menu
        "view:edit-mode" => {
            let _ = window.emit("menu:view:edit-mode", ());
        }
        "view:preview-mode" => {
            let _ = window.emit("menu:view:preview-mode", ());
        }
        "view:split-mode" => {
            let _ = window.emit("menu:view:split-mode", ());
        }
        "view:zoom-in" => {
            let _ = window.emit("menu:view:zoom-in", ());
        }
        "view:zoom-out" => {
            let _ = window.emit("menu:view:zoom-out", ());
        }
        "view:reset-zoom" => {
            let _ = window.emit("menu:view:reset-zoom", ());
        }

        // Help menu
        "help:about" => {
            let _ = window.emit("menu:help:about", ());
        }
        "help:docs" => {
            let _ = window.emit("menu:help:docs", ());
        }
        "help:shortcuts" => {
            let _ = window.emit("menu:help:shortcuts", ());
        }

        _ => {}
    }
}
