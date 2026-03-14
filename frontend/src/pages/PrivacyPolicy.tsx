import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="flex items-center justify-between mb-8">
                    <Link
                        to="/register"
                        className="inline-flex items-center gap-2 text-pink-300 hover:text-pink-200 font-medium text-sm transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Registration
                    </Link>
                    <Link to="/login" className="text-pink-100/70 hover:text-pink-300 text-sm font-medium transition-colors">
                        Sign In
                    </Link>
                </div>

                <div className="glass-panel p-6 sm:p-10 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Privacy Policy</h1>
                            <p className="text-pink-100/60 text-sm mt-1">Last updated: March 2025</p>
                        </div>
                    </div>

                    <div className="space-y-6 text-pink-100/90 text-sm leading-relaxed">
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

                    <div className="mt-10 pt-6 border-t border-white/10">
                        <Link
                            to="/register"
                            className="inline-flex items-center gap-2 text-pink-300 hover:text-pink-200 font-medium text-sm transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Return to Registration
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
