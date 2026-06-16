# Meeting Room Reservation API

会議室・備品を予約するための REST API です。

このプロジェクトは、クリーンアーキテクチャを学習しながら、Domain 層から外側の層へ順番に実装することを目的にしています。

## 技術スタック

- Node.js
- TypeScript
- Express
- Prisma
- SQLite
- Vitest
- Zod

## アーキテクチャ

クリーンアーキテクチャを意識して、主に以下の層に分けています。

- `src/domain`: Entity、Value Object、Domain Service、Domain Error
- `src/application`: UseCase、Repository Interface、Application Service Interface
- `src/interface`: Controller、Presenter、HTTP response 変換
- `src/infrastructure`: Express、Prisma、Repository 実装、外部技術に依存する処理

詳細は [Clean Architecture docs](./docs/architecture/clean-architecture/README.md) を参照してください。

## セットアップ

依存関係をインストールします。

```txt
npm install
```

Prisma Client を生成します。

```txt
npx prisma generate
```

DB migration を実行します。

```txt
npx prisma migrate dev
```

`src/generated/prisma` は git 管理外です。初回セットアップ時や Prisma schema を変更した後は、`npx prisma generate` を実行してください。

## 環境変数

`.env` に以下を設定します。

```txt
NODE_ENV="development"
DATABASE_URL="file:./dev.db"
```

SQLite の `dev.db` はプロジェクトルートに作成されます。

## 開発サーバー

```txt
npm run dev
```

デフォルトでは `http://localhost:3000` で起動します。

## テスト

単体テスト・結合テストを実行します。

```txt
npm run test:run
```

カバレッジを確認します。

```txt
npm run test:coverage
```

テスト方針の詳細は [Testing Policy](./docs/testing/README.md) を参照してください。

## その他のコマンド

型チェック:

```txt
npm run typecheck
```

Lint:

```txt
npm run lint
```

ビルド:

```txt
npm run build
```

## 主な API

### Meeting Rooms

- `POST /meeting-rooms`
- `GET /meeting-rooms`

### Equipments

- `POST /equipments`
- `GET /equipments`

### Reservations

- `POST /reservations`
- `GET /reservations`
- `GET /reservations/:reservationId`
- `PATCH /reservations/:reservationId/cancel`

### Available Resources

- `GET /available-resources`

API 層のテスト観点は [API test cases](./docs/testing/api.md) を参照してください。

## ドキュメント

- [要求仕様](./docs/requirements.md)
- [クリーンアーキテクチャ概要](./docs/architecture/clean-architecture/README.md)
- [依存方向のルール](./docs/architecture/clean-architecture/dependency-rule.md)
- [ディレクトリ構成](./docs/architecture/clean-architecture/directory-structure.md)
- [Prisma Repository 設計](./docs/architecture/clean-architecture/infrastructure/prisma-repository.md)
- [テスト方針](./docs/testing/README.md)

詳細な設計やテスト観点は `docs` 配下にまとめています。README では、プロジェクトを動かすための入口に絞っています。
