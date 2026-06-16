# Directory Structure

現在の `src` 配下は、以下の構成です。

```txt
src
|-- domain
|   |-- entities
|   |   |-- MeetingRoom.ts
|   |   |-- Equipment.ts
|   |   `-- Reservation.ts
|   |-- valueObjects
|   |   |-- ReservationPeriod.ts
|   |   |-- ResourceType.ts
|   |   |-- ReservationStatus.ts
|   |   `-- EquipmentCategory.ts
|   |-- services
|   |   `-- ReservationConflictService.ts
|   `-- errors
|       |-- DomainError.ts
|       |-- MeetingRoomErrors.ts
|       |-- EquipmentErrors.ts
|       |-- ReservationErrors.ts
|       `-- ResourceErrors.ts
|-- application
|   |-- errors
|   |   |-- ApplicationError.ts
|   |   |-- MeetingRoomApplicationErrors.ts
|   |   |-- EquipmentApplicationErrors.ts
|   |   |-- ReservationApplicationErrors.ts
|   |   `-- ResourceApplicationErrors.ts
|   |-- usecases
|   |   |-- reservations
|   |   |   |-- CreateReservationUseCase.ts
|   |   |   |-- CancelReservationUseCase.ts
|   |   |   |-- GetReservationUseCase.ts
|   |   |   `-- ListReservationsUseCase.ts
|   |   |-- resources
|   |   |   `-- SearchAvailableResourcesUseCase.ts
|   |   |-- meetingRooms
|   |   |   |-- CreateMeetingRoomUseCase.ts
|   |   |   `-- ListMeetingRoomsUseCase.ts
|   |   `-- equipments
|   |       |-- CreateEquipmentUseCase.ts
|   |       `-- ListEquipmentsUseCase.ts
|   |-- repositories
|   |   |-- ReservationRepository.ts
|   |   |-- MeetingRoomRepository.ts
|   |   `-- EquipmentRepository.ts
|   `-- services
|       |-- Clock.ts
|       `-- IdGenerator.ts
|-- interface
|   |-- controllers
|   |   |-- ReservationController.ts
|   |   |-- MeetingRoomController.ts
|   |   |-- EquipmentController.ts
|   |   `-- AvailableResourceController.ts
|   |-- presenters
|   |   |-- ReservationPresenter.ts
|   |   |-- MeetingRoomPresenter.ts
|   |   |-- EquipmentPresenter.ts
|   |   `-- AvailableResourcePresenter.ts
|   `-- http
|       `-- errorResponse.ts
|-- infrastructure
|   |-- prisma
|   |   |-- prismaClient.ts
|   |   |-- mappers
|   |   |   |-- MeetingRoomPrismaMapper.ts
|   |   |   |-- EquipmentPrismaMapper.ts
|   |   |   `-- ReservationPrismaMapper.ts
|   |   `-- repositories
|   |       |-- PrismaReservationRepository.ts
|   |       |-- PrismaMeetingRoomRepository.ts
|   |       `-- PrismaEquipmentRepository.ts
|   |-- repositories
|   |   |-- InMemoryReservationRepository.ts
|   |   |-- InMemoryMeetingRoomRepository.ts
|   |   `-- InMemoryEquipmentRepository.ts
|   |-- services
|   |   |-- SystemClock.ts
|   |   `-- UuidGenerator.ts
|   `-- web
|       |-- routeFactories
|       |   |-- meetingRoomRoutes.ts
|       |   |-- equipmentRoutes.ts
|       |   |-- reservationRoutes.ts
|       |   `-- availableResourceRoutes.ts
|       |-- server.ts
|       `-- routes.ts
`-- main.ts
```

## Domain

業務ルールの中心です。

予約期間の妥当性、予約重複判定、予約キャンセル可否、予約ステータス変更などを扱います。Express、Prisma、HTTP、DB には依存しません。

## Application

ユーザー操作に対応する UseCase を置きます。

Repository Interface を通じて Entity を取得・保存し、Domain のルールを使って処理を進めます。

## Interface Adapters

HTTP request を UseCase の入力 DTO に変換し、UseCase の出力を HTTP response に変換します。

Controller、Presenter、Request DTO、Response DTO などを置きます。

## Infrastructure

外部技術に依存する具体実装を置きます。

Express の server / routes、Prisma Client、Repository 実装、現在日時取得、ID 生成などを扱います。
