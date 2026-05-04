// Frontend mirror of PlanPollLimits.java — keeps plan limits in sync.
export const PlanPollLimits = {
    maxJudges: (plan: string): number => {
        switch (plan.toUpperCase()) {
            case 'GO':   return 10;
            case 'PLUS': return 40;
            case 'PRO':  return 100;
            default:     return 0; // FREE
        }
    },
    judgeWeight: (plan: string): number => {
        switch (plan.toUpperCase()) {
            case 'GO':   return 50;
            case 'PLUS': return 60;
            case 'PRO':  return 70;
            default:     return 0; // FREE
        }
    }
};
