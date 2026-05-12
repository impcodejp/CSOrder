use crate::model::csv_import::{
    CsvPreviewRow, CsvRow, CsvValidationResult, ValidationError,
};
use crate::model::orders::NewOrder;
use crate::repository::order_repository;

// ================================================================
// ファイル読み込み
// ================================================================

fn read_sjis_file(path: &str) -> Result<String, String> {
    let bytes = std::fs::read(path).map_err(|e| format!("ファイルを開けません: {e}"))?;
    let (cow, _, had_errors) = encoding_rs::SHIFT_JIS.decode(&bytes);
    if had_errors {
        return Err("文字コード変換に失敗しました（SJISではない可能性があります）".into());
    }
    Ok(cow.into_owned())
}

// ================================================================
// 必須列チェック
// ================================================================

fn validate_columns(headers: &csv::StringRecord) -> Result<(), String> {
    let required = [
        "案件番号",
        "案件名",
        "顧客名",
        "売上合計",
        "粗利合計",
        "契約日",
        "案件主担当者ID",
        "案件主担当者名",
    ];

    let missing: Vec<&str> = required
        .iter()
        .filter(|&&col| !headers.iter().any(|h| h == col))
        .copied()
        .collect();

    if !missing.is_empty() {
        return Err(format!(
            "以下の必須列が見つかりません: {}",
            missing.join(", ")
        ));
    }

    Ok(())
}

// ================================================================
// 1行バリデーション
// ================================================================

/// CsvRow を検証し、問題なければ NewOrder を返す。
/// エラーがあれば ValidationError のリストを返す。
fn validate_row(row: CsvRow, row_num: usize) -> Result<NewOrder, Vec<ValidationError>> {
    let mut errors: Vec<ValidationError> = vec![];

    let project_code  = parse_i64(&row.order_no,      "案件番号",       row_num, &mut errors);
    let employee_code = parse_i64(&row.employee_code, "案件主担当者ID", row_num, &mut errors);
    let amount        = parse_i64(&row.amount,         "売上合計",       row_num, &mut errors);
    let gross_profit  = parse_i64(&row.gross_profit,   "粗利合計",       row_num, &mut errors);

    require_str(&row.cs_name,      "案件主担当者名", row_num, &mut errors);
    require_str(&row.project_name, "案件名",         row_num, &mut errors);
    require_str(&row.client_name,  "顧客名",         row_num, &mut errors);

    let order_month_int = match date_to_month_int(&row.order_date) {
        Ok(v)    => Some(v),
        Err(msg) => {
            errors.push(ValidationError { row: row_num, field: "契約日".into(), message: msg });
            None
        }
    };

    if !errors.is_empty() {
        return Err(errors);
    }

    Ok(NewOrder {
        project_code:    project_code.unwrap(),
        employee_code:   employee_code.unwrap(),
        cs_name:         row.cs_name,
        amount:          amount.unwrap(),
        gross_profit:    gross_profit.unwrap(),
        project_name:    row.project_name,
        client_name:     row.client_name,
        order_date:      row.order_date,
        order_month_int: order_month_int.unwrap(),
    })
}

/// 文字列を i64 にパースし、失敗したらエラーを追記して None を返す。
fn parse_i64(
    value: &str,
    field: &str,
    row_num: usize,
    errors: &mut Vec<ValidationError>,
) -> Option<i64> {
    match value.parse::<i64>() {
        Ok(v) => Some(v),
        Err(_) => {
            let message = if value.is_empty() {
                "空欄です".into()
            } else {
                "数値に変換できません".into()
            };
            errors.push(ValidationError { row: row_num, field: field.into(), message });
            None
        }
    }
}

/// 空文字チェックし、空ならエラーを追記する。
fn require_str(value: &str, field: &str, row_num: usize, errors: &mut Vec<ValidationError>) {
    if value.is_empty() {
        errors.push(ValidationError {
            row: row_num,
            field: field.into(),
            message: "空欄です".into(),
        });
    }
}

// ================================================================
// 日付変換: YYYY/MM/DD → DB月番号（4月=1, 5月=2, …, 3月=12）
// ================================================================

