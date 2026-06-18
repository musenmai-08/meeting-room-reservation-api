# リソース利用停止枠機能 仕様書

## 概要

リソース利用停止枠機能は、会議室または備品を特定の時間帯に利用不可として登録するための機能です。

利用停止枠が有効な時間帯では、対象リソースへの予約作成を不可にし、予約可能リソース検索の結果からも除外します。

この機能はクリーンアーキテクチャ学習の追加題材として、Domain 層から API / Prisma Repository まで順番に実装します。

## 対象範囲

### 実装する機能

- リソース利用停止枠の登録
- リソース利用停止枠の一覧取得
- リソース利用停止枠の詳細取得
- リソース利用停止枠のキャンセル
- 予約作成時の利用停止枠チェック
- 予約可能リソース検索時の利用停止枠チェック

### 実装しない機能

- ログイン認証
- 管理者権限
- 利用停止枠の変更
- 繰り返し利用停止枠
- 終日利用停止専用 API
- メール通知
- 外部カレンダー連携

## 用語

| 用語                     | 説明                                                                     |
| ------------------------ | ------------------------------------------------------------------------ |
| リソース                 | 予約対象となる会議室または備品                                           |
| 利用停止枠               | 指定した時間帯にリソースを予約不可にする枠                               |
| 有効な利用停止枠         | `ACTIVE` 状態の利用停止枠                                                |
| キャンセル済み利用停止枠 | `CANCELLED` 状態の利用停止枠。予約作成や空き検索では無視する             |
| 操作者                   | 利用停止枠を登録・キャンセルする人。認証は行わず `operatorId` として受け取る |

## 前提条件

- API は REST API とする
- レスポンス形式は JSON とする
- 認証は実装しない
- 操作者はリクエスト時に `operatorId` を渡す
- `resourceType` は `MEETING_ROOM` または `EQUIPMENT` とする
- 日時入力は ISO 8601 形式で扱う
- 日時入力の例では `Asia/Tokyo` の offset を使う
- 日時レスポンスは `Date#toISOString()` により UTC の `Z` 付き文字列で返す
- キャンセル済み利用停止枠は、予約作成と予約可能リソース検索の判定対象外とする

## 業務ルール

### 利用停止枠作成ルール

利用停止枠作成時は、以下の条件をすべて満たす必要があります。

1. 指定されたリソースが存在すること
2. `resourceType` が有効な値であること
3. 開始日時が終了日時より前であること
4. 開始日時が現在日時より後であること
5. `operatorId` が指定されていること
6. `reason` が指定されていること
7. 同一リソースの有効予約と時間帯が重複していないこと
8. 同一リソースの有効な利用停止枠と時間帯が重複していないこと

### 重複判定ルール

以下の条件を満たす場合、時間帯が重複していると判断します。

```txt
既存枠.startAt < 新規枠.endAt
かつ
新規枠.startAt < 既存枠.endAt
```

この判定は、利用停止枠と予約、利用停止枠同士の両方で使います。

| 既存枠        | 新規枠        | 判定       |
| ------------- | ------------- | ---------- |
| 10:00 - 11:00 | 09:00 - 10:00 | 重複しない |
| 10:00 - 11:00 | 11:00 - 12:00 | 重複しない |
| 10:00 - 11:00 | 10:30 - 11:30 | 重複する   |
| 10:00 - 11:00 | 09:30 - 10:30 | 重複する   |
| 10:00 - 11:00 | 10:00 - 11:00 | 重複する   |

### 予約作成への追加ルール

予約作成時は、既存の有効予約との重複に加えて、同一リソースの有効な利用停止枠との重複も確認します。

有効な利用停止枠と重複する場合、予約は作成できません。

### 予約可能リソース検索への追加ルール

予約可能リソース検索では、指定時間帯に有効な利用停止枠と重複するリソースを検索結果から除外します。

キャンセル済み利用停止枠は除外判定の対象にしません。

### 利用停止枠キャンセルルール

利用停止枠キャンセル時は、以下の条件をすべて満たす必要があります。

1. 指定された利用停止枠が存在すること
2. すでにキャンセル済みでないこと
3. 開始日時が現在日時より後であること
4. `operatorId` が指定されていること

キャンセルすると、`status` は `CANCELLED` になり、`cancelledAt` にキャンセル日時が入ります。

## API 仕様

### 利用停止枠作成

```http
POST /resource-unavailable-periods
```

#### Request

```json
{
  "resourceType": "MEETING_ROOM",
  "resourceId": "mr_001",
  "operatorId": "operator_001",
  "startAt": "2026-06-20T10:00:00+09:00",
  "endAt": "2026-06-20T11:00:00+09:00",
  "reason": "メンテナンス"
}
```

