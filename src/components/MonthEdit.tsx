import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import ui from "../styles/ui.module.css";

type DbMonthRow = {
  nmonth: number;
  endMonthDate: string;
};

type MonthRow = {
  nmonth: number;
  label: string;
  endMonthDate: string;
};

const MONTH_LABELS: Record<number, string> = {
  0: "前期末",
  1: "4月",
  2: "5月",
  3: "6月",
  4: "7月",
  5: "8月",
  6: "9月",
  7: "10月",
  8: "11月",
  9: "12月",
  10: "1月",
  11: "2月",
  12: "3月",
};

/**
 * DBから取得したデータを画面表示用に変換する
 * DBの yyyy/mm/dd 形式を input[type="date"] 用の yyyy-mm-dd に置換します
 */
function normalizeRows(db: DbMonthRow[]): MonthRow[] {
  const map = new Map<number, string>();
  db.forEach((r) => {
    // DBから来たスラッシュ区切りをハイフン区切りに変換
    const formattedDate = r.endMonthDate ? r.endMonthDate.replace(/\//g, "-") : "";
    map.set(r.nmonth, formattedDate);
  });

  const rows: MonthRow[] = [];
  for (let n = 0; n <= 12; n++) {
    rows.push({
      nmonth: n,
      label: MONTH_LABELS[n] ?? `${n}`,
      endMonthDate: map.get(n) ?? "",
    });
  }
  return rows;
}

// ざっくり日付形式チェック（input[type="date"] を使う場合はブラウザ側でも制限されます）
function isValidDateOrEmpty(s: string) {
  if (!s) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export default function MonthEdit() {
  const [rows, setRows] = useState<MonthRow[]>([]);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setMessage(null);
    try {
      // Rust側: get_month_edit を呼び出し
      const data = await invoke<DbMonthRow[]>("get_month_edit");
      setRows(normalizeRows(data));
    } catch (err) {
      setMessage({ type: "error", text: String(err) });
    }
  }

  function updateEndDate(nmonth: number, value: string) {
    setRows((prev) =>
      prev.map((r) => (r.nmonth === nmonth ? { ...r, endMonthDate: value } : r))
    );
  }

  async function handleSave() {
    // バリデーション
    const invalid = rows.some((r) => !isValidDateOrEmpty(r.endMonthDate));
    if (invalid) {
      setMessage({ type: "error", text: "日付を正しく入力してください。" });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      // Rust側へ送る前にフォーマットを yyyy-mm-dd -> yyyy/mm/dd に変換する
      const payload: DbMonthRow[] = rows.map((r) => ({
        nmonth: r.nmonth,
        endMonthDate: (r.endMonthDate ?? "").trim().replace(/-/g, "/"),
      }));

      // Rust側: update_month_edit を呼び出し
      await invoke("update_month_edit", { rows: payload });
      setMessage({ type: "success", text: "更新しました。" });
      
      // 再読み込みして最新の状態を反映
      await load();
    } catch (err) {
      setMessage({ type: "error", text: String(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2>営業月度管理</h2>

      <div className={ui.card}>
        <div className={ui.cardHeader}>
          <h3 style={{ margin: 0 }}>営業月度修正</h3>
          <div className={ui.toolbar}>
            <button className={`${ui.btn} ${ui.btnSecondary}`} onClick={load} disabled={saving}>
              再読込
            </button>
            <button className={`${ui.btn} ${ui.btnPrimary}`} onClick={handleSave} disabled={saving}>
              {saving ? "更新中..." : "更新"}
            </button>
          </div>
        </div>

        {message && (
          <p className={message.type === "error" ? ui.msgError : ui.msgSuccess} style={{ marginBottom: 12 }}>
            {message.text}
          </p>
        )}

        <div className={ui.tableWrap}>
          <table style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ minWidth: 120 }}>営業月度</th>
                <th style={{ minWidth: 180 }}>月度末日付</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr className={ui.emptyRow}>
                  <td colSpan={2}>データを読み込み中、または登録がありません</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.nmonth}>
                    <td>{row.label}</td>
                    <td>
                      <input
                        type="date"
                        value={row.endMonthDate}
                        onChange={(e) => updateEndDate(row.nmonth, e.target.value)}
                        style={{ width: "100%" }}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}