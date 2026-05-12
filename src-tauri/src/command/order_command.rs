// commands are defined in employee_command.rs
use crate::model::orders::Order;
use crate::service::order_service;
use crate::AppState;
use tauri::State;


#[tauri::command]
pub async fn get_orders(
    state: State<'_, AppState>, 
    cs_name: Option<String>,
    client_name: Option<String>,
    date_from: Option<String>,
    date_to: Option<String>,
) -> Result<Vec<Order>, String> {
    order_service::get_all_orders(&state.db, cs_name, client_name, date_from, date_to).await
}