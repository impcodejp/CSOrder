use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Deserialize, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Order {
    pub id: i64,
    pub cs_name: String,
    pub order_date: String,
    pub amount: i64,
    pub gross_profit: i64,
    pub project_name: String,
    pub client_name: String,
}

/// CSV インポート時に DB へ挿入する行データ
pub struct NewOrder {
    pub project_code: i64,
    pub employee_code: i64,
    pub cs_name: String,
    pub amount: i64,
    pub gross_profit: i64,
    pub project_name: String,
    pub client_name: String,
    pub order_date: String,
    pub order_month_int: i64,
}
