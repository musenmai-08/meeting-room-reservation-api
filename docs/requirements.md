# 会議室・備品予約 API 仕様書

## 1. 概要

本アプリケーションは、会議室および備品の予約を管理するバックエンド API である。

利用者は、会議室や備品の空き状況を確認し、指定した日時で予約を作成できる。
同一リソースに対して、同じ時間帯に重複する予約は作成できない。

本アプリケーションは、クリーンアーキテクチャの学習を目的とし、以下を重視する。

- 業務ルールを Domain 層に集約する
- ユースケース単位で Application 層を設計する
- DB や Web フレームワークに依存しない設計にする
- Repository Interface と実装を分離する
- ユースケース単位でテストしやすい構成にする

---

## 2. 対象範囲

### 2.1 MVP で実装する機能

- 会議室の登録
- 会議室の一覧取得
- 備品の登録
- 備品の一覧取得
- 予約の作成
- 予約の一覧取得
- 予約の詳細取得
- 予約のキャンセル
- 指定日時で予約可能なリソースの検索

### 2.2 MVP では実装しない機能

- ログイン認証
- ユーザー登録
- 管理者権限
- メール通知
- 承認フロー
- 繰り返し予約
- 予約変更
- 外部カレンダー連携
- フロントエンド画面

---

## 3. 用語定義

| 用語       | 説明                                               |
| ---------- | -------------------------------------------------- |
| リソース   | 予約対象となるもの。会議室または備品を指す         |
| 会議室     | 予約可能な部屋                                     |
| 備品       | 予約可能なプロジェクター、マイク、モニターなど     |
| 予約       | 利用者が特定のリソースを特定の時間帯で押さえること |
| 予約期間   | 予約開始日時から予約終了日時までの期間             |
| キャンセル | 作成済み予約を無効化すること                       |
| 予約可能   | 指定時間帯に既存予約と重複していない状態           |

---

## 4. 前提条件

- API は REST API とする
- レスポンス形式は JSON とする
- DB は学習用として SQLite を想定する
- 認証は実装しない
- 利用者はリクエスト時に `userId` を渡す
- 日時入力は ISO 8601 形式で扱う
- 日時入力の例では `Asia/Tokyo` の offset を使う
- 日時レスポンスは `Date#toISOString()` により UTC の `Z` 付き文字列で返す
- キャンセル済み予約は重複判定の対象外とする

---

## 5. 業務ルール

### 5.1 予約作成ルール

予約作成時は、以下の条件をすべて満たす必要がある。

1. 指定されたリソースが存在すること
2. 予約開始日時が予約終了日時より前であること
3. 予約開始日時が現在日時より後であること
4. 予約時間が既存の有効予約と重複していないこと
5. 予約者 ID が指定されていること
6. 予約目的が指定されていること
7. キャンセル済み予約は重複判定から除外すること

### 5.2 予約重複の判定ルール

以下の条件を満たす場合、予約は重複していると判断する。

```txt
既存予約.startAt < 新規予約.endAt
かつ
新規予約.startAt < 既存予約.endAt
```

例：

| 既存予約      | 新規予約      | 判定       |
| ------------- | ------------- | ---------- |
| 10:00 - 11:00 | 09:00 - 10:00 | 重複しない |
| 10:00 - 11:00 | 11:00 - 12:00 | 重複しない |
| 10:00 - 11:00 | 10:30 - 11:30 | 重複する   |
| 10:00 - 11:00 | 09:30 - 10:30 | 重複する   |
| 10:00 - 11:00 | 10:00 - 11:00 | 重複する   |

### 5.3 予約キャンセルルール

予約キャンセル時は、以下の条件を満たす必要がある。

1. 指定された予約が存在すること
2. 予約がすでにキャンセル済みでないこと
3. 予約開始日時が現在日時より後であること
4. 予約者本人のみキャンセルできること

### 5.4 予約可能リソース検索ルール

指定された時間帯において、既存の有効予約と重複しないリソースを予約可能として返却する。

---

## 6. 機能要件

## 6.1 会議室登録

### 概要

予約対象となる会議室を登録する。

### 入力項目

| 項目        | 型     | 必須 | 説明     |
| ----------- | ------ | ---- | -------- |
| name        | string | 必須 | 会議室名 |
| capacity    | number | 必須 | 収容人数 |
| location    | string | 任意 | 場所     |
| description | string | 任意 | 備考     |

