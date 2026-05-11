use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct MonthEdit {
    pub nmonth: i64,
    pub end_month_date: Option<String>,
}