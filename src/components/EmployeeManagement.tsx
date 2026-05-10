import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import ui from "../styles/ui.module.css";

interface Employee {
  id: number;
  employeeCode: number;
  name: string;
  group: string;
  grade: string;
  monthlyBudget1: number;
  monthlyBudget2: number;
  monthlyBudget3: number;
  monthlyBudget4: number;
  monthlyBudget5: number;
  monthlyBudget6: number;
  monthlyBudget7: number;
  monthlyBudget8: number;
  monthlyBudget9: number;
  monthlyBudget10: number;
  monthlyBudget11: number;
  monthlyBudget12: number;
}

interface Row {
  tempId: number;
  employeeCode: number;
  name: string;
  group: string;
  grade: string;
  monthlyBudget1: number;
  monthlyBudget2: number;
  monthlyBudget3: number;
  monthlyBudget4: number;
  monthlyBudget5: number;
  monthlyBudget6: number;
  monthlyBudget7: number;
  monthlyBudget8: number;
  monthlyBudget9: number;
  monthlyBudget10: number;
  monthlyBudget11: number;
  monthlyBudget12: number;
}

// 表示ラベル: 会計年度順（4月〜3月）
const MONTH_ORDER = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3] as const;
// フィールド: monthlyBudget1=4月, monthlyBudget2=5月, ..., monthlyBudget12=3月
const BUDGET_FIELDS = [
  "monthlyBudget1", "monthlyBudget2", "monthlyBudget3", "monthlyBudget4",
  "monthlyBudget5", "monthlyBudget6", "monthlyBudget7", "monthlyBudget8",
  "monthlyBudget9", "monthlyBudget10", "monthlyBudget11", "monthlyBudget12",
] as const satisfies (keyof Row)[];

// CSV列順: 社員番号,社員名,グループ,グレード,4月予算〜3月予算
const CSV_HEADER = ["社員番号", "社員名", "グループ", "グレード", ...MONTH_ORDER.map((m) => `${m}月予算`)].join(",");

let nextTempId = 0;

function emptyRow(): Row {
  return {
    tempId: nextTempId++,
    employeeCode: 0,
    name: "", group: "", grade: "",
    monthlyBudget1: 0, monthlyBudget2: 0, monthlyBudget3: 0,
    monthlyBudget4: 0, monthlyBudget5: 0, monthlyBudget6: 0,
    monthlyBudget7: 0, monthlyBudget8: 0, monthlyBudget9: 0,
    monthlyBudget10: 0, monthlyBudget11: 0, monthlyBudget12: 0,
  };
}

function employeeToRow(e: Employee): Row {
  return {
    tempId: nextTempId++,
    employeeCode: e.employeeCode,
    name: e.name, group: e.group, grade: e.grade,
    monthlyBudget1: e.monthlyBudget1, monthlyBudget2: e.monthlyBudget2,
    monthlyBudget3: e.monthlyBudget3, monthlyBudget4: e.monthlyBudget4,
    monthlyBudget5: e.monthlyBudget5, monthlyBudget6: e.monthlyBudget6,
    monthlyBudget7: e.monthlyBudget7, monthlyBudget8: e.monthlyBudget8,
    monthlyBudget9: e.monthlyBudget9, monthlyBudget10: e.monthlyBudget10,
    monthlyBudget11: e.monthlyBudget11, monthlyBudget12: e.monthlyBudget12,
  };
}

async function downloadCSVTemplate() {
  const path = await save({
    defaultPath: "employees_template.csv",
    filters: [{ name: "CSV", extensions: ["csv"] }],
  });
  if (!path) return;
  await writeTextFile(path, "\uFEFF" + CSV_HEADER + "\n");
}

async function exportCSV(rows: Row[]) {
  const path = await save({
    defaultPath: "employees.csv",
    filters: [{ name: "CSV", extensions: ["csv"] }],
  });
  if (!path) return;
  const lines = rows.map((r) =>
    [r.employeeCode, r.name, r.group, r.grade, ...BUDGET_FIELDS.map((f) => r[f])].join(",")
  );
  await writeTextFile(path, "\uFEFF" + CSV_HEADER + "\n" + lines.join("\n") + "\n");
}

