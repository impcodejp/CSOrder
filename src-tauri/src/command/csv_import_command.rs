use crate::model::csv_import::{CsvPreviewRow, CsvValidationResult};
use crate::service::csv_import_service;
use crate::AppState;
use tauri::State;

/// ファイル選択直後のプレビュー（DB 書き込みなし）
#[tauri::command]
pub fn preview_csv(path: String) -> Result<Vec<CsvPreviewRow>, String> {
    csv_import_service::preview_csv(&path)
}

/// バリデーションのみ（DB 書き込みなし）
#[tauri::command]
pub fn validate_csv(path: String) -> Result<CsvValidationResult, String> {
    csv_import_service::validate_csv(&path)
}

/// インポート実行（成功時はインポート件数を返す）
#[tauri::command]
pub async fn import_orders(
    state: State<'_, AppState>,
    path: String,
) -> Result<usize, String> {
    csv_import_service::import_orders(&state.db, &path).await
}