#### Response: 201 Created

```json
{
  "id": "rup_001",
  "resourceType": "MEETING_ROOM",
  "resourceId": "mr_001",
  "operatorId": "operator_001",
  "startAt": "2026-06-20T01:00:00.000Z",
  "endAt": "2026-06-20T02:00:00.000Z",
  "reason": "メンテナンス",
  "status": "ACTIVE",
  "cancelledAt": null,
  "createdAt": "2026-06-16T01:00:00.000Z",
  "updatedAt": "2026-06-16T01:00:00.000Z"
}
```

### 利用停止枠一覧取得

```http
GET /resource-unavailable-periods
```

#### Query Parameters

| 項目         | 型     | 必須 | 説明                                   |
| ------------ | ------ | ---- | -------------------------------------- |
| resourceType | string | 任意 | `MEETING_ROOM` または `EQUIPMENT`      |
| resourceId   | string | 任意 | 対象リソース ID                        |
| status       | string | 任意 | `ACTIVE` または `CANCELLED`            |
| from         | string | 任意 | 指定日時以降に関係する利用停止枠を取得 |
| to           | string | 任意 | 指定日時以前に関係する利用停止枠を取得 |

#### Response: 200 OK

```json
{
  "items": [
    {
      "id": "rup_001",
      "resourceType": "MEETING_ROOM",
      "resourceId": "mr_001",
      "operatorId": "operator_001",
      "startAt": "2026-06-20T01:00:00.000Z",
      "endAt": "2026-06-20T02:00:00.000Z",
      "reason": "メンテナンス",
      "status": "ACTIVE",
      "cancelledAt": null
    }
  ]
}
```

### 利用停止枠詳細取得

```http
GET /resource-unavailable-periods/:resourceUnavailablePeriodId
```

#### Response: 200 OK

```json
{
  "id": "rup_001",
  "resourceType": "MEETING_ROOM",
  "resourceId": "mr_001",
  "operatorId": "operator_001",
  "startAt": "2026-06-20T01:00:00.000Z",
  "endAt": "2026-06-20T02:00:00.000Z",
  "reason": "メンテナンス",
  "status": "ACTIVE",
  "cancelledAt": null,
  "createdAt": "2026-06-16T01:00:00.000Z",
  "updatedAt": "2026-06-16T01:00:00.000Z"
}
```

### 利用停止枠キャンセル

```http
PATCH /resource-unavailable-periods/:resourceUnavailablePeriodId/cancel
```

#### Request

```json
{
  "operatorId": "operator_001"
}
```

#### Response: 200 OK

```json
{
  "id": "rup_001",
  "status": "CANCELLED",
  "cancelledAt": "2026-06-16T02:00:00.000Z"
}
```

## 既存 API への影響

### 予約作成

`POST /reservations` は、対象リソースに有効な利用停止枠がある場合、`409 Conflict` を返します。

```json
{
  "error": {
    "code": "RESOURCE_UNAVAILABLE",
    "message": "Resource is unavailable in the specified period."
  }
}
```

### 予約可能リソース検索

`GET /available-resources` は、指定時間帯に有効な利用停止枠と重複するリソースをレスポンスから除外します。

## エラーコード

| HTTP Status | code                                                  | 説明                             |
| ----------- | ----------------------------------------------------- | -------------------------------- |
| 400         | `INVALID_RESOURCE_UNAVAILABLE_PERIOD`                 | 利用停止枠の期間が不正           |
| 400         | `INVALID_RESOURCE_UNAVAILABLE_PERIOD_STATUS`          | 利用停止枠ステータスが不正       |
| 400         | `RESOURCE_UNAVAILABLE_PERIOD_START_AT_MUST_BE_FUTURE` | 開始日時が現在日時以前           |
| 404         | `RESOURCE_UNAVAILABLE_PERIOD_NOT_FOUND`               | 利用停止枠が存在しない           |
| 409         | `RESOURCE_UNAVAILABLE`                                | 予約対象リソースが利用停止中     |
| 409         | `RESOURCE_UNAVAILABLE_PERIOD_CONFLICT`                | 有効な利用停止枠と重複           |
| 409         | `RESOURCE_HAS_ACTIVE_RESERVATION`                     | 有効予約と重複                   |
| 409         | `RESOURCE_UNAVAILABLE_PERIOD_ALREADY_CANCELLED`       | 利用停止枠がすでにキャンセル済み |

## データモデル