fn date_to_month_int(date: &str) -> Result<i64, String> {
    let parts: Vec<&str> = date.split('/').collect();
    if parts.len() < 3 {
        return Err(format!("日付形式が不正です（YYYY/MM/DD）: {date}"));
    }
    let m = parts[1]
        .parse::<i64>()
        .map_err(|_| format!("月が不正です: {}", parts[1]))?;
    if !(1..=12).contains(&m) {
        return Err(format!("月の値が範囲外です: {m}"));
    }
    Ok(((m - 4 + 12) % 12) + 1)
}

// ================================================================
// CSV パース（全行）
// ================================================================

/// UTF-8 文字列から全行をパースし、
/// 契約日が空欄の行はスキップ、それ以外はバリデーションする。
/// 戻り値: (有効行リスト, スキップ件数, エラーリスト)
fn parse_csv(utf8: &str) -> Result<(Vec<NewOrder>, usize, Vec<ValidationError>), String> {
    let mut reader = csv::ReaderBuilder::new()
        .has_headers(true)
        .from_reader(utf8.as_bytes());

    // ① 必須列チェック（行ループより先に実施）
    let headers = reader
        .headers()
        .map_err(|e| format!("ヘッダーの読み込みに失敗しました: {e}"))?
        .clone();

    validate_columns(&headers)?;

    // ② 行ループ
    let mut valid_rows: Vec<NewOrder> = vec![];
    let mut all_errors: Vec<ValidationError> = vec![];
    let mut skipped = 0usize;

    for (idx, result) in reader.deserialize::<CsvRow>().enumerate() {
        let row_num = idx + 2; // 1行目はヘッダーなので2始まり

        let row = match result {
            Ok(r)  => r,
            Err(e) => {
                all_errors.push(ValidationError {
                    row: row_num,
                    field: "行全体".into(),
                    message: format!("パースエラー: {e}"),
                });
                continue;
            }
        };

        // 契約日が空欄の行は対象外（エラーではない）
        if row.order_date.is_empty() {
            skipped += 1;
            continue;
        }

        match validate_row(row, row_num) {
            Ok(order) => valid_rows.push(order),
            Err(errs) => all_errors.extend(errs),
        }
    }

    Ok((valid_rows, skipped, all_errors))
}

// ================================================================
// エラー整形
// ================================================================

fn errors_to_string(errors: &[ValidationError]) -> String {
    errors
        .iter()
        .map(|e| format!("行{}: {} - {}", e.row, e.field, e.message))
        .collect::<Vec<_>>()
        .join("\n")
}

// ================================================================
// Public API
// ================================================================

/// ファイルをパースしてプレビュー行を返す（DB 書き込みなし）。
/// バリデーションエラーがあれば Err を返す。
pub fn preview_csv(path: &str) -> Result<Vec<CsvPreviewRow>, String> {
    let utf8 = read_sjis_file(path)?;
    let (valid_rows, _, errors) = parse_csv(&utf8)?;

    if !errors.is_empty() {
        return Err(errors_to_string(&errors));
    }

    let rows = valid_rows
        .into_iter()
        .map(|o| CsvPreviewRow {
            cs_name:      o.cs_name,
            amount:       o.amount,
            gross_profit: o.gross_profit,
            project_name: o.project_name,
            client_name:  o.client_name,
            order_date:   o.order_date,
        })
        .collect();

    Ok(rows)
}


pub fn validate_csv(path: &str) -> Result<CsvValidationResult, String> {
    let utf8 = read_sjis_file(path)?;
    let (valid_rows, skipped, errors) = parse_csv(&utf8)?;

    let error_rows: std::collections::HashSet<usize> = errors.iter().map(|e| e.row).collect();
    let valid_count = valid_rows.len();
    let total = valid_count + error_rows.len();

    Ok(CsvValidationResult { total, skipped, valid_count, errors })
}


pub async fn import_orders(pool: &sqlx::SqlitePool, path: &str) -> Result<usize, String> {
    let utf8 = read_sjis_file(path)?;
    let (valid_rows, _, errors) = parse_csv(&utf8)?;

    if !errors.is_empty() {
        return Err(errors_to_string(&errors));
    }
    println!("repositoryに渡す件数: {}", valid_rows.len());
    order_repository::upsert_orders(pool, &valid_rows).await
}