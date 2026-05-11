use sqlx::SqlitePool;
use crate::model::month_edit::MonthEdit;

pub async fn get_month_edit(
    pool: &SqlitePool,
) -> Result<Vec<MonthEdit>, String> {
    sqlx::query_as::<_, MonthEdit>(
        r#"SELECT nmonth, end_month_date FROM month_edit ORDER BY nmonth DESC"#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())
}

// SQLiteでの一括更新をより安全にする例（トランザクション利用）

pub async fn update_month_edit(
    pool: &sqlx::SqlitePool,
    rows: Vec<MonthEdit>
) -> Result<(), String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    for row in rows {
        let final_date = match &row.end_month_date {
            Some(date) if !date.is_empty() => date.as_str(),
            _ => "1990/12/31",
        };
        
        // ログで rows affected を確認できるように結果を受け取ります
        let result = sqlx::query(
            r#"
            INSERT INTO month_edit (nmonth, end_month_date)
            VALUES (?, ?)
            ON CONFLICT(nmonth) DO UPDATE SET end_month_date = excluded.end_month_date
            "#
        )
        .bind(row.nmonth)
        .bind(final_date)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        println!("nmonth {}: rows affected = {}", row.nmonth, result.rows_affected());
    }

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(())
}