```prisma
model ResourceUnavailablePeriod {
  id           String    @id
  resourceType String
  resourceId   String
  operatorId String
  startAt      DateTime
  endAt        DateTime
  reason       String
  status       String
  cancelledAt  DateTime?
  createdAt    DateTime
  updatedAt    DateTime

  @@index([resourceType, resourceId])
  @@index([resourceType, resourceId, status])
  @@index([resourceType, resourceId, startAt, endAt])
}
```

## アーキテクチャ上の追加要素

### Domain 層

```txt
domain
|-- entities
|   `-- ResourceUnavailablePeriod.ts
|-- valueObjects
|   |-- ResourceUnavailablePeriodStatus.ts
|   `-- UnavailablePeriod.ts
|-- services
|   `-- ResourceUnavailablePeriodConflictService.ts
`-- errors
    `-- ResourceUnavailablePeriodErrors.ts
```

Domain 層では、以下を扱います。

- 利用停止枠の期間が妥当か
- 利用停止枠のステータスが妥当か
- 利用停止枠をキャンセルできるか
- 利用停止枠同士が重複しているか
- 利用停止枠と予約が重複しているか

Domain 層では、HTTP、Express、Prisma、DB の知識は持ちません。

### Application 層

```txt
application
|-- repositories
|   `-- ResourceUnavailablePeriodRepository.ts
`-- usecases
    `-- resourceUnavailablePeriods
        |-- CreateResourceUnavailablePeriodUseCase.ts
        |-- CancelResourceUnavailablePeriodUseCase.ts
        |-- GetResourceUnavailablePeriodUseCase.ts
        `-- ListResourceUnavailablePeriodsUseCase.ts
```

追加する Repository Interface の案です。

```ts
export type ResourceUnavailablePeriodSearchCriteria = {
  resourceType?: ResourceType;
  resourceId?: string;
  status?: ResourceUnavailablePeriodStatus;
  from?: Date;
  to?: Date;
};

export type OverlappingResourceUnavailablePeriodCriteria = {
  resourceType: ResourceType;
  resourceId: string;
  startAt: Date;
  endAt: Date;
};

export interface ResourceUnavailablePeriodRepository {
  save(resourceUnavailablePeriod: ResourceUnavailablePeriod): Promise<void>;
  findById(id: string): Promise<ResourceUnavailablePeriod | null>;
  findAll(
    criteria?: ResourceUnavailablePeriodSearchCriteria,
  ): Promise<ResourceUnavailablePeriod[]>;
  findOverlapping(
    criteria: OverlappingResourceUnavailablePeriodCriteria,
  ): Promise<ResourceUnavailablePeriod[]>;
}
```

UseCase 層では、以下を担当します。

- 入力 DTO を受け取る
- 対象リソースの存在を確認する
- 既存予約との重複を確認する
- 既存利用停止枠との重複を確認する
- Domain Entity を作成する
- Repository 経由で保存・取得・キャンセルする
- 出力 DTO を返す

既存 UseCase では、以下を変更します。

- `CreateReservationUseCase.ts`: 有効な利用停止枠との重複チェックを追加する
- `SearchAvailableResourcesUseCase.ts`: 有効な利用停止枠と重複するリソースを除外する

### Interface Adapters 層

```txt
interface
|-- controllers
|   `-- ResourceUnavailablePeriodController.ts
`-- presenters
    `-- ResourceUnavailablePeriodPresenter.ts
```

Controller では Zod を使い、request body / query parameter / path parameter を実行時バリデーションします。

Presenter では UseCase の出力を API response の JSON 形式に変換します。

### Infrastructure 層

```txt
infrastructure
|-- repositories
|   `-- InMemoryResourceUnavailablePeriodRepository.ts
|-- prisma
|   |-- mappers
|   |   `-- ResourceUnavailablePeriodPrismaMapper.ts
|   `-- repositories
|       `-- PrismaResourceUnavailablePeriodRepository.ts
`-- web
    `-- routeFactories
        `-- resourceUnavailablePeriodRoutes.ts
