// Frontend mirror of PlanPollLimits.java — keeps plan limits in sync.
export const PlanPollLimits = {
    maxJudges: (plan: string): number => {
        switch (plan.toUpperCase()) {
            case 'GO':   return 7;
            case 'PLUS': return 9;
            case 'PRO':  return 11;
            default:     return 5; // FREE
        }
    },
    judgeWeight: (plan: string): number => {
        switch (plan.toUpperCase()) {
            case 'GO':   return 50;
            case 'PLUS': return 60;
            case 'PRO':  return 70;
            default:     return 0; // FREE
        }
    },
    maxInvites: (plan: string): number => {
        switch (plan.toUpperCase()) {
            case 'GO':   return 300;
            case 'PLUS': return 1000;
            case 'PRO':  return 2000;
            default:     return 100; // FREE
        }
    }
};
