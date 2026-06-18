import { ResourceUnavailablePeriodNotFoundError } from "@application/errors/ResourceUnavailablePeriodError";
import { ResourceUnavailablePeriodRepository } from "@application/repositories/ResourceUnavailablePeriodRepository";
import { Clock } from "@application/services/Clock";
import { ResourceUnavailablePeriodStatus } from "@domain/valueObjects/ResourceUnavailablePeriodStatus";

export type CancelResourceUnavailablePeriodInput = {
  id: string;
};

export type CancelResourceUnavailablePeriodOutput = {
  id: string;
  status: ResourceUnavailablePeriodStatus;
  cancelledAt: Date | null;
};

export class CancelResourceUnavailablePeriodUseCase {
  public constructor(
    private readonly resourceUnavailablePeriodRepository: ResourceUnavailablePeriodRepository,
    private readonly clock: Clock,
  ) {}

  public async execute(
    input: CancelResourceUnavailablePeriodInput,
  ): Promise<CancelResourceUnavailablePeriodOutput> {
    const resourceUnavailablePeriod =
      await this.resourceUnavailablePeriodRepository.findById(input.id);

    if (resourceUnavailablePeriod === null) {
      throw new ResourceUnavailablePeriodNotFoundError();
    }

    const cancelledResourceUnavailablePeriod = resourceUnavailablePeriod.cancel(
      this.clock.now(),
    );

    await this.resourceUnavailablePeriodRepository.save(
      cancelledResourceUnavailablePeriod,
    );

    return {
      id: cancelledResourceUnavailablePeriod.id,
      status: cancelledResourceUnavailablePeriod.status,
      cancelledAt: cancelledResourceUnavailablePeriod.cancelledAt,
    };
  }
}
