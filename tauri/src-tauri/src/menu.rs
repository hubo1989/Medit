use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::AppHandle;

/// Create the application menu
pub fn create_menu<R: tauri::Runtime>(
    app: &AppHandle<R>,
) -> Result<Menu<R>, Box<dyn std::error::Error>> {
    let menu = Menu::new(app)?;

    // App Menu (macOS only)
    #[cfg(target_os = "macos")]
    {
        let app_menu = create_app_menu(app)?;
        menu.append(&app_menu)?;
    }

    // File Menu
    let file_menu = create_file_menu(app)?;
    menu.append(&file_menu)?;

    // Edit Menu
    let edit_menu = create_edit_menu(app)?;
    menu.append(&edit_menu)?;

    // View Menu
    let view_menu = create_view_menu(app)?;
    menu.append(&view_menu)?;

    // Help Menu
    let help_menu = create_help_menu(app)?;
    menu.append(&help_menu)?;

    Ok(menu)
}

/// Create File submenu
fn create_file_menu<R: tauri::Runtime>(
    app: &AppHandle<R>,
) -> Result<Submenu<R>, Box<dyn std::error::Error>> {
    // Create submenu first
    let submenu = Submenu::with_id(app, "file", "文件", true)?;

    // New File
    let new_file = MenuItem::with_id(app, "file:new", "新建", true, None::<&str>);
    submenu.append(&new_file?)?;

    // Open File
    let open_file = MenuItem::with_id(app, "file:open", "打开...", true, Some("CmdOrCtrl+O"));
    submenu.append(&open_file?)?;

    submenu.append(&PredefinedMenuItem::separator(app)?)?;

    // Save
    let save = MenuItem::with_id(app, "file:save", "保存", true, Some("CmdOrCtrl+S"));
    submenu.append(&save?)?;

    // Save As
    let save_as = MenuItem::with_id(app, "file:save-as", "另存为...", true, Some("CmdOrCtrl+Shift+S"));
    submenu.append(&save_as?)?;

    submenu.append(&PredefinedMenuItem::separator(app)?)?;

    // Exit (handled automatically on macOS, but we add it for other platforms)
    #[cfg(not(target_os = "macos"))]
    {
        let exit = MenuItem::with_id(app, "file:exit", "退出", true, None::<&str>);
        submenu.append(&exit?)?;
    }

    Ok(submenu)
}

/// Create Edit submenu
fn create_edit_menu<R: tauri::Runtime>(
    app: &AppHandle<R>,
) -> Result<Submenu<R>, Box<dyn std::error::Error>> {
    let submenu = Submenu::with_id(app, "edit", "编辑", true)?;

    // Undo
    let undo = PredefinedMenuItem::undo(app, None)?;
    submenu.append(&undo)?;

    // Redo
    let redo = PredefinedMenuItem::redo(app, None)?;
    submenu.append(&redo)?;

    submenu.append(&PredefinedMenuItem::separator(app)?)?;

    // Cut
    let cut = PredefinedMenuItem::cut(app, None)?;
    submenu.append(&cut)?;

    // Copy
    let copy = PredefinedMenuItem::copy(app, None)?;
    submenu.append(&copy)?;

    // Paste
    let paste = PredefinedMenuItem::paste(app, None)?;
    submenu.append(&paste)?;

    // Select All
    let select_all = PredefinedMenuItem::select_all(app, None)?;
    submenu.append(&select_all)?;

    submenu.append(&PredefinedMenuItem::separator(app)?)?;

    // Find
    let find = MenuItem::with_id(app, "edit:find", "查找...", true, Some("CmdOrCtrl+F"));
    submenu.append(&find?)?;

    Ok(submenu)
}

