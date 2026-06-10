# Testing Policy

このドキュメントは、会議室・備品予約 API のテスト方針をまとめるものです。

本プロジェクトでは、クリーンアーキテクチャの学習を目的として、内側の層から順にテストを書きます。

## 基本方針

- 業務ルールは Domain 層の単体テストで守る
- UseCase は Repository Interface と InMemory Repository を使ってテストする
- Express や Prisma に依存するテストは後半で追加する
- 1つのテストでは、できるだけ1つのルールだけを確認する
- テストカバレッジは基本的に 100% を目指す
- 文字数、日時、数値などの条件には境界値テストを行う
- Domain 層では現在日時を外から `Date` として渡す
- UseCase 層では `Clock` Interface を使い、テストでは `FixedClock` で現在日時を固定する

## テストの優先順位

1. Domain 層の単体テスト
2. UseCase 層の単体テスト
3. Repository 実装のテスト
4. API の結合テスト

## 詳細なテスト観点

層ごとの具体的なテスト観点は、以下のファイルで管理します。

- [Domain 層のテスト観点](./domain.md)
- [UseCase 層のテスト観点](./usecase.md)
- [Repository 実装のテスト観点](./repository.md)
- [API 結合テストの観点](./api.md)

実装やテストを書く段階で、該当する観点ファイルの更新が漏れていそうな場合は、先に確認します。

## テストデータ作成方針

テストでは、必要に応じて Factory 関数を使います。

例:

- `createTestReservation`
- `createTestMeetingRoom`
- `createTestEquipment`
- `createTestReservationPeriod`

各テストでは、重要な値だけを上書きし、それ以外はデフォルト値を使います。これにより、テストごとの関心を明確にします。

## テスト名の方針

テスト名は、条件と期待結果が分かるように書きます。

例:

- 開始日時が終了日時より前の場合、ReservationPeriod を生成できる
- 既存予約と時間帯が重なる場合、予約作成に失敗する
- 予約者本人でない場合、予約をキャンセルできない

## テストで避けること

- Domain 層のテストで DB を使う
- Domain 層のテストで Express を使う
- UseCase のテストで Prisma Repository に直接依存する
- 同じ業務ルールを複数の層で過剰に重複テストする

## 実行コマンド

```txt
npm run test:run
```

カバレッジを確認したい場合:

```txt
npm run test:run -- --coverage
```

開発中に watch したい場合:

```txt
npm run test
```
