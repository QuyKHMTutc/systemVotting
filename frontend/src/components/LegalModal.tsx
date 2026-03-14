import { useEffect } from 'react';
import { FileText, Shield } from 'lucide-react';

export type LegalModalType = 'terms' | 'privacy';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: LegalModalType;
}

const TERMS_CONTENT = (
    <div className="space-y-6 text-pink-100/90 text-sm leading-relaxed">
        <p className="text-pink-100 font-medium">
            Last updated: March 2025
        </p>

        <section>
            <h3 className="text-white font-bold text-base mb-2">1. Acceptance of Terms</h3>
            <p>
                By accessing or using SystemVoting (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
                If you do not agree to these terms, please do not use our Service.
            </p>
        </section>

        <section>
            <h3 className="text-white font-bold text-base mb-2">2. Description of Service</h3>
            <p>
                SystemVoting provides an online platform for creating, managing, and participating in polls and surveys.
                The Service allows users to vote, comment, and engage with community-driven decision-making.
            </p>
        </section>

        <section>
            <h3 className="text-white font-bold text-base mb-2">3. User Accounts</h3>
            <p>
                You must register for an account to access certain features. You agree to provide accurate information
                and maintain the security of your credentials. You are responsible for all activities under your account.
            </p>
        </section>

        <section>
            <h3 className="text-white font-bold text-base mb-2">4. Acceptable Use</h3>
            <p>
                You agree not to use the Service to: create fraudulent or misleading polls; harass other users; spread
                malware; violate applicable laws; or interfere with the Service&apos;s operation. We reserve the right to
                suspend or terminate accounts that violate these terms.
            </p>
        </section>

        <section>
            <h3 className="text-white font-bold text-base mb-2">5. Intellectual Property</h3>
            <p>
                The Service, including its design, logos, and content (excluding user-generated content), is owned by
                SystemVoting. You retain ownership of content you create but grant us a license to display and operate
                it within the Service.
            </p>
        </section>

        <section>
            <h3 className="text-white font-bold text-base mb-2">6. Limitation of Liability</h3>
            <p>
                The Service is provided &quot;as is.&quot; We are not liable for any indirect, incidental, or consequential
                damages arising from your use of the Service. Our total liability shall not exceed the amount you paid
                us (if any) in the past twelve months.
            </p>
        </section>

        <section>
            <h3 className="text-white font-bold text-base mb-2">7. Changes</h3>
            <p>
                We may update these Terms from time to time. We will notify users of material changes via email or
                in-app notice. Continued use after changes constitutes acceptance of the new Terms.
            </p>
        </section>

        <section>
            <h3 className="text-white font-bold text-base mb-2">8. Contact</h3>
            <p>
                For questions about these Terms, please contact us through the support channels provided in the Service.
            </p>
        </section>
    </div>
);

const PRIVACY_CONTENT = (
    <div className="space-y-6 text-pink-100/90 text-sm leading-relaxed">
        <p className="text-pink-100 font-medium">
            Last updated: March 2025
        </p>

        <section>
            <h3 className="text-white font-bold text-base mb-2">1. Information We Collect</h3>
            <p>
                We collect information you provide directly: username, email address, password (hashed), profile avatar,
                and any content you create (polls, votes, comments). We may also collect usage data such as IP address,
                browser type, and access timestamps.
            </p>
        </section>

        <section>
            <h3 className="text-white font-bold text-base mb-2">2. How We Use Your Information</h3>
            <p>
                We use your information to provide, maintain, and improve the Service; authenticate your identity;
                send verification emails and password reset links; display your profile and activity; and comply with
                legal obligations.
            </p>
        </section>

        <section>
            <h3 className="text-white font-bold text-base mb-2">3. Data Sharing</h3>
            <p>
                We do not sell your personal data. We may share data with service providers (e.g., hosting, email)
                under confidentiality agreements. We may disclose information if required by law or to protect our
                rights and safety.
            </p>
        </section>

        <section>
            <h3 className="text-white font-bold text-base mb-2">4. Cookies and Tokens</h3>
            <p>
                We use session tokens and refresh tokens for authentication. These are stored securely and allow you
                to stay logged in. You can clear them by signing out. We do not use third-party advertising cookies.
            </p>
        </section>

        <section>
            <h3 className="text-white font-bold text-base mb-2">5. Data Retention</h3>
            <p>
                We retain your account data for as long as your account is active. You may request deletion of your
                account and associated data. Some data may be retained for backup or legal compliance.
            </p>
        </section>

        <section>
            <h3 className="text-white font-bold text-base mb-2">6. Security</h3>
            <p>
                We implement industry-standard security measures including encryption, secure passwords, and access
                controls. While we strive to protect your data, no system is 100% secure.
            </p>
        </section>

        <section>
            <h3 className="text-white font-bold text-base mb-2">7. Your Rights</h3>
            <p>
                Depending on your location, you may have rights to access, correct, or delete your data; object to
                processing; or data portability. Contact us to exercise these rights.
            </p>
        </section>

        <section>
            <h3 className="text-white font-bold text-base mb-2">8. Contact</h3>
            <p>
                For privacy-related questions or requests, please contact us through the support channels provided
                in the Service.
            </p>
        </section>
    </div>
);

const LegalModal = ({ isOpen, onClose, type }: LegalModalProps) => {
    const isTerms = type === 'terms';
    const title = isTerms ? 'Terms of Service' : 'Privacy Policy';
    const content = isTerms ? TERMS_CONTENT : PRIVACY_CONTENT;

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex justify-center bg-black/70 backdrop-blur-md p-4 sm:p-6 transition-all duration-300 items-start pt-[8vh] sm:pt-[10vh]"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="glass-panel border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(236,72,153,0.15)] w-full max-w-2xl overflow-hidden animate-modal-enter flex flex-col max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 p-6 border-b border-white/10 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                            {isTerms ? (
                                <FileText className="w-5 h-5 text-pink-400" />
                            ) : (
                                <Shield className="w-5 h-5 text-purple-400" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-extrabold text-white tracking-wide">{title}</h2>
                            <p className="text-pink-200/60 text-xs mt-0.5">
                                {isTerms ? 'Rules and guidelines for using our platform' : 'How we collect and protect your data'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 bg-white/10 border border-white/20 text-white hover:bg-red-500/80 hover:border-red-500 rounded-full transition-all duration-300 hover:rotate-90 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
                    {content}
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-white/10 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-3 px-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.3)] transition-all uppercase tracking-wider text-sm"
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LegalModal;
