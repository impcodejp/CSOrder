import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface Order {
  id: number;
  cs_name: string;
  amount: number;
  gross_profit: number;
  project_name: string;
  client_name: string;
  order_date: string;
}

const fmt = (n: number) => n.toLocaleString("ja-JP");

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [staffFilter, setStaffFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await invoke<Order[]>("get_orders", {
        staffName: staffFilter || null,
        clientName: clientFilter || null,
      });
      setOrders(rows);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [staffFilter, clientFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <h2>受注一覧</h2>

      <div className="card">
        <div className="filter-row">
          <label>
            受注者
            <input
              type="text"
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              placeholder="絞り込み..."
            />
          </label>
          <label>
            顧客名
            <input
              type="text"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              placeholder="絞り込み..."
            />
          </label>
          <button className="btn btn-secondary" onClick={load} disabled={loading}>
            再読み込み
          </button>
        </div>

        {error && <p className="msg-error">{error}</p>}

        {loading ? (
          <p className="msg-info">読み込み中...</p>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 10 }}>
              {orders.length}件
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>受注日</th>
                    <th>受注者名</th>
                    <th>顧客名</th>
                    <th>案件名</th>
                    <th className="num">金額（円）</th>
                    <th className="num">粗利（円）</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr className="empty-row">
                      <td colSpan={6}>データがありません</td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id}>
                        <td>{o.order_date}</td>
                        <td>{o.cs_name}</td>
                        <td>{o.client_name}</td>
                        <td>{o.project_name}</td>
                        <td className="num">{fmt(o.amount)}</td>
                        <td className="num">{fmt(o.gross_profit)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
