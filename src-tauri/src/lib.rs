use sqlx::SqlitePool;
use tauri::Manager;

mod model;
mod repository;
mod service;
mod command;

pub struct AppState {
    pub db: SqlitePool,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // アプリデータディレクトリにDBを配置
            let data_dir = app.path().app_data_dir()
                .map_err(|e| tauri::Error::Anyhow(e.into()))?;
            std::fs::create_dir_all(&data_dir)
                .map_err(|e| tauri::Error::Anyhow(e.into()))?;
            let db_path = data_dir.join("csorder.db");
            let db_url = format!("sqlite:{}?mode=rwc", db_path.to_string_lossy());

            let pool = tauri::async_runtime::block_on(async {
                let pool = SqlitePool::connect(&db_url).await?;
                // マイグレーション自動実行
                sqlx::migrate!("./migrations").run(&pool).await?;
                Ok::<SqlitePool, sqlx::Error>(pool)
            })
            .map_err(|e| tauri::Error::Anyhow(e.into()))?;

            app.manage(AppState { db: pool });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            command::employee_command::get_employees,
            command::employee_command::update_employees,
            command::order_command::get_orders,
            command::report_command::get_report,
            command::csv_import_command::preview_csv,
            command::csv_import_command::validate_csv,
            command::csv_import_command::import_orders,
            command::month_edit_command::get_month_edit,
            command::month_edit_command::update_month_edit,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
