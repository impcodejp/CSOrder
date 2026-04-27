import { useState } from "react";
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
  projectCountSum: number;
  amountSum: number;
  grossProfitSum: number;
  buggetSum: number;
}

const CSMENBERORDERSUMMARYS: CsMemberOrderSummary[] = [
  { csName: "青山 健太",   group: "1G",       grade: "G4", projectCount: 5,  amount: 3200000, grossProfit: 960000,  bugget: 3500000, projectCountSum: 12, amountSum: 8100000,  grossProfitSum: 2430000, buggetSum: 10500000 },
  { csName: "中村 彩香",   group: "1G",       grade: "G3", projectCount: 3,  amount: 1850000, grossProfit: 555000,  bugget: 2000000, projectCountSum: 8,  amountSum: 4900000,  grossProfitSum: 1470000, buggetSum: 6000000  },
  { csName: "林 大輔",     group: "1G",       grade: "G2", projectCount: 4,  amount: 2100000, grossProfit: 630000,  bugget: 2200000, projectCountSum: 9,  amountSum: 5300000,  grossProfitSum: 1590000, buggetSum: 6600000  },
  { csName: "西田 麻衣",   group: "2G",       grade: "G4", projectCount: 6,  amount: 4500000, grossProfit: 1350000, bugget: 4800000, projectCountSum: 15, amountSum: 11200000, grossProfitSum: 3360000, buggetSum: 14400000 },
  { csName: "福田 雄一",   group: "2G",       grade: "G3", projectCount: 4,  amount: 2800000, grossProfit: 840000,  bugget: 3000000, projectCountSum: 10, amountSum: 7100000,  grossProfitSum: 2130000, buggetSum: 9000000  },
  { csName: "岡本 真由",   group: "2G",       grade: "G2", projectCount: 2,  amount: 980000,  grossProfit: 294000,  bugget: 1200000, projectCountSum: 5,  amountSum: 2400000,  grossProfitSum: 720000,  buggetSum: 3600000  },
  { csName: "松井 翔太",   group: "3G",       grade: "M1", projectCount: 8,  amount: 6200000, grossProfit: 1860000, bugget: 6500000, projectCountSum: 20, amountSum: 15800000, grossProfitSum: 4740000, buggetSum: 19500000 },
  { csName: "高橋 さくら", group: "3G",       grade: "G4", projectCount: 5,  amount: 3400000, grossProfit: 1020000, bugget: 3600000, projectCountSum: 13, amountSum: 8600000,  grossProfitSum: 2580000, buggetSum: 10800000 },
  { csName: "小林 誠",     group: "営業支援G", grade: "M2", projectCount: 10, amount: 8500000, grossProfit: 9000000, bugget: 9000000, projectCountSum: 26, amountSum: 21500000, grossProfitSum: 6450000, buggetSum: 27000000 },
  { csName: "渡辺 千尋",   group: "営業支援G", grade: "M1", projectCount: 7,  amount: 5300000, grossProfit: 1590000, bugget: 5500000, projectCountSum: 18, amountSum: 13400000, grossProfitSum: 16500000 , buggetSum: 16500000 },
];

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
    projectCountSum: data.reduce((s, r) => s + r.projectCountSum, 0),
    amountSum:       data.reduce((s, r) => s + r.amountSum, 0),
    grossProfitSum:  data.reduce((s, r) => s + r.grossProfitSum, 0),
    buggetSum:       data.reduce((s, r) => s + r.buggetSum, 0),
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

function RateCell({ profit, bugget }: { profit: number; bugget: number }) {
  if (bugget === 0) return <td className={ui.num}>—</td>;
  const pct = (profit / bugget) * 100;
  const cls = pct >= 100 ? ui.rateHigh : pct < 80 ? ui.rateLow : undefined;
  return <td className={`${ui.num}${cls ? ` ${cls}` : ""}`}>{pct.toFixed(1)}%</td>;
}

