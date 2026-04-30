# CSOrder — CS受注予実管理システム

CS メンバーの受注データを管理し、売上・粗利・予算達成率をレポートするデスクトップアプリケーションです。

## 主な機能

| 機能 | 概要 |
|------|------|
| 社員管理 | 社員情報・月別予算の登録・編集・CSV入出力 |
| 受注取込 | SJIS形式CSVのバリデーション・プレビュー・DB登録 |
| 受注一覧 | 取込済み受注データの一覧表示 |
| 帳票 | 担当別／グループ別の売上・粗利・予算達成率集計、CSV出力 |

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| フロントエンド | React 19 + TypeScript + Vite |
| バックエンド | Rust + Tauri 2 |
| DB | SQLite（sqlx 0.8 / 自動マイグレーション） |
| 文字コード変換 | encoding_rs（SJIS → UTF-8） |
| CSV解析 | csv crate（serde Deserialize） |
| インストーラー | NSIS（Windows、日本語、全ユーザーインストール） |

## ディレクトリ構成

```
CSOrder/
├── src/                        # React フロントエンド
│   ├── components/
│   │   ├── App.tsx             # ナビゲーション・画面切替
│   │   ├── EmployeeManagement.tsx  # 社員管理
│   │   ├── DataImport.tsx      # 受注CSV取込
│   │   ├── OrderList.tsx       # 受注一覧
│   │   └── Report.tsx          # 帳票・CSV出力
│   └── styles/
│       ├── global.css
│       └── ui.module.css
├── src-tauri/                  # Rust バックエンド
│   ├── src/
│   │   ├── command/            # Tauri コマンドハンドラー
│   │   ├── model/              # データ構造体
│   │   ├── repository/         # DB アクセス層
│   │   └── service/            # ビジネスロジック層
│   ├── migrations/             # SQLite マイグレーション
│   └── tauri.conf.json
├── 要件定義書.md
└── 設計書.md
```

## 開発環境のセットアップ

### 前提条件

- [Node.js](https://nodejs.org/) 18 以上
- [Rust](https://rustup.rs/) (stable)
- [Tauri CLI v2](https://v2.tauri.app/)

### インストール

```bash
npm install
```

### 開発サーバー起動

```bash
npm run tauri dev
```

### ビルド

```bash
npm run tauri build
```

インストーラーは `src-tauri/target/release/bundle/nsis/` に生成されます。

## データ仕様

### 受注CSVフォーマット（SJIS）

| 列名 | 型 | 必須 |
|------|----|------|
| 案件番号 | 数値 | ○ |
| 案件名 | 文字列 | ○ |
| 顧客名 | 文字列 | ○ |
| 売上合計 | 数値（千円） | ○ |
| 粗利合計 | 数値（千円） | ○ |
| 契約日 | YYYY/MM/DD | ○（空欄行はスキップ） |
| 案件主担当者ID | 数値 | ○ |
| 案件主担当者名 | 文字列 | ○ |

### 社員CSVフォーマット（UTF-8 BOM付き）

```
社員番号,社員名,グループ,グレード,4月予算,5月予算,...,3月予算
```

金額の単位はすべて千円。

## 会計年度

4月始まり・3月終わりの会計年度に対応。DB内では 4月=1、5月=2、…、3月=12 として保持します。
