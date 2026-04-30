use sqlx::SqlitePool;
use crate::model::orders::{NewOrder, Order};

pub async fn get_orders(
    pool: &SqlitePool,
    cs_name: Option<String>,
    client_name: Option<String>,
) -> Result<Vec<Order>, String> {
    sqlx::query_as::<_, Order>(
        r#"SELECT id, cs_name, order_date, amount, gross_profit, project_name, client_name
           FROM orders
           WHERE (? IS NULL OR cs_name = ?)
             AND (? IS NULL OR client_name = ?)
           ORDER BY order_date DESC, id DESC"#,
    )
    .bind(&cs_name)
    .bind(&cs_name)
    .bind(&client_name)
    .bind(&client_name)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())
}

/// 既存の全件を削除してから新規に全件挿入する（UPSERT）。
/// インポート件数を返す。
/// エラーがあれば DB 書き込みなしで Err を返す。
pub async fn upsert_orders(pool: &SqlitePool, orders: &[NewOrder]) -> Result<usize, String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    sqlx::query("DELETE FROM orders")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    for o in orders {
        sqlx::query(
            r#"INSERT OR REPLACE INTO orders
               (project_code, employee_code, cs_name, amount, gross_profit,
                project_name, client_name, order_date, order_month_int)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"#,
        )
        .bind(o.project_code)
        .bind(o.employee_code)
        .bind(&o.cs_name)
        .bind(o.amount)
        .bind(o.gross_profit)
        .bind(&o.project_name)
        .bind(&o.client_name)
        .bind(&o.order_date)
        .bind(o.order_month_int)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }
    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(orders.len())
}


