use serde::{Deserialize, Serialize};

/// CSVの1行に対応する構造体（ヘッダー名で直接マッピング）
#[derive(Debug, Deserialize)]
pub struct CsvRow {
    #[serde(rename = "案件番号")]
    pub order_no: String,
    #[serde(rename = "案件名")]
    pub project_name: String,
    #[serde(rename = "顧客名")]
    pub client_name: String,
    #[serde(rename = "売上合計")]
    pub amount: String,
    #[serde(rename = "粗利合計")]
    pub gross_profit: String,
    #[serde(rename = "契約日")]
    pub order_date: String,
    #[serde(rename = "案件主担当者ID")]
    pub employee_code: String,
    #[serde(rename = "案件主担当者名")]
    pub cs_name: String,
}

#[derive(Debug, Serialize)]
pub struct ValidationError {
    pub row: usize,
    pub field: String,
    pub message: String,
}

/// validate_csv の戻り値
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CsvValidationResult {
    pub total: usize,
    pub skipped: usize,
    pub valid_count: usize,
    pub errors: Vec<ValidationError>,
}

/// preview_csv で返す1行分の表示データ
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CsvPreviewRow {
    pub cs_name: String,
    pub amount: i64,
    pub gross_profit: i64,
    pub project_name: String,
    pub client_name: String,
    pub order_date: String,
}
