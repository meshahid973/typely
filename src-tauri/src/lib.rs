use std::process::Command;
use tauri::Manager;

const RELEASES_ROOT: &str = "https://github.com/meshahid973/typely/releases";

#[tauri::command]
fn open_update_url(url: String) -> Result<(), String> {
    let allowed = url
        .strip_prefix(RELEASES_ROOT)
        .is_some_and(|remainder| remainder.is_empty() || remainder.starts_with('/'));

    if !allowed {
        return Err("The update URL is not allowed.".to_string());
    }

    #[cfg(target_os = "windows")]
    let process = Command::new("rundll32")
        .arg("url.dll,FileProtocolHandler")
        .arg(&url)
        .spawn();

    #[cfg(target_os = "macos")]
    let process = Command::new("open").arg(&url).spawn();

    #[cfg(all(unix, not(target_os = "macos")))]
    let process = Command::new("xdg-open").arg(&url).spawn();

    process
        .map(|_| ())
        .map_err(|error| format!("The release page could not be opened: {error}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .invoke_handler(tauri::generate_handler![open_update_url])
        .run(tauri::generate_context!())
        .expect("Typely failed to start");
}
