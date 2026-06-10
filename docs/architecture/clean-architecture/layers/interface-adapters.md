# Interface Adapters Layer

Interface Adapters 層は、外部から来た入力を UseCase が扱いやすい形に変換し、UseCase の結果を外部へ返しやすい形に変換する層です。

このプロジェクトでは `src/interface` を Interface Adapters 層として扱います。

## 責務

- HTTP request を受け取る
- Request の形式を検証する
- Request DTO から UseCase Input DTO に変換する
- UseCase を呼び出す
- UseCase Output DTO から Response DTO に変換する
- HTTP status code と JSON response を組み立てる

## 置くもの

- Controller
- Presenter
- Request DTO
- Response DTO
- ViewModel
- HTTP 入力の形式バリデーション

## Controller

Controller は Express の request / response を直接受け取る入口です。

ただし、業務ルールは Controller に書きません。Controller は入力変換と UseCase 呼び出しに集中します。

## Presenter

Presenter は UseCase の出力を HTTP response の形に変換します。

日時を ISO 8601 形式の文字列にする、不要な内部情報を隠す、API 仕様に合わせて `items` で包む、といった処理を担当します。

## Domain との境界

Interface Adapters 層は Domain Entity を直接返すのではなく、Response DTO に変換して返します。

これにより、Domain の内部表現を API 仕様から切り離せます。