### バリデーション

- `name` は 1 文字以上 100 文字以内
- `capacity` は 1 以上
- 同名の会議室は登録不可

---

## 6.2 会議室一覧取得

### 概要

登録済みの会議室一覧を取得する。

### 検索条件

| 項目        | 型     | 必須 | 説明                           |
| ----------- | ------ | ---- | ------------------------------ |
| capacityGte | number | 任意 | 指定人数以上の会議室に絞り込む |
| location    | string | 任意 | 場所で絞り込む                 |

---

## 6.3 備品登録

### 概要

予約対象となる備品を登録する。

### 入力項目

| 項目        | 型     | 必須 | 説明         |
| ----------- | ------ | ---- | ------------ |
| name        | string | 必須 | 備品名       |
| category    | string | 必須 | 備品カテゴリ |
| location    | string | 任意 | 保管場所     |
| description | string | 任意 | 備考         |

### 備品カテゴリ例

- PROJECTOR
- MONITOR
- MICROPHONE
- SPEAKER
- WHITEBOARD
- OTHER

### バリデーション

- `name` は 1 文字以上 100 文字以内
- `category` は定義済みカテゴリのいずれか
- 同名の備品は登録不可

---

## 6.4 備品一覧取得

### 概要

登録済みの備品一覧を取得する。

### 検索条件

| 項目     | 型     | 必須 | 説明                   |
| -------- | ------ | ---- | ---------------------- |
| category | string | 任意 | 備品カテゴリで絞り込む |
| location | string | 任意 | 保管場所で絞り込む     |

---

## 6.5 予約作成

### 概要

指定したリソースを指定時間帯で予約する。

### 入力項目

| 項目         | 型     | 必須 | 説明                              |
| ------------ | ------ | ---- | --------------------------------- |
| resourceType | string | 必須 | `MEETING_ROOM` または `EQUIPMENT` |
| resourceId   | string | 必須 | 予約対象リソース ID               |
| userId       | string | 必須 | 予約者 ID                         |
| startAt      | string | 必須 | 予約開始日時                      |
| endAt        | string | 必須 | 予約終了日時                      |
| purpose      | string | 必須 | 利用目的                          |

### バリデーション

- `resourceType` は `MEETING_ROOM` または `EQUIPMENT`
- `resourceId` に対応するリソースが存在すること
- `userId` が空でないこと
- `startAt < endAt` であること
- `startAt` は現在日時より後であること
- 既存の有効予約と重複しないこと
- `purpose` は 1 文字以上 200 文字以内

---

## 6.6 予約一覧取得

### 概要

予約一覧を取得する。

### 検索条件

| 項目         | 型     | 必須 | 説明                     |
| ------------ | ------ | ---- | ------------------------ |
| userId       | string | 任意 | 予約者 ID で絞り込む     |
| resourceType | string | 任意 | リソース種別で絞り込む   |
| resourceId   | string | 任意 | リソース ID で絞り込む   |
| status       | string | 任意 | 予約ステータスで絞り込む |
| from         | string | 任意 | 指定日時以降の予約を取得 |
| to           | string | 任意 | 指定日時以前の予約を取得 |

### 予約ステータス

| 値        | 説明           |
| --------- | -------------- |
| RESERVED  | 予約中         |
| CANCELLED | キャンセル済み |

---

## 6.7 予約詳細取得

### 概要

指定した予約の詳細を取得する。

### 入力

| 項目          | 型     | 必須 | 説明    |
| ------------- | ------ | ---- | ------- |
| reservationId | string | 必須 | 予約 ID |

---

## 6.8 予約キャンセル

### 概要

指定した予約をキャンセルする。

### 入力項目

| 項目          | 型     | 必須 | 説明                |
| ------------- | ------ | ---- | ------------------- |
| reservationId | string | 必須 | 予約 ID             |
| userId        | string | 必須 | キャンセル実行者 ID |

### バリデーション

- 予約が存在すること
- 予約がキャンセル済みでないこと
- 予約開始日時が現在日時より後であること
- 予約者本人であること

---

## 6.9 予約可能リソース検索

### 概要

指定した時間帯で予約可能な会議室または備品を検索する。

### 入力項目

