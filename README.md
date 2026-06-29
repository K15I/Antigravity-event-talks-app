# BigQuery Release Notes Hub 🚀

Google Cloud BigQuery の公式リリースノートを購読・可視化し、気になるアップデートを簡単にカスタマイズして X (旧Twitter) へ投稿できるモダンな Web アプリケーションです。

---

## 🌟 主な機能 (Key Features)

1. **自動フィード同期 & CORS回避**
   - Google Cloud 公式の BigQuery リリースノート XML フィードをサーバーサイドで取得するため、ブラウザの CORS 制限を気にせず最新情報を同期できます。
2. **スマート・コンテンツ・パース**
   - 1日に複数のアップデートが混在するフィードを、フロントエンド側で `H3` タグ（Feature, Change, Deprecated, Issue など）ごとに分解して、独立した読みやすいカードとして整理します。
3. **カテゴリ別フィルター**
   - 新機能 (Features)、変更点 (Changes)、非推奨 (Deprecations)、既知の問題 (Issues) などのカテゴリごとに瞬時に表示を切り替えられます。
4. **プレミアムなダークテーマ UI**
   - ガラスモーフィズム（Glassmorphism）、グラデーション、背景のネオングロー効果（Glow Orbs）を取り入れた先進的なダークテーマ設計。
5. **高度なツイート編集モーダル**
   - アップデートごとのツイート下書きを自動生成。
   - X の280文字制限に対応したリアルタイムの文字数カウンターを搭載。
   - おすすめハッシュタグ（`#BigQuery`、`#GoogleCloud`）をワンクリックで追加・削除。

---

## 🛠️ 使用技術 (Tech Stack)

* **Backend**: Python 3, Flask, `urllib.request`, `xml.etree.ElementTree`
* **Frontend**: HTML5, Vanilla CSS3 (Custom Properties), JavaScript (ES6+, DOMParser)
* **Assets**: FontAwesome 6 (Icons), Google Fonts (Inter, Outfit, Noto Sans JP)

---

## 📦 ディレクトリ構造 (Project Structure)

```text
agy-cli-projects/
├── .venv/                  # Python 仮想環境
├── static/
│   ├── css/
│   │   └── style.css       # スタイル定義 (Glassmorphism & アニメーション)
│   └── js/
│       └── app.js          # フロントエンド制御 (DOMパース、モーダル、ツイート処理)
├── templates/
│   └── index.html          # メインHTMLテンプレート
├── app.py                  # Flask バックエンドサーバー (API エンドポイント)
├── README.md               # 本ドキュメント
└── project_documentation.md # 詳細なシステム仕様書
```

---

## 🚀 セットアップと起動方法 (Getting Started)

### 1. 仮想環境の有効化

プロジェクトディレクトリへ移動し、Python の仮想環境を有効化します。

**Windows (PowerShell)**:
```powershell
.venv\Scripts\activate
```

**macOS/Linux**:
```bash
source .venv/bin/activate
```

### 2. アプリケーションの起動

Flask 開発サーバーを起動します。

```bash
python app.py
```

### 3. ブラウザでアクセス

起動後、以下のURLにアクセスするとアプリケーションが利用できます。

👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 📝 ライセンス

このプロジェクトは学習・開発用サンプルとして提供されています。
Google Cloud RSS フィードは Google 社によって提供されています。
