import { useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

interface OrderPreview {
  staff_name: string;
  amount: number;
  gross_profit: number;
  project_name: string;
  client_name: string;
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

      <div className="card">
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <label className="btn btn-primary" style={{ cursor: "pointer" }}>
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
            <div className="table-wrap" style={{ marginBottom: 16 }}>
              <table>
                <thead>
                  <tr>
                    <th>受注者名</th>
                    <th className="num">金額（円）</th>
                    <th className="num">粗利（円）</th>
                    <th>案件名</th>
                    <th>顧客名</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>
                      <td>{row.staff_name}</td>
                      <td className="num">{fmt(row.amount)}</td>
                      <td className="num">{fmt(row.gross_profit)}</td>
                      <td>{row.project_name}</td>
                      <td>{row.client_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="btn btn-success" onClick={handleImport} disabled={loading}>
              インポート実行
            </button>
          </>
        )}

        {message && (
          <p className={message.type === "error" ? "msg-error" : "msg-success"}>
            {message.text}
          </p>
        )}
        {loading && <p className="msg-info">処理中...</p>}
      </div>
    </div>
  );
}
