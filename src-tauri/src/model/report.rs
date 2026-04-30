use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct CsMemberOrderSummary {
    pub cs_name: String,
    pub group: String,
    pub grade: String,
    pub project_count: i64,
    pub amount: i64,
    pub gross_profit: i64,
    pub bugget: i64,
}