```

InMemory Repository は UseCase テスト用の Fake として使います。

Prisma Repository は、Prisma model と Domain Entity の相互変換、保存、取得、検索条件を扱います。

## テスト観点

### Domain 層

- `[正常系]` 有効な期間で利用停止枠を作成できる
- `[異常系]` 開始日時と終了日時が同じ場合、作成できない
- `[異常系]` 開始日時が終了日時より後の場合、作成できない
- `[異常系]` 開始日時が現在日時以前の場合、作成できない
- `[正常系]` 有効な利用停止枠をキャンセルできる
- `[異常系]` キャンセル済み利用停止枠は再度キャンセルできない
- `[正常系]` 利用停止枠と予約が重複する場合、conflict と判定できる
- `[正常系]` 終了日時と開始日時が一致する場合、conflict と判定しない
- `[正常系]` キャンセル済み利用停止枠は conflict 判定から除外する

### UseCase 層

- `[正常系]` 利用停止枠を作成できる
- `[異常系]` 対象リソースが存在しない場合、作成できない
- `[異常系]` 有効予約と重複する場合、作成できない
- `[異常系]` 有効な利用停止枠と重複する場合、作成できない
- `[正常系]` キャンセル済み利用停止枠とは重複しても作成できる
- `[正常系]` 利用停止枠をキャンセルできる
- `[異常系]` 存在しない利用停止枠はキャンセルできない
- `[異常系]` キャンセル済み利用停止枠は再度キャンセルできない
- `[異常系]` 開始済み利用停止枠はキャンセルできない
- `[異常系]` 予約作成時、有効な利用停止枠と重複する場合は予約できない
- `[正常系]` 予約可能リソース検索で、有効な利用停止枠と重複するリソースを除外できる

### Repository 層

- `[正常系]` 利用停止枠を保存できる
- `[正常系]` ID で利用停止枠を取得できる
- `[正常系]` 条件を指定して利用停止枠を一覧取得できる
- `[正常系]` 同一リソースの重複する有効な利用停止枠を取得できる
- `[正常系]` キャンセル済み利用停止枠を重複検索から除外できる

### API 層

- `[正常系]` `POST /resource-unavailable-periods` で利用停止枠を作成できる
- `[異常系]` request body が不正な場合、400 を返す
- `[異常系]` 対象リソースが存在しない場合、404 を返す
- `[異常系]` 有効予約と重複する場合、409 を返す
- `[異常系]` 有効な利用停止枠と重複する場合、409 を返す
- `[正常系]` `GET /resource-unavailable-periods` で一覧取得できる
- `[正常系]` `GET /resource-unavailable-periods/:resourceUnavailablePeriodId` で詳細取得できる
- `[正常系]` `PATCH /resource-unavailable-periods/:resourceUnavailablePeriodId/cancel` でキャンセルできる
- `[異常系]` `POST /reservations` で利用停止枠と重複する場合、409 を返す
- `[正常系]` `GET /available-resources` で利用停止中のリソースを除外できる

## 実装順序

### Phase 1: Domain

1. `ResourceUnavailablePeriodStatus` を作る
2. `UnavailablePeriod` を作る
3. `ResourceUnavailablePeriod` Entity を作る
4. `ResourceUnavailablePeriodConflictService` を作る
5. `ResourceUnavailablePeriodErrors` を作る
6. Domain 層の単体テストを書く

### Phase 2: Application

1. `ResourceUnavailablePeriodRepository` を作る
2. `InMemoryResourceUnavailablePeriodRepository` を作る
3. `CreateResourceUnavailablePeriodUseCase` を作る
4. `CancelResourceUnavailablePeriodUseCase` を作る
5. `GetResourceUnavailablePeriodUseCase` を作る
6. `ListResourceUnavailablePeriodsUseCase` を作る
7. UseCase 層の単体テストを書く

### Phase 3: Existing UseCase

1. `CreateReservationUseCase` に利用停止枠チェックを追加する
2. `SearchAvailableResourcesUseCase` に利用停止枠除外を追加する
3. 既存 UseCase の単体テストを更新する

### Phase 4: Interface Adapters

1. `ResourceUnavailablePeriodPresenter` を作る
2. `ResourceUnavailablePeriodController` を作る
3. `resourceUnavailablePeriodRoutes.ts` を作る
4. API 結合テストを書く

### Phase 5: Infrastructure

1. `schema.prisma` に model を追加する
2. migration を作成する
3. `npx prisma generate` を実行する
4. `ResourceUnavailablePeriodPrismaMapper` を作る
5. `PrismaResourceUnavailablePeriodRepository` を作る
6. Prisma Repository のテストを書く
7. `routes.ts` の composition root で Prisma Repository を接続する

## 受け入れ条件

- 有効な利用停止枠がある時間帯には予約を作成できない
- キャンセル済み利用停止枠は予約作成を妨げない
- 予約可能リソース検索で、利用停止中のリソースが返らない
- 利用停止枠は一覧・詳細で確認できる
- 利用停止枠は開始前であればキャンセルできる
- Domain / UseCase / Repository / API のテスト観点が更新されている
- 既存の予約機能・空き検索機能のテストが通る

## 実装サポート方針

この機能は学習目的のため、実装はユーザーが行います。

Codex は、実装順序の相談、設計判断の補助、コードレビュー、テスト観点の漏れ確認を中心にサポートします。
