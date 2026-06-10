# Repository Test Cases

Repository 実装のテスト方針をまとめます。

このファイルは Repository Interface と実装が進んだ段階で具体化します。

## InMemory Repository

InMemory Repository は UseCase テスト用の Fake として扱います。

方針:

- 本番用 Repository と同等の永続化責務を完全に再現しない
- UseCase テストに必要な最低限の振る舞いだけを実装する
- 複雑な検索条件を過剰に作り込まない

## Prisma Repository

Prisma Repository のテストは、DB を使う Integration Test として扱います。

暫定で確認すること:

- Prisma schema と Domain Entity の相互変換ができる
- 保存した Entity を取得できる
- 更新結果が DB に反映される
- 検索条件が正しく反映される
- Domain の業務ルールを再テストしすぎない

