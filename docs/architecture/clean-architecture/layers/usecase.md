# UseCase Layer

UseCase 層は、ユーザー操作に対応するアプリケーション処理を表します。

このプロジェクトでは `src/application` を UseCase 層として扱います。

## 責務

- 入力 DTO を受け取る
- Repository Interface 経由で Entity を取得する
- Domain のルールを使って検証する
- Repository Interface 経由で Entity を保存する
- 出力 DTO を返す

## 置くもの

- UseCase
- Repository Interface
- Application DTO
- Application Error
- `Clock` Interface
- `IdGenerator` Interface

## 主な UseCase

- `CreateReservationUseCase`
- `CancelReservationUseCase`
- `GetReservationUseCase`
- `ListReservationsUseCase`
- `SearchAvailableResourcesUseCase`
- `CreateMeetingRoomUseCase`
- `ListMeetingRoomsUseCase`
- `CreateEquipmentUseCase`
- `ListEquipmentsUseCase`

## Repository Interface

UseCase は具体的な Repository 実装には依存しません。

依存するのは以下のような Interface です。

- `ReservationRepository`
- `MeetingRoomRepository`
- `EquipmentRepository`

これにより、UseCase のテストでは InMemory Repository を使い、本番寄りの実装では Prisma Repository を使えます。

## Application Error

Repository の取得結果や UseCase の流れで判断するエラーは Application 層に置きます。

候補:

- `ResourceNotFoundError`
- `ReservationNotFoundError`
- `ForbiddenError`

Domain Error は業務ルールそのものの違反、Application Error はユースケースの進行上の失敗として分けます。

