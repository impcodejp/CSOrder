  -- 0001_create_tables.sql
  CREATE TABLE IF NOT EXISTS employees (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      name  TEXT    NOT NULL,
      "group" TEXT  NOT NULL,
      grade TEXT    NOT NULL,
      monthly_budget1  INTEGER NOT NULL DEFAULT 0,
      monthly_budget2  INTEGER NOT NULL DEFAULT 0,
      monthly_budget3  INTEGER NOT NULL DEFAULT 0,
      monthly_budget4  INTEGER NOT NULL DEFAULT 0,
      monthly_budget5  INTEGER NOT NULL DEFAULT 0,
      monthly_budget6  INTEGER NOT NULL DEFAULT 0,
      monthly_budget7  INTEGER NOT NULL DEFAULT 0,
      monthly_budget8  INTEGER NOT NULL DEFAULT 0,
      monthly_budget9  INTEGER NOT NULL DEFAULT 0,
      monthly_budget10 INTEGER NOT NULL DEFAULT 0,
      monthly_budget11 INTEGER NOT NULL DEFAULT 0,
      monthly_budget12 INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS orders (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_name    TEXT    NOT NULL,
      amount        INTEGER NOT NULL,
      gross_profit  INTEGER NOT NULL,
      project_name  TEXT    NOT NULL,
      client_name   TEXT    NOT NULL
  );