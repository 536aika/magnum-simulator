# マグナムオリシャン専門店用 売上シミュレーター

React + Vite + TypeScript + Material UI のスマホ向け売上シミュレーターです。  
LIFF（LINE Front-end Framework）上でも、通常のブラウザでも利用できます。`VITE_LIFF_ID` が未設定、または `liff.init` が失敗した場合は **フォールバック** し、通常サイトとして動作します。

---

## 1. Vercel へのデプロイ手順

1. このプロジェクトを **Git リポジトリ**（例: GitHub）に push する  
   - まだ Git 化していない場合の例:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     ```
     その後、GitHub でリポジトリを作成し、`git remote add` → `git push` します。
2. [Vercel](https://vercel.com/) にログインし、**Add New…** → **Project** を開く。
3. 先ほどの GitHub リポジトリを **Import** する。
4. **Framework Preset** は **Vite**（自動検出でも可）。**Build Command** は `npm run build`、**Output Directory** は `dist`（リポジトリの `vercel.json` でも指定済み）。
5. **Environment Variables** で `VITE_LIFF_ID` を設定する場合は、この時点で追加するか、デプロイ後に「3」の手順で追加して再デプロイする。
6. **Deploy** を実行し、表示された本番 URL（例: `https://your-project.vercel.app`）を控える。
7. LINE Developers 側の LIFF **Endpoint URL** を、この Vercel の URL（末尾 `/` 付き推奨）に合わせる（「2」を参照）。

**CLI でデプロイする場合（任意）**

```bash
npm i -g vercel
vercel login
vercel
vercel --prod
```

---

## 2. LINE Developers での LIFF チャネル作成手順（developers.line.biz）

[LINE Developers Console](https://developers.line.biz/console/) で次のように設定します。

1. ログイン後、**Provider** を選択する（ない場合は作成）。
2. 対象の **チャネル** を開く。LIFF を紐づけるチャネルは用途に応じて **LINE Login** などを作成・選択する。
3. チャネル内の **LIFF** タブ（または LIFF 設定）から **追加** する。
4. **Endpoint URL** に、**1** でデプロイした Vercel の URL を入力する。  
   - 例: `https://your-project.vercel.app/`
5. サイズ（Full / Tall / Compact など）は用途に合わせて選ぶ。
6. 保存後、発行された **LIFF ID**（`liff.init` と Vercel の環境変数で使う値）をコピーする。
7. コンソールに表示される **LIFF URL**（例: `https://liff.line.me/...`）は、**4** のリッチメニューから開くリンクとして使うことが多い。

---

## 3. Vercel の Environment Variables への `VITE_LIFF_ID` 設定手順

Vite では `VITE_` プレフィックス付きの変数だけがフロントに埋め込まれます。

1. Vercel の該当プロジェクトを開く。
2. **Settings** → **Environment Variables** を開く。
3. **Key** に `VITE_LIFF_ID`、**Value** に LINE Developers で発行した **LIFF ID** を入力する。
4. 適用環境（**Production** / **Preview** / **Development**）を必要に応じて選択する。
5. 保存後、**Deployments** から最新デプロイを **Redeploy** する（または空コミットで再ビルド）と、ビルド時に値が反映される。

ローカルでは `.env.example` をコピーして `.env` を作成します。

```bash
cp .env.example .env
```

---

## 4. LINE 公式アカウント管理画面（manager.line.biz）のリッチメニューに LIFF URL を設定する手順

[LINE Official Account Manager](https://manager.line.biz/) で、リッチメニューのタップ先に LIFF を開く URL を設定します。

1. **LINE Official Account Manager** にログインする。
2. 対象の **公式アカウント** を選ぶ。
3. **ホーム** または **チャット** 領域から **リッチメニュー**（リッチメニューの作成・編集）を開く。
4. 新規作成または既存メニューを編集し、タップさせたい **エリア** を選択する。
5. アクションで **リンク**（または **LIFF** / **ウェブサイト** など UI 上の同等項目）を選ぶ。
6. URL 欄に、LINE Developers の LIFF 一覧に表示される **LIFF URL**（多くの場合 `https://liff.line.me/...` 形式）を入力する。  
   - **Endpoint URL**（Vercel の URL）をそのままリッチメニューに入れるのではなく、**LIFF URL** を使うのが一般的です（LINE アプリ内で LIFF として起動しやすいため）。
7. 保存し、リッチメニューを **公開**（または適用）する。
8. スマートフォンの LINE でトーク画面を開き、リッチメニューをタップして意図したページが開くか確認する。

---

## ローカル起動

```bash
npm install
npm run dev
```

---

## LIFF 実装の概要（コード）

- `index.html` の `<head>` に  
  `<script src="https://static.line-scdn.net/liff/edge/2/sdk.js"></script>` を追加済み。
- `src/App.tsx` の `useEffect` で  
  `liff.init({ liffId: import.meta.env.VITE_LIFF_ID })` を実行（ID 未設定・SDK なし・初期化失敗時は何もしない／catch で握りつぶし、画面はそのまま利用可能）。
- 型定義: `src/vite-env.d.ts` で `@liff/liff-types`（npm パッケージ名。要件の「liff-types」に相当）を参照。
