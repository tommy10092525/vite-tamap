# たまっぷ (Vite+React+TypeScript)

法政大学多摩キャンパスの学生向けに、大学と最寄り駅（西八王子・めじろ台・相原）を結ぶバスの時刻表をリアルタイムで提供するWebアプリケーションです。

## 特徴

- **リアルタイム時刻表示**: 現在時刻に基づき、直近のバス（過去2便・未来3便）の発車時刻と、経由するバス停への到着時刻を表示します。
- **双方向対応**: 「大学行き」「駅行き」の双方向の時刻表に対応し、簡単に切り替えられます。選択した駅と方向はブラウザに保存されます。
- **急行・直行便**: 大学が公開している急行・直行便（体育館行きを含む）も通常便と合わせて表示します。
- **学部棟への到着時刻**: 各学部棟（経済学部、現代福祉学部・社会学部、スポーツ健康学部、体育館）への到着予測時刻も表示します。
- **電車への乗り換え**: 主要なバス停（西八王子駅南口・めじろ台駅・相原駅西口・橋本駅北口・八王子駅南口）では、到着前後の電車の発車時刻を表示します。
- **PWA対応**: ホーム画面に追加でき、オフラインでも利用できます。新しいバージョンは自動で反映されます。
- **ダークモード対応**: OSの設定に合わせてライト／ダークを切り替えます。
- **静的配信**: ビルドした静的ファイルをCloudflare Workersで配信するため、高速に表示できます。

## 使用技術

- **フレームワーク**: React 19
- **ビルドツール**: Vite
- **言語**: TypeScript
- **ルーティング**: React Router DOM（`HashRouter`）
- **スタイリング**: Tailwind CSS v4, shadcn/ui
- **アニメーション**: GSAP
- **型検証**: Valibot
- **PWA**: vite-plugin-pwa
- **アクセス解析**: Google Analytics 4（react-ga4）
- **テスト**: Vitest
- **デプロイ**: Cloudflare Workers（Wrangler）

## ファイル構成

```
/
├── public/ # アイコン、robots.txt、キャッシュ設定（_headers, .htaccess）などの静的ファイル
├── src/
│   ├── components/ # 再利用可能なUIコンポーネント
│   │   ├── ui/ # shadcn/uiなどの基本コンポーネント
│   │   └── ...
│   ├── hooks/ # カスタムフック（現在時刻の更新など）
│   ├── images/ # ロゴや地図などの画像
│   ├── lib/ # 共通ユーティリティ
│   ├── pages/
│   │   └── home.tsx # トップページ
│   ├── utils/ # アプリケーション全体で使用するロジック・データ
│   │   ├── timeHandlers.ts # 時刻関連の主要ロジック
│   │   ├── types.ts # Valibotのスキーマと型
│   │   ├── constants.ts # 学部棟までの所要時間、駅名などの定数
│   │   ├── useUserInput.ts # 選択した駅と方向をlocalStorageに保存するフック
│   │   ├── TimeTable.json # 通常便のバスの時刻表データ
│   │   ├── ExpressTimetable.json # 急行・直行便の時刻表データ
│   │   ├── Holidays.json # 祝日データ
│   │   └── ekitan.json # 電車の時刻表データ
│   ├── App.tsx # メインコンポーネント（ルーティング、アクセス解析）
│   ├── main.tsx # エントリーポイント
│   └── register-sw.ts # Service Workerの登録と更新確認
├── test/ # Vitestのテスト
├── scraping.ts # 時刻表データを取得するスクリプト
├── vite.config.ts
├── wrangler.jsonc # Cloudflare Workersの設定
├── package.json
└── README.md
```

## 時刻情報の処理

本アプリケーションのコア機能である時刻情報の処理は、`src/utils/`内のファイル群によって実現されています。

### 1. データソース (JSONファイル)

JSONファイルはビルド時に同梱されます。バスの時刻表（`TimeTable.json`・`ExpressTimetable.json`）は初期表示を妨げないよう、`home.tsx`で遅延読み込みしています。読み込んだデータはValibotで検証します。