| 項目         | 型     | 必須 | 説明                              |
| ------------ | ------ | ---- | --------------------------------- |
| resourceType | string | 必須 | `MEETING_ROOM` または `EQUIPMENT` |
| startAt      | string | 必須 | 利用開始日時                      |
| endAt        | string | 必須 | 利用終了日時                      |
| capacityGte  | number | 任意 | 会議室の場合、収容人数で絞り込み  |
| category     | string | 任意 | 備品の場合、カテゴリで絞り込み    |

### バリデーション

- `startAt < endAt` であること
- `resourceType` が `MEETING_ROOM` の場合、`category` は無視する
- `resourceType` が `EQUIPMENT` の場合、`capacityGte` は無視する

---

## 7. API 仕様

## 7.1 会議室 API

### 会議室登録

```http
POST /meeting-rooms
```

#### Request

```json
{
  "name": "会議室A",
  "capacity": 8,
  "location": "東京本社 3F",
  "description": "モニターあり"
}
```

#### Response: 201 Created

```json
{
  "id": "mr_001",
  "name": "会議室A",
  "capacity": 8,
  "location": "東京本社 3F",
  "description": "モニターあり",
  "createdAt": "2026-06-10T01:00:00.000Z",
  "updatedAt": "2026-06-10T01:00:00.000Z"
}
```

---

### 会議室一覧取得

```http
GET /meeting-rooms
```

#### Query Parameters

```txt
capacityGte=4
location=東京本社
```

#### Response: 200 OK

```json
{
  "items": [
    {
      "id": "mr_001",
      "name": "会議室A",
      "capacity": 8,
      "location": "東京本社 3F",
      "description": "モニターあり"
    }
  ]
}
```

---

## 7.2 備品 API

### 備品登録

```http
POST /equipments
```

#### Request

```json
{
  "name": "プロジェクターA",
  "category": "PROJECTOR",
  "location": "東京本社 2F",
  "description": "HDMI対応"
}
```

#### Response: 201 Created

```json
{
  "id": "eq_001",
  "name": "プロジェクターA",
  "category": "PROJECTOR",
  "location": "東京本社 2F",
  "description": "HDMI対応",
  "createdAt": "2026-06-10T01:00:00.000Z",
  "updatedAt": "2026-06-10T01:00:00.000Z"
}
```

---

### 備品一覧取得

```http
GET /equipments
```

#### Query Parameters

```txt
category=PROJECTOR
location=東京本社
```

#### Response: 200 OK

```json
{
  "items": [
    {
      "id": "eq_001",
      "name": "プロジェクターA",
      "category": "PROJECTOR",
      "location": "東京本社 2F",
      "description": "HDMI対応"
    }
  ]
}
```

---

## 7.3 予約 API

### 予約作成

```http
POST /reservations
```

#### Request

```json
{
  "resourceType": "MEETING_ROOM",
  "resourceId": "mr_001",
  "userId": "user_001",
  "startAt": "2026-06-11T10:00:00+09:00",
  "endAt": "2026-06-11T11:00:00+09:00",
  "purpose": "定例ミーティング"
}
```

#### Response: 201 Created

```json
{
  "id": "res_001",
  "resourceType": "MEETING_ROOM",
  "resourceId": "mr_001",
  "userId": "user_001",
  "startAt": "2026-06-11T10:00:00+09:00",
  "endAt": "2026-06-11T11:00:00+09:00",
  "purpose": "定例ミーティング",
  "status": "RESERVED",
  "cancelledAt": null,
  "createdAt": "2026-06-10T01:00:00.000Z",
  "updatedAt": "2026-06-10T01:00:00.000Z"
}
```

---

### 予約一覧取得

```http
GET /reservations
```

#### Query Parameters

```txt
userId=user_001
resourceType=MEETING_ROOM
resourceId=mr_001
status=RESERVED
from=2026-06-11T00:00:00+09:00
to=2026-06-12T00:00:00+09:00
```

#### Response: 200 OK

```json
{
  "items": [
    {
      "id": "res_001",
      "resourceType": "MEETING_ROOM",
      "resourceId": "mr_001",
      "userId": "user_001",
      "startAt": "2026-06-11T10:00:00+09:00",
      "endAt": "2026-06-11T11:00:00+09:00",
      "purpose": "定例ミーティング",
      "status": "RESERVED",
      "cancelledAt": null
    }
  ]
}
```

