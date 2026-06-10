# Clean Architecture Notes

このディレクトリは、会議室・備品予約 API をクリーンアーキテクチャで実装するための設計メモを管理する場所です。

本プロジェクトでは、業務ルールを Web フレームワークや DB から切り離し、Domain 層と UseCase 層を中心に実装します。Express や Prisma は外側の詳細として扱い、中心のルールがそれらに依存しない構成を目指します。

## 目的

- 業務ルールを Domain 層に集約する
- ユースケース単位で Application 層を設計する
- Repository Interface と実装を分離する
- InMemory Repository で UseCase を先に検証できるようにする
- 最後に Express API と Prisma Repository に接続する

## 読む順番

1. [dependency-rule.md](./dependency-rule.md)
2. [directory-structure.md](./directory-structure.md)
3. [layers/entity.md](./layers/entity.md)
4. [layers/usecase.md](./layers/usecase.md)
5. [layers/interface-adapters.md](./layers/interface-adapters.md)
6. [layers/infrastructure.md](./layers/infrastructure.md)

## 実装順

1. Domain 層の型・Entity・Value Object を作る
2. Domain 層の単体テストを書く
3. Repository Interface を作る
4. InMemory Repository を作る
5. UseCase を作る
6. UseCase の単体テストを書く
7. Express の API とつなぐ
8. Prisma Repository に差し替える

