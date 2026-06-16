# Entity Layer

Entity 層は、アプリケーションの中核となる業務ルールを表現する層です。

このプロジェクトでは `src/domain` を Entity 層として扱います。Domain 層には Entity、Value Object、Domain Service、Domain Error を置きます。

## Entity

### MeetingRoom

会議室を表します。

保持する値:

- `id`
- `name`
- `capacity`
- `location`
- `description`
- `createdAt`
- `updatedAt`

守るルール:

- `name` は 1 文字以上 100 文字以内
- `capacity` は 1 以上

同名の会議室が存在するかどうかは、Repository で既存データを確認する必要があるため UseCase 側で扱います。

### Equipment

備品を表します。

保持する値:

- `id`
- `name`
- `category`
- `location`
- `description`
- `createdAt`
- `updatedAt`

守るルール:

- `name` は 1 文字以上 100 文字以内
- `category` は定義済みカテゴリのいずれか

同名の備品が存在するかどうかは、Repository で既存データを確認する必要があるため UseCase 側で扱います。

### Reservation

予約を表します。

保持する値:

- `id`
- `resourceType`
- `resourceId`
- `userId`
- `period`
- `purpose`
- `status`
- `cancelledAt`
- `createdAt`
- `updatedAt`

守るルール:

- `userId` は空にできない
- `purpose` は 1 文字以上 200 文字以内
- 予約中の予約は `cancelledAt` を持てない
- キャンセル済み予約は `cancelledAt` を持つ
- キャンセル済み予約は再度キャンセルできない
- 予約者本人のみキャンセルできる
- 開始日時を過ぎた予約はキャンセルできない
- キャンセルすると `status` は `CANCELLED` になり、`cancelledAt` が入る

指定されたリソースが存在するかどうかは Repository が必要なため、UseCase 側で確認します。

## Value Object

### ReservationPeriod

予約期間を表します。

保持する値:

- `startAt`
- `endAt`

守るルール:

- `startAt < endAt` であること

担当する振る舞い:

- 別の `ReservationPeriod` と重複するか判定する

重複判定の基本式:

```txt
existing.startAt < new.endAt
&&
new.startAt < existing.endAt
```

終了時刻と開始時刻が同じ場合は重複しません。

```txt
10:00 - 11:00
11:00 - 12:00
```

この場合、前の予約の `endAt` と次の予約の `startAt` は一致していますが、時間帯は重なっていないため予約可能です。

### ResourceType

予約対象リソースの種別を表します。

値:

- `MEETING_ROOM`
- `EQUIPMENT`

### ReservationStatus

予約ステータスを表します。

値:

- `RESERVED`
- `CANCELLED`

現在の MVP では、予約ステータスの変更は `RESERVED -> CANCELLED` のみです。

### EquipmentCategory

備品カテゴリを表します。

値:

- `PROJECTOR`
- `MONITOR`
- `MICROPHONE`
- `SPEAKER`
- `WHITEBOARD`
- `OTHER`

## Domain Service

### ReservationConflictService

同一リソースの既存予約と、新しい予約期間が重複しているかを判定します。

責務:

- 有効な予約だけを重複判定の対象にする
- `CANCELLED` の予約は重複判定から除外する
- `ReservationPeriod` の重複判定を使って、予約できるかどうかを判断する

複数の `Reservation` を比較する処理なので、特定の Entity ではなく Domain Service に置きます。

## Domain Error

Domain 層では、業務ルール違反を表す Error を定義します。

候補:

- `DomainError`
- `InvalidReservationPeriodError`
- `AlreadyCancelledError`
- `CannotCancelPastReservationError`
- `ReservationCancellationForbiddenError`
- `InvalidMeetingRoomError`
- `InvalidEquipmentError`
- `InvalidEquipmentCategoryError`
- `InvalidReservationError`
- `InvalidReservationStatusError`
- `InvalidResourceTypeError`

`ResourceNotFoundError`、`ReservationNotFoundError`、`ReservationConflictError` は、Repository で取得した結果に対する UseCase 側の判断なので、Application Error として扱います。

## Domain 層に置くもの

- Entity の生成ルール
- Value Object の妥当性
- 予約期間の妥当性
- 予約重複判定
- キャンセル可否
- 予約ステータスの変更ルール
- 業務ルール違反を表す Domain Error

## Domain 層に置かないもの

- HTTP request / response
- Express の Controller
- Prisma Client
- DB アクセス
- Repository 実装
- ID 生成
- 現在日時の取得
- 入力 DTO / 出力 DTO

## 最初に作る Domain ファイル

```txt
src/domain
|-- entities
|   |-- MeetingRoom.ts
|   |-- Equipment.ts
|   `-- Reservation.ts
|-- valueObjects
|   |-- ReservationPeriod.ts
|   |-- ResourceType.ts
|   |-- ReservationStatus.ts
|   `-- EquipmentCategory.ts
|-- services
|   `-- ReservationConflictService.ts
`-- errors
    |-- DomainError.ts
    |-- MeetingRoomErrors.ts
    |-- EquipmentErrors.ts
    |-- ReservationErrors.ts
    `-- ResourceErrors.ts
```

実装順は、まず `ReservationPeriod`、次に `Reservation`、最後に `ReservationConflictService` とすると、予約ルールの中心から理解しやすくなります。