- **`TimeTable.json`**
  - 通常便のバスの時刻表データです。
  - 神奈川中央交通（神奈中バス）および京王バスの公式サイトから`scraping.ts`で取得しています。
  - 各便は以下の情報を持ちます。
    - `id`: 便のID
    - `day`: 運行曜日 (`Weekday`, `Saturday`, `Sunday`)
    - `station`: 発着駅 (`nishihachioji`, `mejirodai`, `aihara`)
    - `isComingToHosei`: 大学行きかどうか (`true`/`false`)
    - `leaveHour`, `leaveMinute`: 出発時刻
    - `arriveHour`, `arriveMinute`: 到着時刻
    - `stopList`: 経由するバス停ごとの到着時刻（`hour`, `minute`, `name`）

- **`ExpressTimetable.json`**
  - 大学のPDFでのみ公開されている急行・直行便の時刻表です。発車時刻しかわからないため、手作業で記述しています。
  - 駅・方向・曜日・種別（`express`/`direct`）ごとに、有効期間（`validFrom`〜`validTo`、`YYYY-MM-DD`で両端を含む。`validTo`を省略すると終わりなし）と発車時刻の一覧（`departures`）を持ちます。
  - 体育館行きの便は`{ "time": "8:45", "destination": "gym" }`のように行き先を指定します。

- **`Holidays.json`**
  - 日本の祝日を定義したデータです。
  - `YYYY-MM-DD`: `祝日名` の形式で記述されています。
  - 祝日は「休日ダイヤ」（`Sunday`扱い）として処理されます。

- **`ekitan.json`**
  - 各駅（西八王子、めじろ台、相原、JR八王子/京王八王子、橋本）の電車の時刻表データです。
  - バスから電車への乗り換え案内に使用されます。

### 2. 時刻処理ロジック (`src/utils/timeHandlers.ts`)

JSONデータを処理し、表示する情報を計算する主要な関数が含まれています。

- **`mergeTimetables(params)`**
  - 通常便と急行・直行便を1つの時刻表にまとめ、出発時刻順に並べます。

- **`findNextBuses(params)`**
  - アプリケーションの心臓部となる関数です。
  - 現在時刻、選択された駅、進行方向などを受け取り、直近のバスを返します。`length`が正なら未来の便、負なら過去の便を検索します（トップページでは過去2便、未来3便）。
  - **主な処理の流れ**:
    1. 選択された駅と方向で時刻表を絞り込みます。
    2. `isHoliday()`で祝日かどうかを判定し、祝日の場合は`Sunday`として扱います。
    3. その日の便のうち、有効期間内のものから二分探索で直近の便を探します。
    4. 便が足りない場合は翌日（過去方向なら前日）の時刻表を続けて検索します。

- **`findFutureTrains(params)` / `findPastTrains(params)`**
  - `ekitan.json`を基に、バス停への到着時刻の後・前に発車する電車を検索します。

- **`isHoliday(params)`**
  - `Holidays.json`を参照し、与えられた日付が祝日かどうかを判定します。日本時間で判定するため、9時間を足してから日付を確認します。

## 開発環境の構築

1. Node.jsをインストールします。
2. このリポジトリをクローンします。
3. `npm install`を実行して依存関係をインストールします。
4. `npm run dev`を実行して開発サーバーを起動します。
5. ブラウザで`http://localhost:5173`にアクセスして動作を確認します。

## コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバーを起動します（`0.0.0.0:5173`） |
| `npm run build` | 型チェックを行い、`dist`フォルダにビルドします |
| `npm run preview` | ビルドしたファイルをプレビューします |
| `npm run lint` | ESLintを実行します |
| `npm run test` | Vitestでテストを実行します |
| `npm run scrape` | バスの時刻表を取得し、`src/utils/TimeTable.json`を更新します |
| `npm run deploy` | ビルドしてCloudflare Workersにデプロイします |

## デプロイ

ビルドした静的ファイルをCloudflare WorkerのWorker「`tamap`」として配信しています（設定は`wrangler.jsonc`）。

1. `npx wrangler login`でCloudflareアカウントにログインします。
2. `npm run deploy`を実行すると、ビルドしたファイルがアップロードされます。
