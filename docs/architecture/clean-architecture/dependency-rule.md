# Dependency Rule

クリーンアーキテクチャでは、依存の向きは常に外側から内側へ向けます。

このプロジェクトでは、中心から順に以下の層として扱います。

```txt
Domain
  <- Application
    <- Interface Adapters
      <- Infrastructure
```

## 依存してよい方向

- Application 層は Domain 層に依存してよい
- Interface Adapters 層は Application 層と Domain 層に依存してよい
- Infrastructure 層は Application 層と Domain 層に依存してよい
- Domain 層は他の層に依存しない

## 依存してはいけない方向

- Domain 層から Application 層へ依存しない
- Domain 層から Express や Prisma へ依存しない
- Application 層から Prisma Repository のような具体実装へ依存しない
- UseCase から HTTP request / response を直接扱わない

## Repository Interface と実装の分離

UseCase は `ReservationRepository` のような Repository Interface に依存します。

実際の保存先が InMemory なのか Prisma なのかは、UseCase から見えないようにします。これにより、最初は InMemory Repository で業務フローをテストし、最後に Prisma Repository へ差し替えられます。

## 現在日時と ID 生成

現在日時の取得や ID 生成も外側の詳細です。

Domain Entity が `new Date()` や UUID ライブラリを直接呼ぶと、テストしづらくなります。そのため、UseCase が `Clock` や `IdGenerator` から値を受け取り、Domain へ渡す構成にします。

