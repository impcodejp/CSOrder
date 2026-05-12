import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import ui from "../styles/ui.module.css";

interface Order {
  id: number;
  csName: string;
  amount: number;
  grossProfit: number;
  projectName: string;
  clientName: string;
  orderDate: string;
}

const fmt = (n: number) => n.toLocaleString("ja-JP");

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [staffFilter, setStaffFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const formatDate = (value: string | null) => {
      if (!value) return null;

      const date = new Date(value);

      // 不正な日付チェック
      if (isNaN(date.getTime())) {
        throw new Error(`日付形式が不正です: ${value}`);
      }

      return date;
    };

    try {
      // Date型へ変換
      const fromDate = formatDate(dateFromFilter);
      const toDate = formatDate(dateToFilter);

      // 開始日 > 終了日 チェック
      if (fromDate && toDate && fromDate > toDate) {
        throw new Error("開始日は終了日以前を指定してください");
      }

      // API用文字列へ変換
      const dateFromStr = fromDate
        ? fromDate.toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        : null;

      const dateToStr = toDate
        ? toDate.toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        : null;

      console.log("APIに渡すフィルタ条件:", {
        csName: staffFilter || null,
        clientName: clientFilter || null,
        dateFrom: dateFromStr,
        dateTo: dateToStr,
      });

      const rows = await invoke<Order[]>("get_orders", {
        csName: staffFilter || null,
        clientName: clientFilter || null,
        dateFrom: dateFromStr,
        dateTo: dateToStr,
      });

      setOrders(rows);

    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [
    staffFilter,
    clientFilter,
    dateFromFilter,
    dateToFilter,
  ]);

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h2>受注一覧</h2>

      <div className={ui.card}>
        <div className={ui.filterRow}>
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
          <label>
            受注日(自)
            <input
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
            />
          </label>
          <label>
            受注日(至)
            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
            />
          </label>
          <button className={`${ui.btn} ${ui.btnSecondary}`} onClick={load} disabled={loading}>
            絞込
          </button>
        </div>

        {error && <p className={ui.msgError}>{error}</p>}
        {loading && <p className={ui.msgInfo}>読み込み中...</p>}

        {!loading && (
          <>
            <p style={{ fontSize: 12, color: "var(--clr-text-3)", marginBottom: 12 }}>
              {orders.length} 件
            </p>
            <div className={ui.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>受注日</th>
                    <th>受注者名</th>
                    <th>顧客名</th>
                    <th>案件名</th>
                    <th className={ui.num}>金額（千円）</th>
                    <th className={ui.num}>粗利（千円）</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr className={ui.emptyRow}>
                      <td colSpan={6}>データがありません</td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id}>
                        <td>{o.orderDate}</td>
                        <td>{o.csName}</td>
                        <td>{o.clientName}</td>
                        <td>{o.projectName}</td>
                        <td className={ui.num}>{fmt(o.amount)}</td>
                        <td className={ui.num}>{fmt(o.grossProfit)}</td>
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
