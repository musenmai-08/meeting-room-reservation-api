# Infrastructure Layer

Infrastructure 層は、外部技術に依存する具体実装を置く層です。

このプロジェクトでは `src/infrastructure` を Infrastructure 層として扱います。

## 責務

- DB 接続
- Prisma Client の管理
- Repository Interface の具体実装
- InMemory Repository の実装
- 現在日時取得
- ID 生成
- Express server / routes の設定

## Repository 実装

UseCase は Repository Interface に依存し、Infrastructure 層がその具体実装を提供します。

実装候補:

- `InMemoryReservationRepository`
- `InMemoryMeetingRoomRepository`
- `InMemoryEquipmentRepository`
- `PrismaReservationRepository`
- `PrismaMeetingRoomRepository`
- `PrismaEquipmentRepository`

最初は InMemory Repository で UseCase の動きを検証し、最後に Prisma Repository へ差し替えます。

## Prisma

Prisma は DB アクセスの詳細です。

Domain Entity や UseCase が Prisma の型に依存しないようにします。Prisma のモデルと Domain Entity の相互変換は Prisma Repository の中に閉じ込めます。

Prisma Repository の詳細方針は以下にまとめます。

- [Prisma Repository Design](../infrastructure/prisma-repository.md)

## Express

Express は Web フレームワークの詳細です。

Express の request / response は Controller までに留め、UseCase や Domain へ渡しません。

## Clock と IdGenerator

現在日時取得と ID 生成も Infrastructure 層の責務です。

UseCase は `Clock` や `IdGenerator` の Interface に依存し、Infrastructure 層が `SystemClock` や `UuidGenerator` として実装します。
