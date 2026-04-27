use sqlx::SqlitePool;
use crate::model::employees::{Employee, UpdateEmployees};

pub async fn get_all_employees_repo(pool: &SqlitePool) -> Result<Vec<Employee>, String> {
    sqlx::query_as::<_, Employee>(
        r#"SELECT id, name, "group", grade,
           monthly_budget1, monthly_budget2, monthly_budget3, monthly_budget4,
           monthly_budget5, monthly_budget6, monthly_budget7, monthly_budget8,
           monthly_budget9, monthly_budget10, monthly_budget11, monthly_budget12
           FROM employees ORDER BY id"#,
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())
}

pub async fn delete_all_employees_repo(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
) -> Result<(), String> {
    sqlx::query("DELETE FROM employees")
        .execute(&mut **tx)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub async fn insert_employees_repo(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    employees: &[UpdateEmployees],
) -> Result<(), String> {
    for e in employees {
        sqlx::query(
            r#"INSERT INTO employees
               (name, "group", grade,
                monthly_budget1, monthly_budget2, monthly_budget3, monthly_budget4,
                monthly_budget5, monthly_budget6, monthly_budget7, monthly_budget8,
                monthly_budget9, monthly_budget10, monthly_budget11, monthly_budget12)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
        )
        .bind(&e.name)
        .bind(&e.group)
        .bind(&e.grade)
        .bind(e.monthly_budget1)
        .bind(e.monthly_budget2)
        .bind(e.monthly_budget3)
        .bind(e.monthly_budget4)
        .bind(e.monthly_budget5)
        .bind(e.monthly_budget6)
        .bind(e.monthly_budget7)
        .bind(e.monthly_budget8)
        .bind(e.monthly_budget9)
        .bind(e.monthly_budget10)
        .bind(e.monthly_budget11)
        .bind(e.monthly_budget12)
        .execute(&mut **tx)
        .await
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}
