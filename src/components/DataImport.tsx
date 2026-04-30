import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
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
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<OrderPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function handleSelectFile() {
    const selected = await open({
      multiple: false,
      filters: [{ name: "CSV", extensions: ["csv"] }],
    });
    if (!selected) return;

    const path = selected as string;
    const name = path.split(/[\\/]/).pop() ?? path;

    setFilePath(path);
    setFileName(name);
    setPreview([]);
    setMessage(null);

    try {
      setLoading(true);
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
          <button
            className={`${ui.btn} ${ui.btnPrimary}`}
            onClick={handleSelectFile}
            disabled={loading}
          >
            CSVファイルを選択
          </button>
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
          </>
        )}

        {filePath && (
          <button
            className={`${ui.btn} ${ui.btnSuccess}`}
            onClick={handleImport}
            disabled={loading || preview.length === 0}
          >
            インポート実行
          </button>
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