---

### 予約詳細取得

```http
GET /reservations/{reservationId}
```

#### Response: 200 OK

```json
{
  "id": "res_001",
  "resourceType": "MEETING_ROOM",
  "resourceId": "mr_001",
  "userId": "user_001",
  "startAt": "2026-06-11T10:00:00+09:00",
  "endAt": "2026-06-11T11:00:00+09:00",
  "purpose": "定例ミーティング",
  "status": "RESERVED",
  "cancelledAt": null,
  "createdAt": "2026-06-10T01:00:00.000Z",
  "updatedAt": "2026-06-10T01:00:00.000Z"
}
```

---

### 予約キャンセル

```http
PATCH /reservations/{reservationId}/cancel
```

#### Request

```json
{
  "userId": "user_001"
}
```

#### Response: 200 OK

```json
{
  "id": "res_001",
  "status": "CANCELLED",
  "cancelledAt": "2026-06-10T03:00:00.000Z"
}
```

---

### 予約可能リソース検索

```http
GET /available-resources
```

#### Query Parameters

```txt
resourceType=MEETING_ROOM
startAt=2026-06-11T10:00:00+09:00
endAt=2026-06-11T11:00:00+09:00
capacityGte=4
```

#### Response: 200 OK

```json
{
  "items": [
    {
      "resourceType": "MEETING_ROOM",
      "id": "mr_002",
      "name": "会議室B",
      "capacity": 6,
      "location": "東京本社 4F"
    }
  ]
}
```

---

## 8. エラーレスポンス仕様

### 共通フォーマット

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容が不正です。",
    "details": [
      {
        "path": "startAt",
        "message": "開始日時は終了日時より前である必要があります。"
      }
    ]
  }
}
```

### エラーコード一覧

| HTTP Status | code                              | 説明                       |
| ----------- | --------------------------------- | -------------------------- |
| 400         | VALIDATION_ERROR                  | 入力値が不正               |
| 400         | INVALID_MEETING_ROOM              | 会議室の業務ルール違反     |
| 400         | INVALID_EQUIPMENT                 | 備品の業務ルール違反       |
| 400         | INVALID_RESERVATION               | 予約の業務ルール違反       |
| 400         | INVALID_RESERVATION_PERIOD        | 予約期間が不正             |
| 400         | INVALID_RESOURCE_TYPE             | リソース種別が不正         |
| 400         | INVALID_RESERVATION_STATUS        | 予約ステータスが不正       |
| 400         | INVALID_EQUIPMENT_CATEGORY        | 備品カテゴリが不正         |
| 400         | RESERVATION_START_AT_MUST_BE_FUTURE | 予約開始日時が現在日時以前 |
| 404         | RESOURCE_NOT_FOUND                | リソースが存在しない       |
| 404         | RESERVATION_NOT_FOUND             | 予約が存在しない           |
| 409         | MEETING_ROOM_ALREADY_EXISTS       | 同名の会議室が存在する     |
| 409         | EQUIPMENT_ALREADY_EXISTS          | 同名の備品が存在する       |
| 409         | RESERVATION_CONFLICT              | 予約時間が重複している     |
| 409         | ALREADY_CANCELLED                 | 予約がすでにキャンセル済み |
| 403         | FORBIDDEN                         | 操作権限がない             |
| 500         | INTERNAL_SERVER_ERROR             | 想定外のサーバーエラー     |

---

## 9. データモデル

## 9.1 MeetingRoom

| 項目        | 型     | 説明      |
| ----------- | ------ | --------- |
| id          | string | 会議室 ID |
| name        | string | 会議室名  |
| capacity    | number | 収容人数  |
| location    | string | 場所      |
| description | string | 備考      |
| createdAt   | Date   | 作成日時  |
| updatedAt   | Date   | 更新日時  |

---

## 9.2 Equipment

| 項目        | 型     | 説明         |
| ----------- | ------ | ------------ |
| id          | string | 備品 ID      |
| name        | string | 備品名       |
| category    | string | 備品カテゴリ |
| location    | string | 保管場所     |
| description | string | 備考         |
| createdAt   | Date   | 作成日時     |
| updatedAt   | Date   | 更新日時     |

---

## 9.3 Reservation

| 項目         | 型        | 説明           |
| ------------ | --------- | -------------- |
| id           | string    | 予約 ID        |
| resourceType | string    | リソース種別   |
| resourceId   | string    | リソース ID    |
| userId       | string    | 予約者 ID      |
| startAt      | Date      | 予約開始日時   |
| endAt        | Date      | 予約終了日時   |
| purpose      | string    | 利用目的       |
| status       | string    | 予約ステータス |
| cancelledAt  | Date/null | キャンセル日時 |
| createdAt    | Date      | 作成日時       |
| updatedAt    | Date      | 更新日時       |

---

## 10. クリーンアーキテクチャ上の設計方針

## 10.1 Domain 層

Domain 層には、アプリケーションの中核となる業務ルールを配置する。

### 配置するもの

- Entity
- Value Object
- Domain Service
- Domain Error

### 例

```txt
domain
|-- entities
|   |-- MeetingRoom
|   |-- Equipment
|   `-- Reservation
|-- valueObjects
|   |-- ReservationPeriod
|   |-- ResourceType
|   |-- ReservationStatus
|   `-- EquipmentCategory
|-- services
|   `-- ReservationConflictService
`-- errors
    |-- DomainError
    |-- MeetingRoomErrors
    |-- EquipmentErrors
    |-- ReservationErrors
    `-- ResourceErrors
```