function parseCSV(rawText: string): { rows: Row[]; error: string | null } {
  const text = rawText.replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  const dataLines = lines[0]?.split(",")[0].trim() === "社員番号" ? lines.slice(1) : lines;
  const rows: Row[] = [];
  for (let i = 0; i < dataLines.length; i++) {
    const cols = dataLines[i].split(",").map((c) => c.trim());
    if (cols.length < 4) {
      return { rows: [], error: `${i + 1}行目: 列数が不足しています（社員番号,社員名,グループ,グレード[,4月予算〜3月予算]）` };
    }
    const [employeeCodeStr, name, group, grade, ...budgets] = cols;
    const employeeCode = Number(employeeCodeStr);
    if (!employeeCodeStr || isNaN(employeeCode) || employeeCode <= 0) {
      return { rows: [], error: `${i + 1}行目: 社員番号は1以上の数値で入力してください` };
    }
    if (!name || !group || !grade) {
      return { rows: [], error: `${i + 1}行目: 社員名・グループ・グレードは必須です` };
    }
    const row = emptyRow();
    row.employeeCode = employeeCode;
    row.name = name; row.group = group; row.grade = grade;
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

  function updateNumber(tempId: number, field: "employeeCode" | typeof BUDGET_FIELDS[number], value: string) {
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
    const invalid = rows.some(
      (r) => !r.name.trim() || !r.group.trim() || !r.grade.trim() || r.employeeCode <= 0
    );
    if (invalid) {
      setMessage({ type: "error", text: "全行の社員番号・社員名・グループ・グレードを入力してください。" });
      return;
    }
    setMessage(null);
    setSaving(true);
    try {
      await invoke("update_employees", {
        employees: rows.map((r) => ({
          employeeCode: r.employeeCode,
          name: r.name.trim(),
          group: r.group.trim(),
          grade: r.grade.trim(),
          monthlyBudget1:  r.monthlyBudget1,  monthlyBudget2:  r.monthlyBudget2,
          monthlyBudget3:  r.monthlyBudget3,  monthlyBudget4:  r.monthlyBudget4,
          monthlyBudget5:  r.monthlyBudget5,  monthlyBudget6:  r.monthlyBudget6,
          monthlyBudget7:  r.monthlyBudget7,  monthlyBudget8:  r.monthlyBudget8,
          monthlyBudget9:  r.monthlyBudget9,  monthlyBudget10: r.monthlyBudget10,
          monthlyBudget11: r.monthlyBudget11, monthlyBudget12: r.monthlyBudget12,
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

      <div className={ui.card}>
        <div className={ui.cardHeader}>
          <h3 style={{ margin: 0 }}>社員一覧</h3>
          <div className={ui.toolbar}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={handleCSVImport}
            />
            <button className={`${ui.btn} ${ui.btnSecondary}`} onClick={() => downloadCSVTemplate()}>
              レイアウト出力
            </button>
            <button className={`${ui.btn} ${ui.btnSecondary}`} onClick={() => exportCSV(rows)}>
              CSV出力
            </button>
            <button className={`${ui.btn} ${ui.btnSecondary}`} onClick={() => fileInputRef.current?.click()}>
              CSV取込
            </button>
            <button className={`${ui.btn} ${ui.btnSecondary}`} onClick={addRow}>
              ＋ 行追加
            </button>
            <button className={`${ui.btn} ${ui.btnPrimary}`} onClick={handleSave} disabled={saving}>
              {saving ? "更新中..." : "更新"}
            </button>
          </div>
        </div>
        <h3>※予算は千円単位での入力</h3>

        {message && (
          <p className={message.type === "error" ? ui.msgError : ui.msgSuccess} style={{ marginBottom: 12 }}>
            {message.text}
          </p>
        )}

        <div className={ui.tableWrap}>
          <table style={{ minWidth: 1400 }}>
            <thead>
              <tr>
                <th style={{ minWidth: 120 }}>社員番号</th>
                <th style={{ minWidth: 120 }}>社員名</th>
                <th style={{ minWidth: 150 }}>グループ</th>
                <th>グレード</th>
                {MONTH_ORDER.map((m, i) => (
                  <th key={i} className={`${ui.num} ${ui.budgetCell}`} style={{ minWidth: 75 }}>{m}月予算</th>
                ))}
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr className={ui.emptyRow}>
                  <td colSpan={17}>社員が登録されていません</td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={row.tempId}>
                    <td>
                      <input
                        ref={i === rows.length - 1 ? lastRowRef : undefined}
                        type="number"
                        value={row.employeeCode || ""}
                        onChange={(e) => updateNumber(row.tempId, "employeeCode", e.target.value)}
                        placeholder="12345"
                        style={{ width: "100%", textAlign: "right" }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => updateText(row.tempId, "name", e.target.value)}
                        placeholder="山田 太郎"
                        style={{ width: "100%" }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={row.group}
                        onChange={(e) => updateText(row.tempId, "group", e.target.value)}
                        placeholder="営業1部"
                        style={{ width: "100%" }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={row.grade}
                        onChange={(e) => updateText(row.tempId, "grade", e.target.value)}
                        placeholder="A"
                        style={{ width: "100%" }}
                      />
                    </td>
                    {BUDGET_FIELDS.map((field) => (
                      <td key={field} className={ui.budgetCell}>
                        <input
                          type="number"
                          value={row[field]}
                          onChange={(e) => updateNumber(row.tempId, field, e.target.value)}
                          style={{ width: "100%", textAlign: "right" }}
                        />
                      </td>
                    ))}
                    <td style={{ textAlign: "center" }}>
                      <button
                        className={`${ui.btn} ${ui.btnDanger}`}
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
