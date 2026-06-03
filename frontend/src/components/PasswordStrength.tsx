import React from 'react';
import { Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PasswordStrengthProps {
    password?: string;
    /** Hiện/ẩn checklist — true khi ô mật khẩu đang được focus */
    show?: boolean;
}

export interface PasswordValidation {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
}

export const validatePassword = (password: string): PasswordValidation => ({
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
});

export const isPasswordValid = (password: string): boolean => {
    const v = validatePassword(password);
    return v.minLength && v.hasUppercase && v.hasLowercase && v.hasNumber && v.hasSpecial;
};

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password = '', show = true }) => {
    const { t } = useTranslation();
    const validation = validatePassword(password);

    const rules = [
        { key: 'minLength',    label: t('passwordStrength.ruleMinLength'), met: validation.minLength },
        { key: 'hasUppercase', label: t('passwordStrength.ruleUppercase'), met: validation.hasUppercase },
        { key: 'hasLowercase', label: t('passwordStrength.ruleLowercase'), met: validation.hasLowercase },
        { key: 'hasNumber',    label: t('passwordStrength.ruleNumber'),    met: validation.hasNumber },
        { key: 'hasSpecial',   label: t('passwordStrength.ruleSpecial'),   met: validation.hasSpecial },
    ];

    const metCount = rules.filter((r) => r.met).length;

    const getStrengthLevel = () => {
        if (!password) return 0;
        return metCount;
    };

    const strength = getStrengthLevel();

    const getStrengthLabel = () => {
        if (!password) return '';
        if (strength <= 1) return t('passwordStrength.levelVeryWeak');
        if (strength <= 2) return t('passwordStrength.levelWeak');
        if (strength <= 3) return t('passwordStrength.levelMedium');
        if (strength <= 4) return t('passwordStrength.levelStrong');
        return t('passwordStrength.levelVeryStrong');
    };

    const getBarColor = (index: number) => {
        if (!password || strength === 0) return 'bg-slate-200 dark:bg-white/10';
        if (index >= strength) return 'bg-slate-200 dark:bg-white/10';
        if (strength <= 1) return 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]';
        if (strength <= 2) return 'bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.6)]';
        if (strength <= 3) return 'bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.6)]';
        if (strength <= 4) return 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]';
        return 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]';
    };

    const getLabelColor = () => {
        if (!password || strength === 0) return 'text-slate-400 dark:text-white/40';
        if (strength <= 1) return 'text-red-400';
        if (strength <= 2) return 'text-orange-400';
        if (strength <= 3) return 'text-yellow-400';
        if (strength <= 4) return 'text-blue-400';
        return 'text-emerald-400';
    };

    return (
        /* Wrapper dùng max-height transition để animate mượt */
        <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
                show ? 'max-h-48 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'
            }`}
        >
            <div className="space-y-3 w-full">
                {/* Strength bars */}
                <div className="flex items-center gap-1.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${getBarColor(i)}`}
                        />
                    ))}
                    <span className={`text-[10px] font-bold uppercase tracking-widest ml-2 min-w-[60px] text-right transition-colors duration-300 ${getLabelColor()}`}>
                        {getStrengthLabel()}
                    </span>
                </div>

                {/* Checklist */}
                <div className="grid grid-cols-1 gap-1">
                    {rules.map((rule) => (
                        <div
                            key={rule.key}
                            className={`flex items-center gap-2 text-xs font-medium transition-colors duration-300 ${
                                rule.met
                                    ? 'text-emerald-500 dark:text-emerald-400'
                                    : 'text-slate-500 dark:text-white/40'
                            }`}
                        >
                            <span
                                className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 ${
                                    rule.met
                                        ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400'
                                        : 'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-white/30'
                                }`}
                            >
                                {rule.met ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                            </span>
                            {rule.label}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PasswordStrength;