### Domain 層に書くべきルール

- 予約期間の妥当性
- 予約重複判定
- キャンセル可能かどうか
- 予約ステータスの変更可否

### Domain 層に書かないもの

- HTTP リクエスト・レスポンス処理
- DB アクセス
- ORM の処理
- Web フレームワーク固有の処理

---

## 10.2 Application 層

Application 層には、ユースケースを配置する。
ユーザー操作ごとの処理の流れを表現する。

### 配置するもの

- UseCase
- Repository Interface
- DTO
- Application Error

### 例

```txt
application
|-- usecases
|   |-- CreateReservationUseCase
|   |-- CancelReservationUseCase
|   |-- GetReservationUseCase
|   |-- ListReservationsUseCase
|   |-- SearchAvailableResourcesUseCase
|   |-- CreateMeetingRoomUseCase
|   |-- ListMeetingRoomsUseCase
|   |-- CreateEquipmentUseCase
|   `-- ListEquipmentsUseCase
`-- repositories
    |-- ReservationRepository
    |-- MeetingRoomRepository
    `-- EquipmentRepository
```

### Application 層の責務

- 入力 DTO を受け取る
- 必要な Entity を Repository 経由で取得する
- Domain のルールを使って検証する
- Repository 経由で保存する
- 出力 DTO を返す

---

## 10.3 Interface Adapter 層

Interface Adapter 層には、外部との入出力変換処理を配置する。

### 配置するもの

- Controller
- Request DTO
- Response DTO
- Presenter
- Validator

### 例

```txt
interface
|-- controllers
|   |-- ReservationController
|   |-- MeetingRoomController
|   |-- EquipmentController
|   `-- AvailableResourceController
|-- presenters
|   |-- ReservationPresenter
|   |-- MeetingRoomPresenter
|   |-- EquipmentPresenter
|   `-- AvailableResourcePresenter
`-- http
    `-- errorResponse
```

### 責務

- HTTP リクエストを受け取る
- リクエスト形式のバリデーションを行う
- UseCase に渡す入力 DTO に変換する
- UseCase の結果を HTTP レスポンスに変換する

---

## 10.4 Infrastructure 層

Infrastructure 層には、外部技術に依存する実装を配置する。

### 配置するもの

- Repository 実装
- ORM 設定
- DB 接続
- ID 生成
- 現在日時取得
- Web フレームワーク設定

### 例

```txt
infrastructure
|-- prisma
|   |-- prismaClient.ts
|   |-- mappers
|   `-- repositories
|-- repositories
|   |-- InMemoryReservationRepository
|   |-- InMemoryMeetingRoomRepository
|   `-- InMemoryEquipmentRepository
|-- services
|   |-- SystemClock
|   `-- UuidGenerator
`-- web
    |-- routeFactories
    |-- server
    `-- routes
```

---

## 11. 想定ディレクトリ構成

