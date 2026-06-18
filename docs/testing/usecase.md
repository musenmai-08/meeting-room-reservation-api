# UseCase Layer Test Cases

UseCase 層では、Repository Interface に対して InMemory Repository を差し込みます。

Domain 層で確認済みの細かい業務ルールを、UseCase テストで過剰に再テストしません。UseCase では、入力を受け取り、必要な Repository を呼び、Domain のルールを使い、保存し、適切な出力またはエラーを返せることを確認します。

このファイルは実装済み UseCase のテスト観点をまとめます。

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
- 有効な利用停止枠と重複する場合は予約作成に失敗する
- キャンセル済み利用停止枠とは重複しても予約作成できる

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

確認すること:

- 指定時間帯で空いている会議室を取得できる
- 指定時間帯で予約済みの会議室は除外される
- 収容人数条件で会議室を絞り込める
- 備品カテゴリで備品を絞り込める
- 会議室検索では `category` を無視する
- 備品検索では `capacityGte` を無視する
- 有効な利用停止枠と重複する会議室は除外される
- 有効な利用停止枠と重複する備品は除外される
- キャンセル済み利用停止枠のみがあるリソースは除外されない

## CreateResourceUnavailablePeriodUseCase

確認すること:

- 存在する会議室なら利用停止枠を作成できる
- 存在する備品なら利用停止枠を作成できる
- 存在しないリソースは利用停止枠を作成できない
- 開始日時が現在日時以前の場合は作成できない
- 有効な利用停止枠と重複する場合は作成できない
- 有効予約と重複する場合は作成できない
- 作成した利用停止枠を Repository に保存する

## CancelResourceUnavailablePeriodUseCase

確認すること:

- 存在する利用停止枠をキャンセルできる
- 存在しない利用停止枠はキャンセルできない
- キャンセル済み利用停止枠は再度キャンセルできない
- 開始済み利用停止枠はキャンセルできない
- キャンセルした利用停止枠を Repository に保存する

## GetResourceUnavailablePeriodUseCase

確認すること:

- 存在する利用停止枠の詳細を取得できる
- 存在しない利用停止枠は取得できない
- UseCase の出力が詳細用 DTO の形になる

## ListResourceUnavailablePeriodsUseCase

確認すること:

- 利用停止枠一覧を取得できる
- `resourceType` で絞り込める
- `resourceId` で絞り込める
- `status` で絞り込める
- `from` / `to` で絞り込める
- UseCase の出力が一覧用 DTO の形になる
