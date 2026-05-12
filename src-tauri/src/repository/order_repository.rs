use sqlx::SqlitePool;
use crate::model::orders::{NewOrder, Order};
use sqlx::{ QueryBuilder, Sqlite};

pub async fn upsert_orders(pool: &SqlitePool, orders: &[NewOrder]) -> Result<usize, String> {
    if orders.is_empty() {
        return Ok(0);
    }
    println!("upsert_ordersに渡された件数: {}", orders.len());
    // トランザクションの開始
    let mut tx = pool.begin().await.map_err(|e| format!("Transaction error: {}", e))?;

    // ① 既存データの削除
    sqlx::query("DELETE FROM orders")
        .execute(&mut *tx)
        .await
        .map_err(|e| format!("Delete error: {}", e))?;

    // ② チャンクごとに一括挿入 (SQLiteの変数上限対策で100件ずつ分割)
    for chunk in orders.chunks(100) {
        println!("upsert_ordersのチャンクに渡された件数: {}", chunk.len());
        let mut query_builder: QueryBuilder<Sqlite> = QueryBuilder::new(
            "INSERT INTO orders (
                project_code, 
                employee_code, 
                cs_name, 
                amount, 
                gross_profit, 
                project_name, 
                client_name, 
                order_date, 
                order_month_int
            ) "
        );

        query_builder.push_values(chunk, |mut b, o| {
            b.push_bind(o.project_code)
             .push_bind(o.employee_code)
             .push_bind(&o.cs_name)
             .push_bind(o.amount)
             .push_bind(o.gross_profit)
             .push_bind(&o.project_name)
             .push_bind(&o.client_name)
             .push_bind(&o.order_date)
             .push_bind(o.order_month_int);
        });

        let query = query_builder.build();
        query
            .execute(&mut *tx)
            .await
            .map_err(|e| format!("Insert error in chunk: {}", e))?;
    }

    // ③ コミット
    tx.commit()
        .await
        .map_err(|e| format!("Commit error: {}", e))?;

    Ok(orders.len())
}

pub async fn get_orders(
    pool: &SqlitePool,
    cs_name: Option<String>,
    client_name: Option<String>,
    date_from: Option<String>,
    date_to: Option<String>,
) -> Result<Vec<Order>, String> {
    sqlx::query_as::<_, Order>(
        r#"SELECT id, cs_name, order_date, amount, gross_profit, project_name, client_name
           FROM orders
           WHERE (? IS NULL OR cs_name LIKE '%' || ? || '%')
             AND (? IS NULL OR client_name LIKE '%' || ? || '%')
             AND (? IS NULL OR order_date >= ?)
             AND (? IS NULL OR order_date <= ?)
           ORDER BY order_date DESC, id DESC"#,
    )
    .bind(&cs_name)
    .bind(&cs_name)
    .bind(&client_name)
    .bind(&client_name)
    .bind(&date_from)
    .bind(&date_from)
    .bind(&date_to)
    .bind(&date_to)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())
}


pub async fn update_order_month_int(pool: &SqlitePool) -> Result<(), String> {
    sqlx::query(
        r#"
            UPDATE orders
            SET order_month_int = COALESCE(
                (
                    SELECT nmonth 
                    FROM month_edit 
                    WHERE orders.order_date <= month_edit.end_month_date 
                    ORDER BY end_month_date ASC 
                    LIMIT 1
                ), 
                999
            );"#
    )
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(())
}