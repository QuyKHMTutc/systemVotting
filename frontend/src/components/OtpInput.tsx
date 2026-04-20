import React, { useRef } from 'react';

interface OtpInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

const OtpInput: React.FC<OtpInputProps> = ({ length = 6, value, onChange, disabled = false }) => {
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/[^0-9]/.test(val)) return;

        const newValue = value.split('');
        // Take only the last character in case of pasting
        newValue[index] = val.substring(val.length - 1);
        const finalValue = newValue.join('').slice(0, length);
        onChange(finalValue);

        if (val && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!value[index] && index > 0) {
                // If current input is empty, focus previous and clear it
                const newValue = value.split('');
                newValue[index - 1] = '';
                onChange(newValue.join(''));
                inputRefs.current[index - 1]?.focus();
            } else {
                // Clear current input
                const newValue = value.split('');
                newValue[index] = '';
                onChange(newValue.join(''));
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
        if (pastedData) {
            onChange(pastedData);
            // Focus on the last filled input or the first empty one
            const nextIndex = Math.min(pastedData.length, length - 1);
            inputRefs.current[nextIndex]?.focus();
        }
    };

    // Pad value array to match length for rendering correct number of inputs
    const valueArray = Array.from({ length }, (_, i) => value[i] || '');

    return (
        <div className="flex justify-between gap-1 sm:gap-2">
            {valueArray.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => {
                        inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={digit}
                    onChange={(e) => handleChange(index, e)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className="w-10 h-12 sm:w-12 sm:h-14 rounded-xl bg-slate-100/50 dark:bg-white/5 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/30 text-center text-xl font-bold focus:outline-none focus:border-pink-500/80 focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-pink-500/50 focus:shadow-[0_0_15px_rgba(236,72,153,0.5)] transition-all disabled:opacity-50"
                    maxLength={1} // Handled by standard ChangeEvent length manually but this helps mobile
                />
            ))}
        </div>
    );
};

export default OtpInput;
