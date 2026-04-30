use crate::model::report::CsMemberOrderSummary;
use crate::service::report_service;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn get_report(
    state: State<'_, AppState>,
    from: i64,
    to: i64,
) -> Result<Vec<CsMemberOrderSummary>, String> {
    report_service::get_report(&state.db, from, to).await
}
