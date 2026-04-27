import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

interface Employee {
  id: number;
  name: string;
  group: string;
  grade: string;
  monthly_budget1: number;
  monthly_budget2: number;
  monthly_budget3: number;
  monthly_budget4: number;
  monthly_budget5: number;
  monthly_budget6: number;
  monthly_budget7: number;
  monthly_budget8: number;
  monthly_budget9: number;
  monthly_budget10: number;
  monthly_budget11: number;
  monthly_budget12: number;
}

interface Row {
  tempId: number;
  name: string;
  group: string;
  grade: string;
  monthly_budget1: number;
  monthly_budget2: number;
  monthly_budget3: number;
  monthly_budget4: number;
  monthly_budget5: number;
  monthly_budget6: number;
  monthly_budget7: number;
  monthly_budget8: number;
  monthly_budget9: number;
  monthly_budget10: number;
  monthly_budget11: number;
  monthly_budget12: number;
}

// 表示ラベル: 会計年度順（4月〜3月）
const MONTH_ORDER = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3] as const;
// フィールド: monthly_budget1=4月, monthly_budget2=5月, ..., monthly_budget12=3月
const BUDGET_FIELDS = [
  "monthly_budget1", "monthly_budget2", "monthly_budget3", "monthly_budget4",
  "monthly_budget5", "monthly_budget6", "monthly_budget7", "monthly_budget8",
  "monthly_budget9", "monthly_budget10", "monthly_budget11", "monthly_budget12",
] as const satisfies (keyof Row)[];

let nextTempId = 0;

function emptyRow(): Row {
  return {
    tempId: nextTempId++,
    name: "", group: "", grade: "",
    monthly_budget1: 0, monthly_budget2: 0, monthly_budget3: 0,
    monthly_budget4: 0, monthly_budget5: 0, monthly_budget6: 0,
    monthly_budget7: 0, monthly_budget8: 0, monthly_budget9: 0,
    monthly_budget10: 0, monthly_budget11: 0, monthly_budget12: 0,
  };
}

function employeeToRow(e: Employee): Row {
  return {
    tempId: nextTempId++,
    name: e.name, group: e.group, grade: e.grade,
    monthly_budget1: e.monthly_budget1, monthly_budget2: e.monthly_budget2,
    monthly_budget3: e.monthly_budget3, monthly_budget4: e.monthly_budget4,
    monthly_budget5: e.monthly_budget5, monthly_budget6: e.monthly_budget6,
    monthly_budget7: e.monthly_budget7, monthly_budget8: e.monthly_budget8,
    monthly_budget9: e.monthly_budget9, monthly_budget10: e.monthly_budget10,
    monthly_budget11: e.monthly_budget11, monthly_budget12: e.monthly_budget12,
  };
}

// CSV列順: name,group,grade,4月予算,5月予算,...,3月予算（会計年度順）
const CSV_HEADER = ["社員名", "グループ", "グレード", ...MONTH_ORDER.map((m) => `${m}月予算`)].join(",");

async function downloadCSVTemplate() {
  const path = await save({
    defaultPath: "employees_template.csv",
    filters: [{ name: "CSV", extensions: ["csv"] }],
  });
  if (!path) return;
  const bom = "\uFEFF";
  await writeTextFile(path, bom + CSV_HEADER + "\n");
}

async function exportCSV(rows: Row[]) {
  const path = await save({
    defaultPath: "employees.csv",
    filters: [{ name: "CSV", extensions: ["csv"] }],
  });
  if (!path) return;
  const bom = "\uFEFF";
  const lines = rows.map((r) =>
    [r.name, r.group, r.grade, ...BUDGET_FIELDS.map((f) => r[f])].join(",")
  );
  await writeTextFile(path, bom + CSV_HEADER + "\n" + lines.join("\n") + "\n");
}

function parseCSV(rawText: string): { rows: Row[]; error: string | null } {
  const text = rawText.replace(/^\uFEFF/, ""); // BOM除去
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  // ヘッダー行をスキップ（1列目が「社員名」の場合）
  const dataLines = lines[0]?.split(",")[0].trim() === "社員名" ? lines.slice(1) : lines;
  const rows: Row[] = [];
  for (let i = 0; i < dataLines.length; i++) {
    const cols = dataLines[i].split(",").map((c) => c.trim());
    if (cols.length < 3) {
      return { rows: [], error: `${i + 1}行目: 列数が不足しています（社員名,グループ,グレード[,4月予算〜3月予算]）` };
    }
    const [name, group, grade, ...budgets] = cols;
    if (!name || !group || !grade) {
      return { rows: [], error: `${i + 1}行目: 社員名・グループ・グレードは必須です` };
    }
    const row = emptyRow();
    row.name = name;
    row.group = group;
    row.grade = grade;
    // budgets列はMONTH_ORDER順（4,5,...,3）で対応
    BUDGET_FIELDS.forEach((field, idx) => {
      row[field] = budgets[idx] ? (Number(budgets[idx]) || 0) : 0;
    });
    rows.push(row);
  }
  return { rows, error: null };
}