export default function Report() {
  const [tab, setTab] = useState<Tab>("person");
  const [dateFrom, setDateFrom] = useState("2026-01");
  const [dateTo, setDateTo]     = useState("2026-04");
  const [appliedFrom, setAppliedFrom] = useState("2026-01");
  const [appliedTo, setAppliedTo]     = useState("2026-04");

  const data = CSMENBERORDERSUMMARYS;
  const grouped = groupByGroup(data);
  const total = calcTotal(data);
  const groupSummaries = buildGroupSummaries(data);
  const groupTotal = {
    memberCount: groupSummaries.reduce((s, r) => s + r.memberCount, 0),
    ...total,
  };

  return (
    <div className={ui.reportPage}>
      <h2>帳票</h2>

      {/* フィルターバー */}
      <div className={ui.filterBar}>
        <label>期間</label>
        <input type="month" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <span className={ui.filterSep}>〜</span>
        <input type="month" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        <button
          className={`${ui.btn} ${ui.btnPrimary}`}
          onClick={() => { setAppliedFrom(dateFrom); setAppliedTo(dateTo); }}
        >
          更新
        </button>
        <span>表示中：{appliedFrom} 〜 {appliedTo}</span>
      </div>

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
      </div>

      {/* 担当別 */}
      {tab === "person" && (
        <div className={ui.reportTableWrap}>
          <table>
            <thead>
              <tr>
                <th>名前</th>
                <th>GROUP</th>
                <th>GRADE</th>
                <th className={ui.num}>単月件数</th>
                <th className={ui.num}>単月売上</th>
                <th className={ui.num}>単月粗利</th>
                <th className={ui.num}>単月予算</th>
                <th className={ui.num}>単月達成率</th>
                <th className={ui.num}>累計件数</th>
                <th className={ui.num}>累計売上</th>
                <th className={ui.num}>累計粗利</th>
                <th className={ui.num}>累計予算</th>
                <th className={ui.num}>累計達成率</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(grouped.entries()).map(([group, rows]) => {
                const sub = calcTotal(rows);
                return [
                  ...rows.map((row) => (
                    <tr key={row.csName}>
                      <td>{row.csName}</td>
                      <td>{row.group}</td>
                      <td>{row.grade}</td>
                      <td className={ui.num}>{row.projectCount}</td>
                      <td className={ui.num}>{fmt(row.amount)}</td>
                      <td className={ui.num}>{fmt(row.grossProfit)}</td>
                      <td className={ui.num}>{fmt(row.bugget)}</td>
                      <RateCell profit={row.grossProfit} bugget={row.bugget} />
                      <td className={ui.num}>{row.projectCountSum}</td>
                      <td className={ui.num}>{fmt(row.amountSum)}</td>
                      <td className={ui.num}>{fmt(row.grossProfitSum)}</td>
                      <td className={ui.num}>{fmt(row.buggetSum)}</td>
                      <RateCell profit={row.grossProfitSum} bugget={row.buggetSum} />
                    </tr>
                  )),
                  <tr key={`sub-${group}`} className={ui.subtotalRow}>
                    <td colSpan={3}>{group} 小計</td>
                    <td className={ui.num}>{sub.projectCount}</td>
                    <td className={ui.num}>{fmt(sub.amount)}</td>
                    <td className={ui.num}>{fmt(sub.grossProfit)}</td>
                    <td className={ui.num}>{fmt(sub.bugget)}</td>
                    <RateCell profit={sub.grossProfit} bugget={sub.bugget} />
                    <td className={ui.num}>{sub.projectCountSum}</td>
                    <td className={ui.num}>{fmt(sub.amountSum)}</td>
                    <td className={ui.num}>{fmt(sub.grossProfitSum)}</td>
                    <td className={ui.num}>{fmt(sub.buggetSum)}</td>
                    <RateCell profit={sub.grossProfitSum} bugget={sub.buggetSum} />
                  </tr>,
                ];
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>合計</td>
                <td className={ui.num}>{total.projectCount}</td>
                <td className={ui.num}>{fmt(total.amount)}</td>
                <td className={ui.num}>{fmt(total.grossProfit)}</td>
                <td className={ui.num}>{fmt(total.bugget)}</td>
                <RateCell profit={total.grossProfit} bugget={total.bugget} />
                <td className={ui.num}>{total.projectCountSum}</td>
                <td className={ui.num}>{fmt(total.amountSum)}</td>
                <td className={ui.num}>{fmt(total.grossProfitSum)}</td>
                <td className={ui.num}>{fmt(total.buggetSum)}</td>
                <RateCell profit={total.grossProfitSum} bugget={total.buggetSum} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* グループ集計 */}
      {tab === "group" && (
        <div className={ui.reportTableWrap}>
          <table>
            <thead>
              <tr>
                <th>グループ</th>
                <th className={ui.num}>人数</th>
                <th className={ui.num}>単月件数</th>
                <th className={ui.num}>単月売上</th>
                <th className={ui.num}>単月粗利</th>
                <th className={ui.num}>単月予算</th>
                <th className={ui.num}>単月達成率</th>
                <th className={ui.num}>累計件数</th>
                <th className={ui.num}>累計売上</th>
                <th className={ui.num}>累計粗利</th>
                <th className={ui.num}>累計予算</th>
                <th className={ui.num}>累計達成率</th>
              </tr>
            </thead>
            <tbody>
              {groupSummaries.map((row) => (
                <tr key={row.group}>
                  <td>{row.group}</td>
                  <td className={ui.num}>{row.memberCount}</td>
                  <td className={ui.num}>{row.projectCount}</td>
                  <td className={ui.num}>{fmt(row.amount)}</td>
                  <td className={ui.num}>{fmt(row.grossProfit)}</td>
                  <td className={ui.num}>{fmt(row.bugget)}</td>
                  <RateCell profit={row.grossProfit} bugget={row.bugget} />
                  <td className={ui.num}>{row.projectCountSum}</td>
                  <td className={ui.num}>{fmt(row.amountSum)}</td>
                  <td className={ui.num}>{fmt(row.grossProfitSum)}</td>
                  <td className={ui.num}>{fmt(row.buggetSum)}</td>
                  <RateCell profit={row.grossProfitSum} bugget={row.buggetSum} />
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>合計</td>
                <td className={ui.num}>{groupTotal.memberCount}</td>
                <td className={ui.num}>{groupTotal.projectCount}</td>
                <td className={ui.num}>{fmt(groupTotal.amount)}</td>
                <td className={ui.num}>{fmt(groupTotal.grossProfit)}</td>
                <td className={ui.num}>{fmt(groupTotal.bugget)}</td>
                <RateCell profit={groupTotal.grossProfit} bugget={groupTotal.bugget} />
                <td className={ui.num}>{groupTotal.projectCountSum}</td>
                <td className={ui.num}>{fmt(groupTotal.amountSum)}</td>
                <td className={ui.num}>{fmt(groupTotal.grossProfitSum)}</td>
                <td className={ui.num}>{fmt(groupTotal.buggetSum)}</td>
                <RateCell profit={groupTotal.grossProfitSum} bugget={groupTotal.buggetSum} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
