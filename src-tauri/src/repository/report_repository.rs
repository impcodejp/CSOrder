use sqlx::SqlitePool;
use crate::model::report::CsMemberOrderSummary;

/// nfrom, nto は DB上の月番号（4月=1, 5月=2, …, 3月=12）
pub async fn get_report(
    pool: &SqlitePool,
    nfrom: i64,
    nto: i64,
) -> Result<Vec<CsMemberOrderSummary>, String> {
    sqlx::query_as::<_, CsMemberOrderSummary>(
        r#"
        SELECT
            e.name                                                              AS cs_name,
            e."group"                                                           AS "group",
            e.grade,
            COALESCE(COUNT(o.id), 0)                                           AS project_count,
            COALESCE(SUM(o.amount), 0)                                         AS amount,
            COALESCE(SUM(o.gross_profit), 0)                                   AS gross_profit,
            COALESCE(b_sum.sum_budget, 0)                                      AS bugget
        FROM employees e
        LEFT JOIN orders o
            ON  o.employee_code    = e.employee_code
            AND o.order_month_int BETWEEN ?2 AND ?3
        LEFT JOIN budget b_month
            ON  b_month.code      = e.employee_code
            AND b_month.month_int = ?1
        LEFT JOIN (
            SELECT code, SUM(budget) AS sum_budget
            FROM   budget
            WHERE  month_int BETWEEN ?2 AND ?3
            GROUP  BY code
        ) b_sum ON b_sum.code = e.employee_code
        GROUP BY e.id, e.name, e."group", e.grade
        ORDER BY e."group", e.name
        "#,
    )
    .bind(nto)   // ?1 : 当月（to）
    .bind(nfrom) // ?2 : 期間 from
    .bind(nto)   // ?3 : 期間 to
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())
}
