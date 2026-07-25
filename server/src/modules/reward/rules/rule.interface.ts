import { RuleContext, RuleEvaluationResult } from '../interfaces';

export interface RewardRuleEvaluator {
  readonly ruleType: string;
  evaluate(context: RuleContext, operator: string, value: string): RuleEvaluationResult;
}
