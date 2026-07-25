import { RuleContext, RuleEvaluationResult } from '../interfaces';
import { RewardRuleEvaluator } from './rule.interface';
import { ALL_RULE_EVALUATORS } from './evaluators';

interface StoredRule {
  ruleType: string;
  operator: string;
  value: string;
  priority: number;
}

export class RuleEngine {
  private readonly evaluatorMap: Map<string, RewardRuleEvaluator>;

  constructor(evaluators: RewardRuleEvaluator[] = ALL_RULE_EVALUATORS) {
    this.evaluatorMap = new Map(evaluators.map((e) => [e.ruleType, e]));
  }

  registerEvaluator(evaluator: RewardRuleEvaluator): void {
    this.evaluatorMap.set(evaluator.ruleType, evaluator);
  }

  evaluateAll(
    rules: StoredRule[],
    context: RuleContext,
  ): { allPassed: boolean; results: RuleEvaluationResult[]; failedRule: string | null } {
    const sorted = [...rules].sort((a, b) => a.priority - b.priority);
    const results: RuleEvaluationResult[] = [];

    for (const rule of sorted) {
      const evaluator = this.evaluatorMap.get(rule.ruleType);
      if (!evaluator) {
        results.push({ passed: true, reason: `Unknown rule type: ${rule.ruleType}`, ruleType: rule.ruleType });
        continue;
      }

      const result = evaluator.evaluate(context, rule.operator, rule.value);
      results.push(result);

      if (!result.passed) {
        return { allPassed: false, results, failedRule: `${rule.ruleType}: ${result.reason}` };
      }
    }

    return { allPassed: true, results, failedRule: null };
  }
}
