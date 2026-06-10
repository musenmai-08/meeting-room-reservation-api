# Domain Layer Test Cases

Domain 層では、DB や Web フレームワークを使わず、純粋な TypeScript のクラスとしてテストします。

## 実装順の目安

この順番は固定ルールではなく、業務ルールの重要度と依存関係に基づく目安です。

まず書くテスト:

```txt
tests/domain/valueObjects/ReservationPeriod.test.ts
tests/domain/entities/Reservation.test.ts
tests/domain/services/ReservationConflictService.test.ts
```

続けて書くテスト:

```txt
tests/domain/entities/MeetingRoom.test.ts
tests/domain/entities/Equipment.test.ts
tests/domain/valueObjects/ResourceType.test.ts
tests/domain/valueObjects/ReservationStatus.test.ts
tests/domain/valueObjects/EquipmentCategory.test.ts
```

## ReservationPeriod

確認すること:

- 開始日時が終了日時より前なら生成できる
- 開始日時と終了日時が同じならエラー
- 開始日時が終了日時より後ならエラー
- 完全に同じ時間帯は重複する
- 一部だけ重なる時間帯は重複する
- 終了時刻と開始時刻が一致する場合は重複しない

`ReservationPeriod` は期間同士の重複判定だけを確認します。予約ステータスを見てキャンセル済み予約を除外する責務は `ReservationConflictService` で確認します。

## Reservation

確認すること:

- 予約中の予約は本人ならキャンセルできる
- 他人の予約はキャンセルできない
- キャンセル済み予約は再度キャンセルできない
- 現在日時が予約開始日時以降の場合、キャンセルできない
- キャンセルすると `status` が `CANCELLED` になり、`cancelledAt` が入る

## ReservationConflictService

確認すること:

- 有効予約と新規予約が重なる場合は conflict になる
- 有効予約と新規予約が重ならない場合は conflict にならない
- 終了時刻と開始時刻が一致する場合は conflict にならない
- キャンセル済み予約は重複判定から除外される

細かい時間帯の重複パターンは `ReservationPeriod` で確認します。ここでは複数の予約一覧から、有効予約だけを対象にして conflict を判定できることを重視します。

## MeetingRoom

確認すること:

- `name` が 1 文字なら生成できる
- `name` が 100 文字なら生成できる
- `name` が空ならエラー
- `name` が 101 文字ならエラー
- `capacity` が 1 なら生成できる
- `capacity` が 0 ならエラー
- `capacity` が整数でない場合はエラー

## Equipment

確認すること:

- `name` が 1 文字なら生成できる
- `name` が 100 文字なら生成できる
- `name` が空ならエラー
- `name` が 101 文字ならエラー
- 定義済みカテゴリなら生成できる
- 定義外カテゴリならエラー

## ResourceType

確認すること:

- `MEETING_ROOM` を parse できる
- `EQUIPMENT` を parse できる
- 定義外の値はエラー

## ReservationStatus

確認すること:

- `RESERVED` を parse できる
- `CANCELLED` を parse できる
- 定義外の値はエラー

## EquipmentCategory

確認すること:

- 定義済みカテゴリを parse できる
- 定義外の値はエラー

