import { useState } from "react";
import DataImport from "./components/DataImport";
import OrderList from "./components/OrderList";
import Report from "./components/Report";
import EmployeeManagement from "./components/EmployeeManagement";
import "./App.css";

type Screen = "import" | "orders" | "report" | "employees";

const NAV: { id: Screen; label: string }[] = [
  { id: "import",    label: "データ取込" },
  { id: "orders",    label: "受注一覧"   },
  { id: "report",    label: "帳票"       },
  { id: "employees", label: "社員管理"   },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>("import");

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-title">CSOrder</div>
        <nav>
          {NAV.map((item) => (
            <button
              key={item.id}
              className={`nav-item${screen === item.id ? " active" : ""}`}
              onClick={() => setScreen(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        {screen === "import"    && <DataImport />}
        {screen === "orders"    && <OrderList />}
        {screen === "report"    && <Report />}
        {screen === "employees" && <EmployeeManagement />}
      </main>
    </div>
  );
}
