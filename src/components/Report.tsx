import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface ReportRow {
  staff_name: string;
  count: number;
  total_amount: number;
  total_gross_profit: number;
}

const fmt = (n: number) => n.toLocaleString("ja-JP");

export default function Report() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await invoke<ReportRow[]>("get_report");
      setRows(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  const totals = rows.reduce(
    (acc, r) => ({
      count:  acc.count  + r.count,
      amount: acc.amount + r.total_amount,
      profit: acc.profit + r.total_gross_profit,
    }),
    { count: 0, amount: 0, profit: 0 }
  );

  return (
    <div>
      <h2>帳票</h2>

      <div className="card">
        <div style={{ marginBottom: 14 }}>
          <button className="btn btn-secondary" onClick={load} disabled={loading}>
            更新
          </button>
        </div>

        {error && <p className="msg-error">{error}</p>}

        {loading ? (
          <p className="msg-info">読み込み中...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>受注者名</th>
                  <th className="num">件数</th>
                  <th className="num">合計金額（円）</th>
                  <th className="num">合計粗利（円）</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr className="empty-row">
                    <td colSpan={5}>データがありません</td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.staff_name}>
                      <td>{r.staff_name}</td>
                      <td className="num">{fmt(r.count)}</td>
                      <td className="num">{fmt(r.total_amount)}</td>
                      <td className="num">{fmt(r.total_gross_profit)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr>
                    <td>合計</td>
                    <td className="num">{fmt(totals.count)}</td>
                    <td className="num">{fmt(totals.amount)}</td>
                    <td className="num">{fmt(totals.profit)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
