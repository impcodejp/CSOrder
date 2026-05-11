use crate::model::month_edit::MonthEdit;
use crate::repository::month_edit_repository;

pub async fn get_month_edit(
    pool: &sqlx::SqlitePool
) -> Result<Vec<MonthEdit>, String> {
    month_edit_repository::get_month_edit(pool).await
}

pub async fn update_month_edit(
    pool: &sqlx::SqlitePool,
    rows: Vec<MonthEdit>
) -> Result<(), String> {
    // インデックスが必要な場合は .iter().enumerate() が便利です
    for (i, row) in rows.iter().enumerate() {
        if i > 0 {
            // as_deref() と unwrap_or を使うと、Option<String> を &str として安全に取得できます
            let now_date = row.end_month_date.as_deref().unwrap_or("1990/12/31");
            let allow_date = rows[i - 1].end_month_date.as_deref().unwrap_or("1990/12/31");

            // 日付が昇順（新しい月ほど未来の日付）になっているかチェック
            if now_date <= allow_date {
                return Err(format!(
                    "nmonth {}: 日付 {} は、前の月(nmonth {}) の日付 {} より前の日付に設定できません。",
                    row.nmonth, now_date, rows[i-1].nmonth, allow_date
                ));
            }
        }
        println!("Updating nmonth {} with end_month_date {:?}", row.nmonth, row.end_month_date);
    }

    month_edit_repository::update_month_edit(pool, rows).await
}