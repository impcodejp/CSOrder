import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import ui from "../styles/ui.module.css";

type Tab = "person" | "group";

interface CsMemberOrderSummary {
  csName: string;
  group: string;
  grade: string;
  projectCount: number;
  amount: number;
  grossProfit: number;
  bugget: number;
}

function groupByGroup(data: CsMemberOrderSummary[]) {
  const map = new Map<string, CsMemberOrderSummary[]>();
  for (const row of data) {
    if (!map.has(row.group)) map.set(row.group, []);
    map.get(row.group)!.push(row);
  }
  return map;
}

function calcTotal(data: CsMemberOrderSummary[]) {
  return {
    projectCount:    data.reduce((s, r) => s + r.projectCount, 0),
    amount:          data.reduce((s, r) => s + r.amount, 0),
    grossProfit:     data.reduce((s, r) => s + r.grossProfit, 0),
    bugget:          data.reduce((s, r) => s + r.bugget, 0),
  };
}

function buildGroupSummaries(data: CsMemberOrderSummary[]) {
  const map = groupByGroup(data);
  return Array.from(map.entries()).map(([group, rows]) => ({
    group,
    memberCount: rows.length,
    ...calcTotal(rows),
  }));
}

const fmt = (n: number) => `¥${n.toLocaleString()}`;
const fmtRate = (profit: number, bugget: number) =>
  bugget === 0 ? "—" : `${((profit / bugget) * 100).toFixed(1)}%`;

async function exportPersonCsv(
  data: CsMemberOrderSummary[],
  grouped: Map<string, CsMemberOrderSummary[]>,
  period: string,
) {
  const path = await save({
    defaultPath: `CS受注予実管理表_担当別_${period}.csv`,
    filters: [{ name: "CSV", extensions: ["csv"] }],
  });
  if (!path) return;

  const header = ["名前", "GROUP", "GRADE", `${period}件数`, `${period}売上(千円)`, `${period}粗利(千円)`, `${period}予算(千円)`, `${period}達成率`];
  const lines: string[] = [header.join(",")];

  for (const [group, rows] of grouped.entries()) {
    for (const r of rows) {
      lines.push([r.csName, r.group, r.grade, r.projectCount, r.amount, r.grossProfit, r.bugget, fmtRate(r.grossProfit, r.bugget)].join(","));
    }
    const sub = { projectCount: rows.reduce((s, r) => s + r.projectCount, 0), amount: rows.reduce((s, r) => s + r.amount, 0), grossProfit: rows.reduce((s, r) => s + r.grossProfit, 0), bugget: rows.reduce((s, r) => s + r.bugget, 0) };
    lines.push([`${group} 小計`, "", "", sub.projectCount, sub.amount, sub.grossProfit, sub.bugget, fmtRate(sub.grossProfit, sub.bugget)].join(","));
  }
  const total = { projectCount: data.reduce((s, r) => s + r.projectCount, 0), amount: data.reduce((s, r) => s + r.amount, 0), grossProfit: data.reduce((s, r) => s + r.grossProfit, 0), bugget: data.reduce((s, r) => s + r.bugget, 0) };
  lines.push(["合計", "", "", total.projectCount, total.amount, total.grossProfit, total.bugget, fmtRate(total.grossProfit, total.bugget)].join(","));

  await writeTextFile(path, "\uFEFF" + lines.join("\n") + "\n");
}

async function exportGroupCsv(
  groupSummaries: ReturnType<typeof buildGroupSummaries>,
  groupTotal: { memberCount: number; projectCount: number; amount: number; grossProfit: number; bugget: number },
  period: string,
) {
  const path = await save({
    defaultPath: `CS受注予実管理表_グループ別_${period}.csv`,
    filters: [{ name: "CSV", extensions: ["csv"] }],
  });
  if (!path) return;

  const header = ["グループ", "人数", `${period}件数`, `${period}売上(千円)`, `${period}粗利(千円)`, `${period}予算(千円)`, `${period}達成率`];
  const lines: string[] = [header.join(",")];

  for (const r of groupSummaries) {
    lines.push([r.group, r.memberCount, r.projectCount, r.amount, r.grossProfit, r.bugget, fmtRate(r.grossProfit, r.bugget)].join(","));
  }
  lines.push(["合計", groupTotal.memberCount, groupTotal.projectCount, groupTotal.amount, groupTotal.grossProfit, groupTotal.bugget, fmtRate(groupTotal.grossProfit, groupTotal.bugget)].join(","));

  await writeTextFile(path, "\uFEFF" + lines.join("\n") + "\n");
}

