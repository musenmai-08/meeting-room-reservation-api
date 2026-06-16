# Repository Test Cases

Repository 実装のテスト方針をまとめます。

このファイルは Repository Interface と Repository 実装のテスト観点をまとめます。

## InMemory Repository

InMemory Repository は UseCase テスト用の Fake として扱います。

方針:

- 本番用 Repository と同等の永続化責務を完全に再現しない
- UseCase テストに必要な最低限の振る舞いだけを実装する
- 複雑な検索条件を過剰に作り込まない

## Prisma Repository

Prisma Repository のテストは、DB を使う Integration Test として扱います。

方針:

- Prisma schema と Domain Entity の相互変換ができる
- 保存した Entity を取得できる
- 更新結果が DB に反映される
- 検索条件が正しく反映される
- Domain の業務ルールを再テストしすぎない
- テストごとに DB の状態を初期化する
- `src/generated/prisma` は git 管理外のため、初回セットアップでは `npx prisma generate` を実行する

実装済みのテスト:

```txt
tests/infrastructure/prisma/repositories/PrismaMeetingRoomRepository.test.ts
tests/infrastructure/prisma/repositories/PrismaEquipmentRepository.test.ts
tests/infrastructure/prisma/repositories/PrismaReservationRepository.test.ts
```

### PrismaMeetingRoomRepository

確認すること:

- [正常系] `save` した MeetingRoom を `findById` で取得できる
- [正常系] `save` した MeetingRoom を `findByName` で取得できる
- [正常系] `findAll` で全件取得できる
- [正常系] `findAll` で `capacityGte` の条件検索ができる
- [正常系] `findAll` で `location` の条件検索ができる
- [正常系] 同じ id で `save` すると更新される
- [異常系] 存在しない id は `null` を返す
- [異常系] 存在しない name は `null` を返す

### PrismaEquipmentRepository

確認すること:

- [正常系] `save` した Equipment を `findById` で取得できる
- [正常系] `save` した Equipment を `findByName` で取得できる
- [正常系] `findAll` で全件取得できる
- [正常系] `findAll` で `category` の条件検索ができる
- [正常系] `findAll` で `location` の条件検索ができる
- [正常系] 同じ id で `save` すると更新される
- [異常系] 存在しない id は `null` を返す
- [異常系] 存在しない name は `null` を返す

### PrismaReservationRepository

確認すること:

- [正常系] `save` した Reservation を `findById` で取得できる
- [正常系] `findAll` で全件取得できる
- [正常系] `findAll` で `userId` の条件検索ができる
- [正常系] `findAll` で `resourceType` / `resourceId` の条件検索ができる
- [正常系] `findAll` で `status` の条件検索ができる
- [正常系] `findAll` で `from` / `to` の期間条件検索ができる
- [正常系] `findByResource` で対象リソースの予約だけ取得できる
- [正常系] `findOverlappingByResourceType` で重複する有効予約を取得できる
- [正常系] `findOverlappingByResourceType` でキャンセル済み予約は除外される
- [正常系] 同じ id で `save` すると更新される
- [異常系] 存在しない id は `null` を返す

## Prisma Repository テスト用 DB

Prisma Repository の Integration Test では、`tests/infrastructure/prisma/prismaTestDatabase.ts` で一時 SQLite DB を作成します。

流れ:

- `describe` 単位で一時 DB を作る
- migration SQL を適用して table を作る
- 各 `it` の前に対象 table を空にする
- `afterAll` で PrismaClient を切断し、一時 DB を削除する

これにより、開発用の `dev.db` を汚さずに Repository 実装を検証します。
