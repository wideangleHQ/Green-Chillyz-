export const dashboardKeys = {
  all: ['dashboard'] as const,
  me: ['dashboard', 'me'] as const,
  session: ['dashboard', 'session'] as const,
  sessions: ['dashboard', 'sessions'] as const,
};

export const rewardKeys = {
  all: ['rewards-mgmt'] as const,
  profiles: (params?: any) => ['rewards-mgmt', 'profiles', params] as const,
  profile: (id: string) => ['rewards-mgmt', 'profile', id] as const,
  profileVersions: (id: string) => ['rewards-mgmt', 'profile', id, 'versions'] as const,
  defaultProfile: () => ['rewards-mgmt', 'profile', 'default'] as const,
  rules: (params?: any) => ['rewards-mgmt', 'rules', params] as const,
  rulesByProfile: (profileId: string) => ['rewards-mgmt', 'rules', 'profile', profileId] as const,
  milestones: () => ['rewards-mgmt', 'milestones'] as const,
  rule: (id: string) => ['rewards-mgmt', 'rule', id] as const,
  assignments: (params?: any) => ['rewards-mgmt', 'assignments', params] as const,
  myAssignment: () => ['rewards-mgmt', 'assignment', 'my-store'] as const,
  myProfile: () => ['rewards-mgmt', 'assignment', 'my-profile'] as const,
  myAssignmentHistory: () => ['rewards-mgmt', 'assignment', 'my-history'] as const,
  assignmentByStore: (storeId: string) => ['rewards-mgmt', 'assignment', 'store', storeId] as const,
  overrides: (params?: any) => ['rewards-mgmt', 'overrides', params] as const,
  myOverrides: (params?: any) => ['rewards-mgmt', 'overrides', 'my', params] as const,
  overridePreview: () => ['rewards-mgmt', 'overrides', 'preview'] as const,
  myOverrideHistory: () => ['rewards-mgmt', 'overrides', 'my-history'] as const,
  override: (id: string) => ['rewards-mgmt', 'override', id] as const,
  rewardAnalytics: () => ['rewards-mgmt', 'analytics'] as const,
  rewardSearch: (params?: any) => ['rewards-mgmt', 'search', params] as const,
};

export const coinKeys = {
  all: ['coin-economy'] as const,
  rules: () => ['coin-economy', 'rules'] as const,
  gameRules: () => ['coin-economy', 'game-rules'] as const,
  dailyLimits: () => ['coin-economy', 'daily-limits'] as const,
  bonuses: () => ['coin-economy', 'bonuses'] as const,
  coinRules: (params?: any) => ['coin-economy', 'coin-rules', params] as const,
  coinRule: (id: string) => ['coin-economy', 'coin-rule', id] as const,
  coinLimits: () => ['coin-economy', 'coin-limits'] as const,
  coinLimit: (id: string) => ['coin-economy', 'coin-limit', id] as const,
  coinMultipliers: () => ['coin-economy', 'coin-multipliers'] as const,
  coinMultiplier: (id: string) => ['coin-economy', 'coin-multiplier', id] as const,
};

export const challengeKeys = {
  all: ['challenges'] as const,
  list: (params?: any) => ['challenges', 'list', params] as const,
  detail: (id: string) => ['challenges', id] as const,
  history: (id: string) => ['challenges', id, 'history'] as const,
};

export const resolutionKeys = {
  all: ['resolution'] as const,
  preview: (params?: any) => ['resolution', 'preview', params] as const,
  customerSummary: (customerId: string, storeId: string) => ['resolution', 'customer-summary', customerId, storeId] as const,
};
