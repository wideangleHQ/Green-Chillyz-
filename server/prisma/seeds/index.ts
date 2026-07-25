import { PrismaClient, CampaignStatus, RewardEventType, RewardSourceType } from '@prisma/client';
import process from 'process';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding games and reward campaigns...');

  const startsAt = new Date();
  startsAt.setFullYear(startsAt.getFullYear() - 1);
  const endsAt = new Date();
  endsAt.setFullYear(endsAt.getFullYear() + 2);

  // 1. Create Campaigns for Spin Wheel Outcomes
  const campaigns = [
    {
      name: 'Spin Wheel - 10 Coins',
      slug: 'spin-wheel-10',
      description: 'Reward of 10 coins for spin wheel game slice',
      eventType: RewardEventType.GAME_COMPLETED,
      source: RewardSourceType.GAME,
      status: CampaignStatus.ACTIVE,
      baseCoins: 10,
      startsAt,
      endsAt,
    },
    {
      name: 'Spin Wheel - 50 Coins',
      slug: 'spin-wheel-50',
      description: 'Reward of 50 coins for spin wheel game slice',
      eventType: RewardEventType.GAME_COMPLETED,
      source: RewardSourceType.GAME,
      status: CampaignStatus.ACTIVE,
      baseCoins: 50,
      startsAt,
      endsAt,
    },
    {
      name: 'Spin Wheel - Jackpot',
      slug: 'spin-wheel-jackpot',
      description: 'Jackpot reward of 500 coins for spin wheel game slice',
      eventType: RewardEventType.GAME_COMPLETED,
      source: RewardSourceType.GAME,
      status: CampaignStatus.ACTIVE,
      baseCoins: 500,
      startsAt,
      endsAt,
    },
  ];

  for (const camp of campaigns) {
    await prisma.rewardCampaign.upsert({
      where: { slug: camp.slug },
      update: {
        status: camp.status,
        baseCoins: camp.baseCoins,
        startsAt: camp.startsAt,
        endsAt: camp.endsAt,
      },
      create: camp,
    });
  }
  console.log('Upserted reward campaigns.');

  // 2. Create the Spin Wheel Game Config
  const spinWheelGame = {
    name: 'Spin & Win',
    slug: 'spin-wheel',
    description: 'Spin the daily chili wheel and claim instant bonus coins and mocktail rewards.',
    isActive: true,
    dailyLimit: 1, // 1 play per day
    cooldown: 86400, // 24 hours
    minLevel: 0,
    rewardType: 'COINS',
    rewardConfig: {
      slices: [
        { id: 's1', campaignSlug: 'spin-wheel-10', weight: 40, label: '10 Coins' },
        { id: 's2', campaignSlug: null, weight: 35, label: 'Try Again' },
        { id: 's3', campaignSlug: 'spin-wheel-50', weight: 20, label: '50 Coins' },
        { id: 's4', campaignSlug: 'spin-wheel-jackpot', weight: 5, label: 'Jackpot!' },
      ],
    },
    storeEligibility: [],
    campaignEligibility: [],
  };

  await prisma.game.upsert({
    where: { slug: spinWheelGame.slug },
    update: {
      name: spinWheelGame.name,
      description: spinWheelGame.description,
      isActive: spinWheelGame.isActive,
      dailyLimit: spinWheelGame.dailyLimit,
      cooldown: spinWheelGame.cooldown,
      rewardConfig: spinWheelGame.rewardConfig,
    },
    create: spinWheelGame,
  });

  console.log('Upserted games config.');
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

