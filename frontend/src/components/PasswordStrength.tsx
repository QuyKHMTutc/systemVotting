import React from 'react';

interface PasswordStrengthProps {
    password?: string;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password = '' }) => {
    // Calculate strength based on length, numbers, and special characters
    const calculateStrength = () => {
        let score = 0;
        if (!password) return 0;
        if (password.length > 5) score += 1;
        if (password.length > 8) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        
        // Map 0-5 score to 0-3 strength levels (0=empty, 1=weak, 2=medium, 3=strong)
        if (score === 0) return 0;
        if (score < 3) return 1;
        if (score < 5) return 2;
        return 3;
    };

    const strength = calculateStrength();

    const getStrengthText = () => {
        switch (strength) {
            case 1: return 'Weak';
            case 2: return 'Medium';
            case 3: return 'Strong';
            default: return 'Password Strength';
        }
    };

    const getStrengthColor = () => {
        switch (strength) {
            case 1: return 'text-red-400';
            case 2: return 'text-yellow-400';
            case 3: return 'text-emerald-400';
            default: return 'text-white/40';
        }
    };

    const getBarColor = (index: number) => {
        if (strength === 0) return 'bg-white/10';
        if (strength === 1) return index === 0 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-white/10';
        if (strength === 2) return index < 2 ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-white/10';
        if (strength === 3) return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
        return 'bg-white/10';
    };

    return (
        <div className="mt-2 space-y-1.5 w-full">
            <div className="flex gap-2 h-1.5">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className={`flex-1 rounded-full transition-all duration-300 ${getBarColor(i)}`}
                    />
                ))}
            </div>
            <div className={`text-[10px] uppercase font-bold tracking-widest text-right transition-colors duration-300 ${getStrengthColor()}`}>
                {getStrengthText()}
            </div>
        </div>
    );
};

export default PasswordStrength;
