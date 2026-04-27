use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Deserialize, Serialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Employee {
    pub id: i64,
    pub name: String,
    pub group: String,
    pub grade: String,
    pub monthly_budget1: i64,
    pub monthly_budget2: i64,
    pub monthly_budget3: i64,
    pub monthly_budget4: i64,
    pub monthly_budget5: i64,
    pub monthly_budget6: i64,
    pub monthly_budget7: i64,
    pub monthly_budget8: i64,
    pub monthly_budget9: i64,
    pub monthly_budget10: i64,
    pub monthly_budget11: i64,
    pub monthly_budget12: i64,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateEmployees {
    pub name: String,
    pub group: String,
    pub grade: String,
    pub monthly_budget1: i64,
    pub monthly_budget2: i64,
    pub monthly_budget3: i64,
    pub monthly_budget4: i64,
    pub monthly_budget5: i64,
    pub monthly_budget6: i64,
    pub monthly_budget7: i64,
    pub monthly_budget8: i64,
    pub monthly_budget9: i64,
    pub monthly_budget10: i64,
    pub monthly_budget11: i64,
    pub monthly_budget12: i64,
}
