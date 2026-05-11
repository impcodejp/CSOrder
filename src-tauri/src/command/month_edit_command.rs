use crate::AppState;
use tauri::State;
use crate::model::month_edit::MonthEdit;
use crate::service::month_edit_service;


#[tauri::command]
pub async fn get_month_edit(state: State<'_, AppState>
) -> Result<Vec<MonthEdit>, String> {
    month_edit_service::get_month_edit(&state.db).await
}

#[tauri::command]
pub async fn update_month_edit(
    state: State<'_, AppState>, rows: Vec<MonthEdit>
) -> Result<(), String> {
    month_edit_service::update_month_edit(&state.db, rows).await
}
