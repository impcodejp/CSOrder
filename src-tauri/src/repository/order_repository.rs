use sqlx::SqlitePool;
use crate::model::orders::Order;

pub async fn get_orders(
    pool: &SqlitePool,
    cs_name: Option<String>,
    client_name: Option<String>,
) -> Result<Vec<Order>, String> {
    sqlx::query_as::<_, Order>(
        r#"SELECT id, cs_name, order_date, amount, gross_profit, client_name
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
