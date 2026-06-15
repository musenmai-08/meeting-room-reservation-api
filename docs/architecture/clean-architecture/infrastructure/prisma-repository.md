# Prisma Repository Design

このドキュメントは、Prisma Repository を実装する前に決めておく設計方針をまとめるものです。

Prisma Repository は Infrastructure 層の実装です。Application 層の Repository Interface を実装し、DB と Domain Entity の変換を担当します。

## 目的

- UseCase から Prisma Client を隠す
- Prisma model と Domain Entity を分離する
- InMemory Repository から Prisma Repository へ差し替えられるようにする
- DB の保存形式と Domain の業務ルールを混同しない

## 基本方針

- UseCase は Repository Interface だけに依存する
- Prisma Repository は `src/application/repositories/*` の Interface を implements する
- Prisma Client の型は Infrastructure 層の外へ出さない
- Prisma record から Domain Entity へ復元するときは、必ず Entity / Value Object の factory を通す
- Domain Entity から DB に保存するときは、Repository 内で Prisma の保存形式へ変換する

## 配置

予定する配置:

```txt
src/infrastructure/prisma/
  prismaClient.ts
  mappers/
    MeetingRoomPrismaMapper.ts
    EquipmentPrismaMapper.ts
    ReservationPrismaMapper.ts
  repositories/
    PrismaMeetingRoomRepository.ts
    PrismaEquipmentRepository.ts
    PrismaReservationRepository.ts
```

既存の InMemory Repository は学習用・テスト用 Fake として残します。

## Prisma Schema 方針

`prisma/schema.prisma` には、まず次の model を定義します。

```txt
MeetingRoom
Equipment
Reservation
```

### MeetingRoom

保存する項目:

```txt
id
name
capacity
location
description
createdAt
updatedAt
```

`name` は同名登録を防ぐため unique にします。

### Equipment

保存する項目:

```txt
id
name
category
location
description
createdAt
updatedAt
```

`name` は同名登録を防ぐため unique にします。

`category` は Domain の `EquipmentCategory` と同じ値を保存します。

### Reservation

保存する項目:

```txt
id
resourceType
resourceId
userId
startAt
endAt
purpose
status
cancelledAt
createdAt
updatedAt
```

`resourceType` と `resourceId` の組み合わせで、会議室予約と備品予約の両方を表現します。

## Enum / Value Object の保存方針

Domain の Value Object は DB へそのまま保存しません。

保存時は文字列に変換します。

```txt
ResourceType.MeetingRoom -> "MEETING_ROOM"
EquipmentCategory.Projector -> "PROJECTOR"
ReservationStatus.Reserved -> "RESERVED"
```

復元時は Domain 側の parse / factory を通します。

```ts
parseResourceType(record.resourceType)
parseEquipmentCategory(record.category)
parseReservationStatus(record.status)
ReservationPeriod.create(record.startAt, record.endAt)
```

## Date の保存方針

Date は Prisma / DB では `DateTime` として保存します。

API では ISO 8601 文字列を受け取り、Controller で `Date` に変換します。

Domain / UseCase / Repository では `Date` として扱います。

## Mapper 方針

Prisma Repository 内に変換処理を書き散らさず、Mapper に寄せます。

例:

```txt
MeetingRoomPrismaMapper.toDomain(record)
MeetingRoomPrismaMapper.toPersistence(entity)
```

Mapper は Infrastructure 層の詳細です。Application 層や Domain 層から import しません。

## Repository 実装方針

### PrismaMeetingRoomRepository

実装するメソッド:

```txt
save
findById
findByName
findAll
```

`findAll` では `capacityGte` と `location` を Prisma の `where` 条件に変換します。

### PrismaEquipmentRepository

実装するメソッド:

```txt
save
findById
findByName
findAll
```

`findAll` では `category` と `location` を Prisma の `where` 条件に変換します。

### PrismaReservationRepository

実装するメソッド:

```txt
save
findById
findAll
findByResource
findOverlappingByResourceType
```

重複検索では、Domain と同じ条件を DB query に変換します。

```txt
existing.startAt < input.endAt
input.startAt < existing.endAt
```

キャンセル済み予約は重複判定から除外します。

## テスト方針

Prisma Repository のテストは Integration Test として扱います。

確認すること:

- 保存した Entity を取得できる
- Prisma record から Domain Entity に復元できる
- Domain Entity から Prisma record に保存できる
- 検索条件が DB query に反映される
- 予約重複検索が正しく動く
- キャンセル済み予約が重複検索から除外される

確認しすぎないこと:

- Entity / Value Object の全業務ルール
- UseCase の処理フロー
- API の request / response 変換

これらは Domain / UseCase / API テストで確認済みのため、Repository テストでは DB との変換と検索条件に集中します。

## 実装順

1. `schema.prisma` に model を定義する
2. migration を作成する
3. Prisma Client を生成する
4. `prismaClient.ts` を作る
5. Mapper を作る
6. `PrismaMeetingRoomRepository` を実装する
7. `PrismaEquipmentRepository` を実装する
8. `PrismaReservationRepository` を実装する
9. Repository Integration Test を書く
10. `routes.ts` の Repository 実装を Prisma へ差し替える
