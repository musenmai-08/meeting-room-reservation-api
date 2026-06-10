# API Test Cases

API 結合テストでは、HTTP request / response の変換を確認します。

このファイルは Express API の実装が進んだ段階で具体化します。

## 基本方針

- 正しい status code が返る
- JSON response が API 仕様に合っている
- request body / query parameter が UseCase 入力に変換される
- request body / query parameter が不正な場合、400 が返る
- Domain Error / Application Error が API エラー形式に変換される

## 暫定で確認する API

- `POST /meeting-rooms`
- `GET /meeting-rooms`
- `POST /equipments`
- `GET /equipments`
- `POST /reservations`
- `GET /reservations`
- `GET /reservations/{reservationId}`
- `PATCH /reservations/{reservationId}/cancel`
- `GET /available-resources`