export default function EmployeeManagement() {
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const lastRowRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await invoke<Employee[]>("get_employees");
      setRows(data.map(employeeToRow));
    } catch (err) {
      setMessage({ type: "error", text: String(err) });
    }
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
    setTimeout(() => lastRowRef.current?.focus(), 0);
  }

  function deleteRow(tempId: number) {
    setRows((prev) => prev.filter((r) => r.tempId !== tempId));
  }

  function updateText(tempId: number, field: "name" | "group" | "grade", value: string) {
    setRows((prev) => prev.map((r) => r.tempId === tempId ? { ...r, [field]: value } : r));
  }

  function updateBudget(tempId: number, field: typeof BUDGET_FIELDS[number], value: string) {
    setRows((prev) => prev.map((r) => r.tempId === tempId ? { ...r, [field]: Number(value) || 0 } : r));
  }

  function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { rows: newRows, error } = parseCSV(text);
      if (error) {
        setMessage({ type: "error", text: `CSV取込エラー: ${error}` });
      } else {
        setRows(newRows);
        setMessage({ type: "success", text: `${newRows.length}件を読み込みました。内容を確認して「更新」を押してください。` });
      }
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  }

  async function handleSave() {
    const invalid = rows.some((r) => !r.name.trim() || !r.group.trim() || !r.grade.trim());
    if (invalid) {
      setMessage({ type: "error", text: "全行の社員名・グループ・グレードを入力してください。" });
      return;
    }
    setMessage(null);
    setSaving(true);
    try {
      await invoke("update_employees", {
        employees: rows.map((r) => ({
          name: r.name.trim(),
          group: r.group.trim(),
          grade: r.grade.trim(),
          monthly_budget1: r.monthly_budget1,
          monthly_budget2: r.monthly_budget2,
          monthly_budget3: r.monthly_budget3,
          monthly_budget4: r.monthly_budget4,
          monthly_budget5: r.monthly_budget5,
          monthly_budget6: r.monthly_budget6,
          monthly_budget7: r.monthly_budget7,
          monthly_budget8: r.monthly_budget8,
          monthly_budget9: r.monthly_budget9,
          monthly_budget10: r.monthly_budget10,
          monthly_budget11: r.monthly_budget11,
          monthly_budget12: r.monthly_budget12,
        })),
      });
      setMessage({ type: "success", text: "更新しました。" });
      await load();
    } catch (err) {
      setMessage({ type: "error", text: String(err) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2>社員管理</h2>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>社員一覧</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={handleCSVImport}
            />
            <button className="btn btn-secondary" onClick={() => downloadCSVTemplate()}>
              レイアウト出力
            </button>
            <button className="btn btn-secondary" onClick={() => exportCSV(rows)}>
              CSV出力
            </button>
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
              CSV取込
            </button>
            <button className="btn btn-secondary" onClick={addRow}>
              ＋ 行追加
            </button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "更新中..." : "更新"}
            </button>
          </div>
        </div>

        {message && (
          <p className={message.type === "error" ? "msg-error" : "msg-success"} style={{ marginBottom: 8 }}>
            {message.text}
          </p>
        )}

        <div style={{ overflowX: "auto" }}>
          <table style={{ minWidth: 1400 }}>
            <thead>
              <tr>
                <th>社員名</th>
                <th>グループ</th>
                <th>グレード</th>
                {MONTH_ORDER.map((m, i) => (
                  <th key={i} style={{ minWidth: 80 }}>{m}月予算</th>
                ))}
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr className="empty-row">
                  <td colSpan={16}>社員が登録されていません</td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={row.tempId}>
                    <td>
                      <input
                        ref={i === rows.length - 1 ? lastRowRef : undefined}
                        type="text"
                        value={row.name}
                        onChange={(e) => updateText(row.tempId, "name", e.target.value)}
                        placeholder="山田 太郎"
                        style={{ width: "100%", boxSizing: "border-box" }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={row.group}
                        onChange={(e) => updateText(row.tempId, "group", e.target.value)}
                        placeholder="営業1部"
                        style={{ width: "100%", boxSizing: "border-box" }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={row.grade}
                        onChange={(e) => updateText(row.tempId, "grade", e.target.value)}
                        placeholder="A"
                        style={{ width: "100%", boxSizing: "border-box" }}
                      />
                    </td>
                    {BUDGET_FIELDS.map((field) => (
                      <td key={field}>
                        <input
                          type="number"
                          value={row[field]}
                          onChange={(e) => updateBudget(row.tempId, field, e.target.value)}
                          style={{ width: "100%", boxSizing: "border-box" }}
                        />
                      </td>
                    ))}
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="btn btn-danger"
                        style={{ padding: "4px 10px", fontSize: 12 }}
                        onClick={() => deleteRow(row.tempId)}
                      >
                        削除
                      </button>
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
