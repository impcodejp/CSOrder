use crate::model::report::CsMemberOrderSummary;
use crate::repository::report_repository;
use crate::repository::order_repository;

/// from, to は画面上の月番号（4月=4, 5月=5, …, 3月=3）
/// DB では 4月=1, 5月=2, …, 3月=12 として保持しているため変換する
pub async fn get_report(
    pool: &sqlx::SqlitePool,
    from: i64,
    to: i64,
) -> Result<Vec<CsMemberOrderSummary>, String> {
    let nfrom = ((from - 4 + 12) % 12) + 1;
    let nto   = ((to   - 4 + 12) % 12) + 1;
    if nfrom > nto {
        return Err(format!("開始月 (from={from}) は終了月 (to={to}) より前でなければなりません"));
    }
    order_repository::update_order_month_int(pool).await?;
    report_repository::get_report(pool, nfrom, nto).await
}
