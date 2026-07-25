import { describe, it, expect } from 'vitest';
import { RewardEventType } from '@prisma/client';
import { RuleEngine } from './rule-engine';
import { RuleContext } from '../interfaces';

const baseContext: RuleContext = {
  userId: 'user-1',
  eventType: RewardEventType.GAME_COMPLETED,
  now: new Date('2026-07-25T14:00:00Z'),
  dailyClaimCount: 1,
  totalClaimCount: 5,
};

describe('RuleEngine', () => {
  const engine = new RuleEngine();

  it('should pass when all rules pass', () => {
    const rules = [
      { ruleType: 'DAILY_LIMIT', operator: 'LESS_THAN', value: '10', priority: 0 },
      { ruleType: 'MAX_CLAIMS', operator: 'LESS_THAN', value: '20', priority: 1 },
    ];

    const result = engine.evaluateAll(rules, baseContext);

    expect(result.allPassed).toBe(true);
    expect(result.failedRule).toBeNull();
    expect(result.results).toHaveLength(2);
  });

  it('should fail at first failing rule', () => {
    const rules = [
      { ruleType: 'DAILY_LIMIT', operator: 'LESS_THAN', value: '1', priority: 0 },
      { ruleType: 'MAX_CLAIMS', operator: 'LESS_THAN', value: '20', priority: 1 },
    ];

    const result = engine.evaluateAll(rules, baseContext);

    expect(result.allPassed).toBe(false);
    expect(result.failedRule).toContain('DAILY_LIMIT');
    expect(result.results).toHaveLength(1);
  });

  it('should evaluate rules in priority order', () => {
    const rules = [
      { ruleType: 'MAX_CLAIMS', operator: 'LESS_THAN', value: '1', priority: 10 },
      { ruleType: 'DAILY_LIMIT', operator: 'LESS_THAN', value: '1', priority: 0 },
    ];

    const result = engine.evaluateAll(rules, baseContext);

    expect(result.allPassed).toBe(false);
    expect(result.failedRule).toContain('DAILY_LIMIT');
  });

  it('should skip unknown rule types gracefully', () => {
    const rules = [
      { ruleType: 'UNKNOWN_RULE', operator: 'EQUALS', value: 'test', priority: 0 },
    ];

    const result = engine.evaluateAll(rules, baseContext);

    expect(result.allPassed).toBe(true);
    expect(result.results[0].reason).toContain('Unknown');
  });

  it('should return all passed with empty rules', () => {
    const result = engine.evaluateAll([], baseContext);

    expect(result.allPassed).toBe(true);
    expect(result.results).toHaveLength(0);
  });
});