/// Create View submenu
fn create_view_menu<R: tauri::Runtime>(
    app: &AppHandle<R>,
) -> Result<Submenu<R>, Box<dyn std::error::Error>> {
    let submenu = Submenu::with_id(app, "view", "视图", true)?;

    // Edit Mode
    let edit_mode = MenuItem::with_id(
        app,
        "view:edit-mode",
        "编辑模式",
        true,
        Some("CmdOrCtrl+Shift+E"),
    );
    submenu.append(&edit_mode?)?;

    // Preview Mode
    let preview_mode = MenuItem::with_id(
        app,
        "view:preview-mode",
        "预览模式",
        true,
        Some("CmdOrCtrl+Shift+P"),
    );
    submenu.append(&preview_mode?)?;

    // Split Mode
    let split_mode = MenuItem::with_id(
        app,
        "view:split-mode",
        "分屏模式",
        true,
        Some("CmdOrCtrl+Shift+L"),
    );
    submenu.append(&split_mode?)?;

    submenu.append(&PredefinedMenuItem::separator(app)?)?;

    // Zoom In
    let zoom_in = MenuItem::with_id(app, "view:zoom-in", "放大", true, Some("CmdOrCtrl+Plus"));
    submenu.append(&zoom_in?)?;

    // Zoom Out
    let zoom_out = MenuItem::with_id(app, "view:zoom-out", "缩小", true, Some("CmdOrCtrl+-"));
    submenu.append(&zoom_out?)?;

    // Reset Zoom
    let reset_zoom = MenuItem::with_id(
        app,
        "view:reset-zoom",
        "重置缩放",
        true,
        Some("CmdOrCtrl+0"),
    );
    submenu.append(&reset_zoom?)?;

    Ok(submenu)
}

/// Create Help submenu
fn create_help_menu<R: tauri::Runtime>(
    app: &AppHandle<R>,
) -> Result<Submenu<R>, Box<dyn std::error::Error>> {
    let submenu = Submenu::with_id(app, "help", "帮助", true)?;

    // About (only on non-macOS platforms, macOS has it in App menu)
    #[cfg(not(target_os = "macos"))]
    {
        let about = MenuItem::with_id(app, "help:about", "关于 Medit", true, None::<&str>);
        submenu.append(&about?)?;
    }

    // Documentation
    let docs = MenuItem::with_id(app, "help:docs", "文档", true, None::<&str>);
    submenu.append(&docs?)?;

    submenu.append(&PredefinedMenuItem::separator(app)?)?;

    // Keyboard Shortcuts
    let shortcuts = MenuItem::with_id(
        app,
        "help:shortcuts",
        "快捷键参考",
        true,
        Some("CmdOrCtrl+?"),
    );
    submenu.append(&shortcuts?)?;

    Ok(submenu)
}

/// Create App submenu (macOS only)
/// This menu appears as the first menu with the app name "Medit"
#[cfg(target_os = "macos")]
fn create_app_menu<R: tauri::Runtime>(
    app: &AppHandle<R>,
) -> Result<Submenu<R>, Box<dyn std::error::Error>> {
    let submenu = Submenu::with_id(app, "app", "Medit", true)?;

    // About Medit
    let about = MenuItem::with_id(app, "app:about", "关于 Medit", true, None::<&str>);
    submenu.append(&about?)?;

    submenu.append(&PredefinedMenuItem::separator(app)?)?;

    // Preferences...
    let preferences = MenuItem::with_id(app, "app:preferences", "偏好设置...", true, Some("Cmd+,"));
    submenu.append(&preferences?)?;

    submenu.append(&PredefinedMenuItem::separator(app)?)?;

    // Hide Medit (system provided)
    submenu.append(&PredefinedMenuItem::hide(app, None)?)?;

    // Hide Others (system provided)
    submenu.append(&PredefinedMenuItem::hide_others(app, None)?)?;

    // Show All (system provided)
    submenu.append(&PredefinedMenuItem::show_all(app, None)?)?;

    submenu.append(&PredefinedMenuItem::separator(app)?)?;

    // Quit Medit
    let quit = MenuItem::with_id(app, "app:quit", "退出 Medit", true, Some("Cmd+Q"));
    submenu.append(&quit?)?;

    Ok(submenu)
}
