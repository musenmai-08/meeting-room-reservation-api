# UseCase Layer Test Cases

UseCase 層では、Repository Interface に対して InMemory Repository を差し込みます。

Domain 層で確認済みの細かい業務ルールを、UseCase テストで過剰に再テストしません。UseCase では、入力を受け取り、必要な Repository を呼び、Domain のルールを使い、保存し、適切な出力またはエラーを返せることを確認します。

このファイルは UseCase 実装が進んだ段階で具体化します。

## CreateReservationUseCase

暫定で確認すること:

- 存在するリソースなら予約を作成できる
- 存在しない会議室は予約できない
- 存在しない備品は予約できない
- 重複予約がある場合は予約作成に失敗する
- 重複予約がない場合は予約作成に成功する
- キャンセル済み予約とは重複しても予約作成できる

## CancelReservationUseCase

暫定で確認すること:

- 予約者本人ならキャンセルできる
- 他人の予約はキャンセルできない
- 存在しない予約はキャンセルできない
- キャンセル済み予約はキャンセルできない

## SearchAvailableResourcesUseCase

暫定で確認すること:

- 指定時間帯で空いている会議室を取得できる
- 指定時間帯で予約済みの会議室は除外される
- 収容人数条件で会議室を絞り込める
- 備品カテゴリで備品を絞り込める

