
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Deserialize, Serialize, FromRow)]
pub struct Order {
    pub id: i64,
    pub cs_name: String,
    pub order_date: String,
    pub amount: i64,
    pub gross_profit: i64,
    pub project_name: String,
    pub client_name: String,
}