pub async fn delete_budget(tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>) -> Result<(), String> {
    sqlx::query("DELETE FROM budget")
        .execute(&mut **tx)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub async fn insert_budget(tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>) -> Result<(), String> {
    sqlx::query(r"
    INSERT INTO budget (code, cs_name, month_int, budget)
    SELECT 
        employee_code as code, 
        name as cs_name,
        1 as month_int,
        monthly_budget1 as budget
    FROM employees
    UNION ALL
    SELECT employee_code as code,
        name as cs_name,
        2 as month_int,
        monthly_budget2 as budget
    FROM employees
    UNION ALL
    SELECT employee_code as code,
        name as cs_name,
        3 as month_int,
        monthly_budget3 as budget
    FROM employees
    UNION ALL
    SELECT employee_code as code,
        name as cs_name,
        4 as month_int,
        monthly_budget4 as budget
    FROM employees
    UNION ALL
    SELECT employee_code as code,
        name as cs_name,
        5 as month_int,
        monthly_budget5 as budget
    FROM employees
    UNION ALL
    SELECT employee_code as code,
        name as cs_name,
        6 as month_int,
        monthly_budget6 as budget
    FROM employees
    UNION ALL
    SELECT employee_code as code,
        name as cs_name,
        7 as month_int,
        monthly_budget7 as budget
    FROM employees
    UNION ALL
    SELECT employee_code as code,
        name as cs_name,
        8 as month_int,
        monthly_budget8 as budget
    FROM employees
    UNION ALL
    SELECT employee_code as code,
        name as cs_name,
        9 as month_int,
        monthly_budget9 as budget
    FROM employees
    UNION ALL
    SELECT employee_code as code,
        name as cs_name,
        10 as month_int,
        monthly_budget10 as budget
    FROM employees
    UNION ALL
    SELECT employee_code as code,
        name as cs_name,
        11 as month_int,
        monthly_budget11 as budget
    FROM employees
    UNION ALL
    SELECT employee_code as code,
        name as cs_name,
        12 as month_int,
        monthly_budget12 as budget
    FROM employees
    "
)
        .execute(&mut **tx)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}