```txt
src
|-- domain
|   |-- entities
|   |   |-- MeetingRoom.ts
|   |   |-- Equipment.ts
|   |   `-- Reservation.ts
|   |-- valueObjects
|   |   |-- ReservationPeriod.ts
|   |   |-- ResourceType.ts
|   |   |-- ReservationStatus.ts
|   |   `-- EquipmentCategory.ts
|   |-- services
|   |   `-- ReservationConflictService.ts
|   `-- errors
|       |-- DomainError.ts
|       |-- MeetingRoomErrors.ts
|       |-- EquipmentErrors.ts
|       |-- ReservationErrors.ts
|       `-- ResourceErrors.ts
|-- application
|   |-- errors
|   |   |-- ApplicationError.ts
|   |   |-- MeetingRoomApplicationErrors.ts
|   |   |-- EquipmentApplicationErrors.ts
|   |   |-- ReservationApplicationErrors.ts
|   |   `-- ResourceApplicationErrors.ts
|   |-- usecases
|   |   |-- reservations
|   |   |   |-- CreateReservationUseCase.ts
|   |   |   |-- CancelReservationUseCase.ts
|   |   |   |-- GetReservationUseCase.ts
|   |   |   `-- ListReservationsUseCase.ts
|   |   |-- resources
|   |   |   `-- SearchAvailableResourcesUseCase.ts
|   |   |-- meetingRooms
|   |   |   |-- CreateMeetingRoomUseCase.ts
|   |   |   `-- ListMeetingRoomsUseCase.ts
|   |   `-- equipments
|   |       |-- CreateEquipmentUseCase.ts
|   |       `-- ListEquipmentsUseCase.ts
|   |-- repositories
|   |   |-- ReservationRepository.ts
|   |   |-- MeetingRoomRepository.ts
|   |   `-- EquipmentRepository.ts
|   `-- services
|       |-- Clock.ts
|       `-- IdGenerator.ts
|-- interface
|   |-- controllers
|   |   |-- ReservationController.ts
|   |   |-- MeetingRoomController.ts
|   |   |-- EquipmentController.ts
|   |   `-- AvailableResourceController.ts
|   |-- presenters
|   |   |-- ReservationPresenter.ts
|   |   |-- MeetingRoomPresenter.ts
|   |   |-- EquipmentPresenter.ts
|   |   `-- AvailableResourcePresenter.ts
|   `-- http
|       `-- errorResponse.ts
|-- infrastructure
|   |-- prisma
|   |   |-- prismaClient.ts
|   |   |-- mappers
|   |   |   |-- MeetingRoomPrismaMapper.ts
|   |   |   |-- EquipmentPrismaMapper.ts
|   |   |   `-- ReservationPrismaMapper.ts
|   |   `-- repositories
|   |       |-- PrismaReservationRepository.ts
|   |       |-- PrismaMeetingRoomRepository.ts
|   |       `-- PrismaEquipmentRepository.ts
|   |-- repositories
|   |   |-- InMemoryReservationRepository.ts
|   |   |-- InMemoryMeetingRoomRepository.ts
|   |   `-- InMemoryEquipmentRepository.ts
|   |-- services
|   |   |-- SystemClock.ts
|   |   `-- UuidGenerator.ts
|   `-- web
|       |-- routeFactories
|       |   |-- meetingRoomRoutes.ts
|       |   |-- equipmentRoutes.ts
|       |   |-- reservationRoutes.ts
|       |   `-- availableResourceRoutes.ts
|       |-- server.ts
|       `-- routes.ts
`-- main.ts
```

---

## 12. 主要ユースケース詳細

## 12.1 CreateReservationUseCase

### 目的

指定されたリソースを指定時間帯で予約する。

### 処理フロー

1. 入力値を受け取る
2. 予約対象リソースが存在するか確認する
3. 予約期間を生成する
4. 同一リソースの有効予約を取得する
5. 予約期間が重複していないか確認する
6. 予約 Entity を生成する
7. 予約を保存する
8. 作成結果を返す

### 使用する Repository

- ReservationRepository
- MeetingRoomRepository
- EquipmentRepository

### 主な例外

- ResourceNotFoundError
- InvalidReservationPeriodError
- ReservationConflictError

---

## 12.2 CancelReservationUseCase

### 目的

作成済み予約をキャンセルする。

### 処理フロー

1. 予約 ID と userId を受け取る
2. 予約を取得する
3. 予約が存在しない場合はエラー
4. 予約者本人か確認する
5. キャンセル可能か確認する
6. 予約ステータスを CANCELLED に変更する
7. 予約を保存する
8. キャンセル結果を返す

### 使用する Repository

- ReservationRepository

### 主な例外

- ReservationNotFoundError
- ForbiddenError
- AlreadyCancelledError
- CannotCancelPastReservationError

---

## 12.3 SearchAvailableResourcesUseCase

### 目的

指定時間帯で予約可能なリソースを検索する。

### 処理フロー

1. 検索条件を受け取る
2. 予約期間を生成する
3. 条件に合うリソース一覧を取得する
4. 指定時間帯と重複する予約一覧を取得する
5. 重複していないリソースのみ抽出する
6. 結果を返す

### 使用する Repository

- ReservationRepository
- MeetingRoomRepository
- EquipmentRepository

---

## 13. テスト観点

## 13.1 Domain 層のテスト

### ReservationPeriod

- 開始日時が終了日時より前なら生成できる
- 開始日時と終了日時が同じならエラー
- 開始日時が終了日時より後ならエラー

### ReservationConflictService

- 完全に同じ時間帯は重複と判定される
- 一部だけ重なる時間帯は重複と判定される
- 終了時刻と開始時刻が一致する場合は重複しない
- キャンセル済み予約は重複判定から除外される

### Reservation

- 予約中の予約はキャンセルできる
- キャンセル済み予約は再度キャンセルできない
- 予約者本人でなければキャンセルできない
- 過去の予約はキャンセルできない

---

## 13.2 Application 層のテスト

### CreateReservationUseCase

- 正常に予約を作成できる
- 存在しない会議室は予約できない
- 存在しない備品は予約できない
- 重複する予約は作成できない
- キャンセル済み予約とは重複しても作成できる
- 不正な予約期間では作成できない

### CancelReservationUseCase

- 予約者本人ならキャンセルできる
- 他人の予約はキャンセルできない
- 存在しない予約はキャンセルできない
- キャンセル済み予約はキャンセルできない

### SearchAvailableResourcesUseCase

- 指定時間帯で空いている会議室を取得できる
- 指定時間帯で予約済みの会議室は除外される
- 収容人数条件で会議室を絞り込める
- 備品カテゴリで備品を絞り込める

---

## 14. 実装優先順位

### Phase 1: 最小構成

1. MeetingRoom Entity
2. Equipment Entity
3. Reservation Entity
4. ReservationPeriod Value Object
5. Repository Interface
6. InMemory Repository
7. CreateReservationUseCase
8. CancelReservationUseCase
9. REST API

### Phase 2: DB 対応

1. SQLite 導入
2. ORM 導入
3. Repository 実装を InMemory から DB に差し替え
4. Migration 作成

### Phase 3: 検索機能強化

1. 予約一覧検索
2. 予約可能リソース検索
3. 会議室の収容人数検索
4. 備品カテゴリ検索

### Phase 4: 発展機能

1. 認証
2. 管理者権限
3. 予約変更
4. 繰り返し予約
5. メール通知
6. 承認フロー

---

## 15. 受け入れ基準

MVP 完了時点で、以下を満たすこと。

- 会議室を登録できる
- 備品を登録できる
- 登録済み会議室を一覧取得できる
- 登録済み備品を一覧取得できる
- 会議室を予約できる
- 備品を予約できる
- 予約一覧を取得できる
- 予約詳細を取得できる
- 予約をキャンセルできる
- 同一リソースに対して重複予約できない
- キャンセル済み予約は重複判定から除外される
- 予約可能な会議室・備品を検索できる
- Domain 層が Web フレームワークや ORM に依存していない
- Application 層が具体的な Repository 実装に依存していない
- 主要な業務ルールに対する単体テストが存在する

---

## 16. 今後の拡張案

### 認証・認可

- ログイン機能
- 管理者ユーザー
- 自分の予約のみキャンセル可能
- 管理者は全予約をキャンセル可能

### 予約変更

- 予約日時の変更
- 利用目的の変更
- リソースの変更
- 変更時の重複チェック

### 承認フロー

- 予約申請
- 管理者承認
- 管理者却下
- 承認待ちステータス追加

### 通知

- 予約作成時のメール通知
- キャンセル時のメール通知
- 予約開始前リマインド

### カレンダー連携

- Google Calendar 連携
- Outlook Calendar 連携

---
