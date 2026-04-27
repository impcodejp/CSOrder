use crate::model::employees::{ UpdateEmployees, Employee };
use crate::service::employee_service;
use crate::AppState;
use tauri::State;

#[tauri::command]
pub async fn get_employees(state: State<'_, AppState>) -> Result<Vec<Employee>, String> {
    employee_service::get_all_employees(&state.db).await
}

#[tauri::command]
pub async fn update_employees(
    state: State<'_, AppState>,
    employees: Vec<UpdateEmployees>,
) -> Result<(), String> {
    employee_service::update_all_employees(&state.db, employees).await
}

