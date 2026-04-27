import { useState } from "react";
import DataImport from "./components/DataImport";
import OrderList from "./components/OrderList";
import Report from "./components/Report";
import EmployeeManagement from "./components/EmployeeManagement";
import styles from "./App.module.css";

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
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>CSOrder</div>
          <div className={styles.sidebarSubtitle}>受注管理システム</div>
        </div>
        <nav className={styles.sidebarNav}>
          {NAV.map((item) => (
            <button
              key={item.id}
              className={`${styles.navItem}${screen === item.id ? ` ${styles.navItemActive}` : ""}`}
              onClick={() => setScreen(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className={styles.mainContent}>
        {screen === "import"    && <DataImport />}
        {screen === "orders"    && <OrderList />}
        {screen === "report"    && <Report />}
        {screen === "employees" && <EmployeeManagement />}
      </main>
    </div>
  );
}
