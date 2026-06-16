# API Test Cases

API 結合テストでは、HTTP request / response の変換を確認します。

このファイルは Express API の結合テスト観点をまとめます。

## 基本方針

- 正しい status code が返る
- JSON response が API 仕様に合っている
- request body / query parameter が UseCase 入力に変換される
- request body / query parameter が不正な場合、400 が返る
- request body validation では、必須項目の不足・型違い・境界値を確認する
- Domain Error / Application Error が API エラー形式に変換される
- API テストでは一時 SQLite DB を使い、開発用の `dev.db` を汚さない

## 確認する API

- `POST /meeting-rooms`
  - request body が正しい場合、会議室を作成して 201 を返す
  - request body の必須項目が不足している場合、400 を返す
  - request body の型が不正な場合、400 を返す
  - `capacity` が境界値未満の場合、400 を返す
  - 同名の会議室が存在する場合、409 を返す
  - 想定外のエラーが発生した場合、500 を返す
- `GET /meeting-rooms`
  - query parameter が正しい場合、条件に一致する会議室一覧を 200 で返す
  - `capacityGte` が数値に変換できない場合、400 を返す
  - `capacityGte` が空文字の場合、400 を返す
- `POST /equipments`
  - request body が正しい場合、備品を作成して 201 を返す
  - request body の必須項目が不足している場合、400 を返す
  - `category` が許可された値でない場合、400 を返す
  - `name` が境界値未満の場合、400 を返す
  - 同名の備品が存在する場合、409 を返す
  - 想定外のエラーが発生した場合、500 を返す
- `GET /equipments`
  - query parameter が正しい場合、条件に一致する備品一覧を 200 で返す
  - `location` で条件に一致する備品一覧を 200 で返す
  - `category` が許可された値でない場合、400 を返す
- `POST /reservations`
  - request body が正しい場合、予約を作成して 201 を返す
  - request body の必須項目が不足している場合、400 を返す
  - `resourceType` が許可された値でない場合、400 を返す
  - `startAt` / `endAt` が日時として不正な場合、400 を返す
  - `startAt` が `endAt` より後の場合、400 を返す
  - 指定したリソースが存在しない場合、404 を返す
  - 既存予約と時間帯が重複する場合、409 を返す
  - 想定外のエラーが発生した場合、500 を返す
- `GET /reservations`
  - query parameter が正しい場合、条件に一致する予約一覧を 200 で返す
  - `resourceType` / `status` が許可された値でない場合、400 を返す
  - `from` / `to` が日時として不正な場合、400 を返す
- `GET /reservations/{reservationId}`
  - 予約が存在する場合、予約詳細を 200 で返す
  - 予約が存在しない場合、404 を返す
- `PATCH /reservations/{reservationId}/cancel`
  - request body が正しい場合、予約をキャンセルして 200 を返す
  - request body の `userId` が不足している場合、400 を返す
  - 予約が存在しない場合、404 を返す
  - 予約者本人でない場合、403 を返す
  - 予約がすでにキャンセル済みの場合、409 を返す
- `GET /available-resources`
  - query parameter が正しい場合、予約可能なリソース一覧を 200 で返す
  - `resourceType` が許可された値でない場合、400 を返す
  - `startAt` / `endAt` が日時として不正な場合、400 を返す
  - `capacityGte` が数値に変換できない場合、400 を返す
  - `category` が許可された値でない場合、400 を返す
  - 既存予約と重複するリソースは一覧に含まれない
  - キャンセル済み予約のみがあるリソースは一覧に含まれる
