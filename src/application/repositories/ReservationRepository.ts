import { Reservation } from "@domain/entities/Reservation";
import { ReservationStatus } from "@domain/valueObjects/ReservationStatus";
import { ResourceType } from "@domain/valueObjects/ResourceType";

export type ReservationSearchCriteria = {
  userId?: string;
  resourceType?: ResourceType;
  resourceId?: string;
  status?: ReservationStatus;
  from?: Date;
  to?: Date;
};

export type ReservationResourceCriteria = {
  resourceType: ResourceType;
  resourceId: string;
  from?: Date;
  to?: Date;
};

export type OverlappingReservationResourceTypeCriteria = {
  resourceType: ResourceType;
  startAt: Date;
  endAt: Date;
};

export interface ReservationRepository {
  save(reservation: Reservation): Promise<void>;
  findById(id: string): Promise<Reservation | null>;
  findAll(criteria?: ReservationSearchCriteria): Promise<Reservation[]>;
  findByResource(criteria: ReservationResourceCriteria): Promise<Reservation[]>;
  findOverlappingByResourceType(
    criteria: OverlappingReservationResourceTypeCriteria,
  ): Promise<Reservation[]>;
}