function RateCell({ profit, bugget }: { profit: number; bugget: number }) {
  if (bugget === 0) return <td className={ui.num}>—</td>;
  const pct = (profit / bugget) * 100;
  const cls = pct >= 100 ? ui.rateHigh : pct < 80 ? ui.rateLow : undefined;
  return <td className={`${ui.num}${cls ? ` ${cls}` : ""}`}>{pct.toFixed(1)}%</td>;
}

export default function Report() {
  const [tab, setTab] = useState<Tab>("person");
  const [dateFrom, setDateFrom] = useState("4");
  const [dateTo, setDateTo]     = useState("4");
  const [appliedFrom, setAppliedFrom] = useState("4");
  const [appliedTo, setAppliedTo]     = useState("4");
  const [data, setData] = useState<CsMemberOrderSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (from: string, to: string) => {
    setLoading(true);
    setError("");
    try {
      const rows = await invoke<CsMemberOrderSummary[]>("get_report", {
        from: Number(from),
        to: Number(to),
      });
      setData(rows);
    } catch (err) {
      setError(String(err));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(appliedFrom, appliedTo);
  }, [appliedFrom, appliedTo, load]);

  const grouped = groupByGroup(data);
  const total = calcTotal(data);
  const groupSummaries = buildGroupSummaries(data);
  const groupTotal = {
    memberCount: groupSummaries.reduce((s, r) => s + r.memberCount, 0),
    ...total,
  };
  const period = appliedFrom === appliedTo ? `${appliedFrom}月` : `${appliedFrom}~${appliedTo}月`;

  return (
    <div className={ui.reportPage}>
      <h2>帳票</h2>

      {/* フィルターバー */}
      <div className={ui.filterBar}>
        <label>期間</label>
        <input type="number" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <span className={ui.filterSep}>月 〜</span>
        <input type="number" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <span className={ui.filterSep}>月</span>
        <button
          className={`${ui.btn} ${ui.btnPrimary}`}
          onClick={() => { setAppliedFrom(dateFrom); setAppliedTo(dateTo); }}
          disabled={loading}
        >
          更新
        </button>
        {appliedFrom === appliedTo ? (
          <span>表示中：{appliedFrom} 月</span>
        ) : (
          <span>表示中：{appliedFrom} 月 〜 {appliedTo} 月</span>
        )}
      </div>

      {error && <p className={ui.msgError}>{error}</p>}
      {loading && <p className={ui.msgInfo}>読み込み中...</p>}

      {/* タブ */}
      <div className={ui.tabs}>
        <button
          className={`${ui.tab}${tab === "person" ? ` ${ui.tabActive}` : ""}`}
          onClick={() => setTab("person")}
        >
          担当別
        </button>
        <button
          className={`${ui.tab}${tab === "group" ? ` ${ui.tabActive}` : ""}`}
          onClick={() => setTab("group")}
        >
          グループ集計
        </button>
        <div className={ui.tabActions}>
          {tab === "person" && (
            <button className={`${ui.btn} ${ui.btnSecondary}`} onClick={() => exportPersonCsv(data, grouped, period)} disabled={data.length === 0}>
              CSV出力
            </button>
          )}
          {tab === "group" && (
            <button className={`${ui.btn} ${ui.btnSecondary}`} onClick={() => exportGroupCsv(groupSummaries, groupTotal, period)} disabled={groupSummaries.length === 0}>
              CSV出力
            </button>
          )}
        </div>
      </div>

      {/* 担当別 */}
      {tab === "person" && (
        <div className={ui.reportTableWrap}>
          <span className={ui.unitNote}>（単位：千円）</span>
          <table>
            <thead>
              <tr>
                <th>名前</th>
                <th>GROUP</th>
                <th>GRADE</th>
                { appliedFrom === appliedTo ? (
                  <>
                    <th className={ui.num}>{appliedFrom}月件数</th>
                    <th className={ui.num}>{appliedFrom}月売上</th>
                    <th className={ui.num}>{appliedFrom}月粗利</th>
                    <th className={ui.num}>{appliedFrom}月予算</th>
                    <th className={ui.num}>{appliedFrom}月達成率</th>
                  </>  
                 ) : (
                  <>
                    <th className={ui.num}>{appliedFrom}~{appliedTo}月件数</th>
                    <th className={ui.num}>{appliedFrom}~{appliedTo}月売上</th>
                    <th className={ui.num}>{appliedFrom}~{appliedTo}月粗利</th>
                    <th className={ui.num}>{appliedFrom}~{appliedTo}月予算</th>
                    <th className={ui.num}>{appliedFrom}~{appliedTo}月達成率</th>
                  </>
                 )
              }
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && !loading ? (
                <tr className={ui.emptyRow}>
                  <td colSpan={13}>データがありません</td>
                </tr>
              ) : (
                Array.from(grouped.entries()).map(([group, rows]) => {
                  const sub = calcTotal(rows);
                  return [
                    ...rows.map((row) => (
                      <tr key={row.csName}>
                        <td>{row.csName}</td>
                        <td>{row.group}</td>
                        <td>{row.grade}</td>
                        <td className={ui.num}>{row.projectCount}件</td>
                        <td className={ui.num}>{fmt(row.amount)}</td>
                        <td className={ui.num}>{fmt(row.grossProfit)}</td>
                        <td className={ui.num}>{fmt(row.bugget)}</td>
                        <RateCell profit={row.grossProfit} bugget={row.bugget} />
                      </tr>
                    )),
                    <tr key={`sub-${group}`} className={ui.subtotalRow}>
                      <td colSpan={3}>{group} 小計</td>
                      <td className={ui.num}>{sub.projectCount}件</td>
                      <td className={ui.num}>{fmt(sub.amount)}</td>
                      <td className={ui.num}>{fmt(sub.grossProfit)}</td>
                      <td className={ui.num}>{fmt(sub.bugget)}</td>
                      <RateCell profit={sub.grossProfit} bugget={sub.bugget} />
                    </tr>,
                  ];
                })
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>合計</td>
                <td className={ui.num}>{total.projectCount}</td>
                <td className={ui.num}>{fmt(total.amount)}</td>
                <td className={ui.num}>{fmt(total.grossProfit)}</td>
                <td className={ui.num}>{fmt(total.bugget)}</td>
                <RateCell profit={total.grossProfit} bugget={total.bugget} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* グループ集計 */}
      {tab === "group" && (
        <div className={ui.reportTableWrap}>
          <span className={ui.unitNote}>（単位：千円）</span>
          <table>
            <thead>
              <tr>
                <th>グループ</th>
                <th className={ui.num}>人数</th>
                { appliedFrom === appliedTo ? (
                  <>
                    <th className={ui.num}>{appliedFrom}月件数</th>
                    <th className={ui.num}>{appliedFrom}月売上</th>
                    <th className={ui.num}>{appliedFrom}月粗利</th>
                    <th className={ui.num}>{appliedFrom}月予算</th>
                    <th className={ui.num}>{appliedFrom}月達成率</th>
                  </>
                ) : (
                  <>
                    <th className={ui.num}>{appliedFrom}~{appliedTo}月件数</th>
                    <th className={ui.num}>{appliedFrom}~{appliedTo}月売上</th>
                    <th className={ui.num}>{appliedFrom}~{appliedTo}月粗利</th>
                    <th className={ui.num}>{appliedFrom}~{appliedTo}月予算</th>
                    <th className={ui.num}>{appliedFrom}~{appliedTo}月達成率</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {groupSummaries.length === 0 && !loading ? (
                <tr className={ui.emptyRow}>
                  <td colSpan={12}>データがありません</td>
                </tr>
              ) : (
                groupSummaries.map((row) => (
                  <tr key={row.group}>
                    <td>{row.group}</td>
                    <td className={ui.num}>{row.memberCount}人</td>
                    <td className={ui.num}>{row.projectCount}件</td>
                    <td className={ui.num}>{fmt(row.amount)}</td>
                    <td className={ui.num}>{fmt(row.grossProfit)}</td>
                    <td className={ui.num}>{fmt(row.bugget)}</td>
                    <RateCell profit={row.grossProfit} bugget={row.bugget} />
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td>合計</td>
                <td className={ui.num}>{groupTotal.memberCount}人</td>
                <td className={ui.num}>{groupTotal.projectCount}件</td>
                <td className={ui.num}>{fmt(groupTotal.amount)}</td>
                <td className={ui.num}>{fmt(groupTotal.grossProfit)}</td>
                <td className={ui.num}>{fmt(groupTotal.bugget)}</td>
                <RateCell profit={groupTotal.grossProfit} bugget={groupTotal.bugget} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
