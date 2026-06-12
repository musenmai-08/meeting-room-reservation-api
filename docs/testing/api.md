# API Test Cases

API 結合テストでは、HTTP request / response の変換を確認します。

このファイルは Express API の実装が進んだ段階で具体化します。

## 基本方針

- 正しい status code が返る
- JSON response が API 仕様に合っている
- request body / query parameter が UseCase 入力に変換される
- request body / query parameter が不正な場合、400 が返る
- request body validation では、必須項目の不足・型違い・境界値を確認する
- Domain Error / Application Error が API エラー形式に変換される

## 暫定で確認する API

- `POST /meeting-rooms`
  - request body が正しい場合、会議室を作成して 201 を返す
  - request body の必須項目が不足している場合、400 を返す
  - request body の型が不正な場合、400 を返す
- `GET /meeting-rooms`
  - query parameter が正しい場合、条件に一致する会議室一覧を 200 で返す
  - `capacityGte` が数値に変換できない場合、400 を返す
  - query parameter の型が不正な場合、400 を返す
- `POST /equipments`
  - request body が正しい場合、備品を作成して 201 を返す
  - request body の必須項目が不足している場合、400 を返す
  - `category` が許可された値でない場合、400 を返す
  - 同名の備品が存在する場合、409 を返す
- `GET /equipments`
  - query parameter が正しい場合、条件に一致する備品一覧を 200 で返す
  - `category` が許可された値でない場合、400 を返す
  - query parameter の型が不正な場合、400 を返す
- `POST /reservations`
- `GET /reservations`
- `GET /reservations/{reservationId}`
- `PATCH /reservations/{reservationId}/cancel`
- `GET /available-resources`
