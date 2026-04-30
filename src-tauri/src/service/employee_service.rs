use crate::model::employees::{Employee, UpdateEmployees};
use crate::repository::employee_repository;
use crate::repository::budget_repository;

pub async fn get_all_employees(pool: &sqlx::SqlitePool) -> Result<Vec<Employee>, String> {
    employee_repository::get_all_employees_repo(pool).await
}

pub async fn update_all_employees(
    pool: &sqlx::SqlitePool,
    employees: Vec<UpdateEmployees>,
) -> Result<(), String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    employee_repository::delete_all_employees_repo(&mut tx).await?;
    employee_repository::insert_employees_repo(&mut tx, &employees).await?;
    budget_repository::delete_budget(&mut tx).await?;
    budget_repository::insert_budget(&mut tx).await?;
    tx.commit().await.map_err(|e| e.to_string())
}