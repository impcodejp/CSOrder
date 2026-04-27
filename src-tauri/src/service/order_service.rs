use crate::model::orders::Order;
use crate::repository::order_repository;

pub async fn get_all_orders(
    pool: &sqlx::SqlitePool,
    cs_name: Option<String>,
    client_name: Option<String>,
) -> Result<Vec<Order>, String> {
    order_repository::get_orders(pool, cs_name, client_name).await
}
