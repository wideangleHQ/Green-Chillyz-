import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { Game, GameSession, RewardEventType, RewardSourceType } from '@prisma/client';
import { GameHandler, GameValidationResult } from '../interfaces/game-handler.interface';
import { GameRegistry } from '../registry/game.registry';
import { PrismaService } from '../../../database/prisma.service';

interface SpinSlice {
  id: string;
  campaignSlug: string | null;
  weight: number;
  label: string;
}

@Injectable()
export class SpinWheelService implements GameHandler, OnModuleInit {
  readonly gameSlug = 'spin-wheel';

  constructor(
    private readonly registry: GameRegistry,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.registry.register(this);
  }

  async validateStart(userId: string, game: Game, clientData?: any): Promise<void> {
    // 1. Parse Reward Configuration
    const config = game.rewardConfig as any;
    if (!config || !config.slices || !Array.isArray(config.slices)) {
      throw new BadRequestException('Spin Wheel has invalid or missing slices configuration');
    }

    const slices: SpinSlice[] = config.slices;
    if (slices.length === 0) {
      throw new BadRequestException('Spin Wheel has no configured slices');
    }

    // 2. Server-side Roll of the Outcome based on weights
    const totalWeight = slices.reduce((sum, slice) => sum + (slice.weight || 0), 0);
    if (totalWeight <= 0) {
      throw new BadRequestException('Spin Wheel slices have invalid weights');
    }

    let roll = Math.random() * totalWeight;
    let selectedSlice: SpinSlice = slices[0];

    for (const slice of slices) {
      roll -= slice.weight || 0;
      if (roll <= 0) {
        selectedSlice = slice;
        break;
      }
    }

    // 3. Inject the pre-determined outcome into clientData so it will be saved in session metadata
    if (clientData) {
      clientData.outcomeSliceId = selectedSlice.id;
      clientData.outcomeLabel = selectedSlice.label;
      clientData.outcomeCampaignSlug = selectedSlice.campaignSlug;
    }
  }

  async validateEnd(
    userId: string,
    session: GameSession,
    clientData: any,
  ): Promise<GameValidationResult> {
    const sessionMetadata = session.metadata as Record<string, any>;
    const expectedSliceId = sessionMetadata?.outcomeSliceId;

    if (!expectedSliceId) {
      return {
        isValid: false,
        score: 0,
        reason: 'Session has no pre-determined outcome recorded',
      };
    }

    const claimedSliceId = clientData.sliceId;
    if (!claimedSliceId || claimedSliceId !== expectedSliceId) {
      return {
        isValid: false,
        score: 0,
        reason: 'Frontend manipulation detected: spin outcome slice does not match server roll',
      };
    }

    const campaignSlug = sessionMetadata.outcomeCampaignSlug;
    
    // If empty/null campaignSlug, it was a "No Reward" slice
    if (!campaignSlug) {
      return {
        isValid: true,
        score: 1, // basic score indicating successful spin
        reason: 'Spin completed with no reward',
      };
    }

    // Fetch corresponding campaign to ensure it exists
    const campaign = await this.prisma.rewardCampaign.findUnique({
      where: { slug: campaignSlug },
      select: { id: true, brandIds: true, storeIds: true },
    });

    if (!campaign) {
      return {
        isValid: false,
        score: 0,
        reason: `Mapped campaign with slug "${campaignSlug}" not found or inactive`,
      };
    }

    // Populate user profile to match store/brand if campaign requires it
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      include: { customerProfile: true, staffProfile: true },
    });

    const userStoreId = user?.customerProfile?.assignedStoreId || user?.staffProfile?.storeId;

    return {
      isValid: true,
      score: 10, // positive spin score
      rewardEvent: {
        eventType: RewardEventType.GAME_COMPLETED,
        source: RewardSourceType.GAME,
        referenceId: session.id,
        referenceType: 'game_session',
        storeId: userStoreId,
        metadata: {
          campaignSlug,
          sliceId: claimedSliceId,
        },
      },
    };
  }
}
