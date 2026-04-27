import { useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import ui from "../styles/ui.module.css";

interface OrderPreview {
  csName: string;
  amount: number;
  grossProfit: number;
  projectName: string;
  clientName: string;
}

const fmt = (n: number) => n.toLocaleString("ja-JP");

export default function DataImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<OrderPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Tauri の webview は File オブジェクトに path プロパティを付与する
    const path = (file as File & { path: string }).path;

    setFilePath(path);
    setFileName(file.name);
    setPreview([]);
    setMessage(null);

    try {
      setLoading(true);
      // バリデーション・パースはバックエンドで実施
      const rows = await invoke<OrderPreview[]>("preview_csv", { path });
      setPreview(rows);
    } catch (err) {
      setMessage({ type: "error", text: String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!filePath || !preview.length) return;
    setLoading(true);
    setMessage(null);
    try {
      const count = await invoke<number>("import_orders", { path: filePath });
      setMessage({ type: "success", text: `${count}件のデータを取り込みました。` });
      setPreview([]);
      setFilePath(null);
      setFileName("");
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setMessage({ type: "error", text: String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>データ取込</h2>

      <div className={ui.card}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <label className={`${ui.btn} ${ui.btnPrimary}`} style={{ cursor: "pointer" }}>
            CSVファイルを選択
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </label>
          {fileName && (
            <span style={{ fontSize: 13, color: "#555" }}>{fileName}</span>
          )}
        </div>

        {preview.length > 0 && (
          <>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 10 }}>
              プレビュー（{preview.length}件）― 内容を確認してからインポートを実行してください
            </p>
            <div className={ui.tableWrap} style={{ marginBottom: 16 }}>
              <table>
                <thead>
                  <tr>
                    <th>受注者名</th>
                    <th className={ui.num}>金額（円）</th>
                    <th className={ui.num}>粗利（円）</th>
                    <th>案件名</th>
                    <th>顧客名</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>
                      <td>{row.csName}</td>
                      <td className={ui.num}>{fmt(row.amount)}</td>
                      <td className={ui.num}>{fmt(row.grossProfit)}</td>
                      <td>{row.projectName}</td>
                      <td>{row.clientName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className={`${ui.btn} ${ui.btnSuccess}`} onClick={handleImport} disabled={loading}>
              インポート実行
            </button>
          </>
        )}

        {message && (
          <p className={message.type === "error" ? ui.msgError : ui.msgSuccess}>
            {message.text}
          </p>
        )}
        {loading && <p className={ui.msgInfo}>処理中...</p>}
      </div>
    </div>
  );
}
