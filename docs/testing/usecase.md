# UseCase Layer Test Cases

UseCase 層では、Repository Interface に対して InMemory Repository を差し込みます。

Domain 層で確認済みの細かい業務ルールを、UseCase テストで過剰に再テストしません。UseCase では、入力を受け取り、必要な Repository を呼び、Domain のルールを使い、保存し、適切な出力またはエラーを返せることを確認します。

このファイルは UseCase 実装が進んだ段階で具体化します。

## CreateMeetingRoomUseCase

確認すること:

- 同名の会議室が存在しない場合、会議室を作成できる
- 同名の会議室が存在する場合、作成に失敗する
- 作成時に `IdGenerator` の ID を使う
- 作成時に `Clock` の現在日時を `createdAt` / `updatedAt` に使う
- 作成した会議室を Repository に保存する

## ListMeetingRoomsUseCase

確認すること:

- 会議室一覧を取得できる
- `capacityGte` で絞り込める
- `location` で絞り込める
- UseCase の出力が一覧用 DTO の形になる

## CreateEquipmentUseCase

確認すること:

- 同名の備品が存在しない場合、備品を作成できる
- 同名の備品が存在する場合、作成に失敗する
- 作成時に `IdGenerator` の ID を使う
- 作成時に `Clock` の現在日時を `createdAt` / `updatedAt` に使う
- 作成した備品を Repository に保存する

## ListEquipmentsUseCase

確認すること:

- 備品一覧を取得できる
- `category` で絞り込める
- `location` で絞り込める
- UseCase の出力が一覧用 DTO の形になる

## CreateReservationUseCase

確認すること:

- 存在するリソースなら予約を作成できる
- 存在しない会議室は予約できない
- 存在しない備品は予約できない
- 重複予約がある場合は予約作成に失敗する
- 重複予約がない場合は予約作成に成功する
- キャンセル済み予約とは重複しても予約作成できる

## CancelReservationUseCase

確認すること:

- 予約者本人ならキャンセルできる
- 他人の予約はキャンセルできない
- 存在しない予約はキャンセルできない
- キャンセル済み予約はキャンセルできない
- キャンセルした予約を Repository に保存する

## GetReservationUseCase

確認すること:

- 存在する予約の詳細を取得できる
- 存在しない予約は取得できない
- UseCase の出力が詳細用 DTO の形になる

## ListReservationsUseCase

確認すること:

- 予約一覧を取得できる
- `userId` で絞り込める
- `resourceType` で絞り込める
- `resourceId` で絞り込める
- `status` で絞り込める
- `from` / `to` で絞り込める
- UseCase の出力が一覧用 DTO の形になる

## SearchAvailableResourcesUseCase

暫定で確認すること:

- 指定時間帯で空いている会議室を取得できる
- 指定時間帯で予約済みの会議室は除外される
- 収容人数条件で会議室を絞り込める
- 備品カテゴリで備品を絞り込める
