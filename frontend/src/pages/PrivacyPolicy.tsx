import Navbar from '../components/Navbar';
import { Shield } from 'lucide-react';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen pb-12">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
                <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-purple-500/10 blur-[80px]"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-pink-500/10 blur-[80px]"></div>
                    
                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12 border-b border-white/10 pb-8">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/10 shrink-0">
                                <Shield className="w-8 h-8 text-purple-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">Privacy Policy</h1>
                                <p className="text-white/50 font-medium">Last updated: March 2025</p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-10 text-white/80 text-base leading-loose">
                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-purple-400 text-sm font-bold border border-white/5 shrink-0">1</span>
                                    Information We Collect
                                </h3>
                                <p className="md:pl-11">
                                    We collect information you provide directly: username, email address, password (hashed), profile avatar,
                                    and any content you create (polls, votes, comments). We may also collect usage data such as IP address,
                                    browser type, and access timestamps.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-purple-400 text-sm font-bold border border-white/5 shrink-0">2</span>
                                    How We Use Your Information
                                </h3>
                                <p className="md:pl-11">
                                    We use your information to provide, maintain, and improve the Service; authenticate your identity;
                                    send verification emails and password reset links; display your profile and activity; and comply with
                                    legal obligations.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-purple-400 text-sm font-bold border border-white/5 shrink-0">3</span>
                                    Data Sharing
                                </h3>
                                <p className="md:pl-11">
                                    We do not sell your personal data. We may share data with service providers (e.g., hosting, email)
                                    under confidentiality agreements. We may disclose information if required by law or to protect our
                                    rights and safety.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-purple-400 text-sm font-bold border border-white/5 shrink-0">4</span>
                                    Cookies and Tokens
                                </h3>
                                <p className="md:pl-11">
                                    We use session tokens and refresh tokens for authentication. These are stored securely and allow you
                                    to stay logged in. You can clear them by signing out. We do not use third-party advertising cookies.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-purple-400 text-sm font-bold border border-white/5 shrink-0">5</span>
                                    Data Retention
                                </h3>
                                <p className="md:pl-11">
                                    We retain your account data for as long as your account is active. You may request deletion of your
                                    account and associated data. Some data may be retained for backup or legal compliance.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-purple-400 text-sm font-bold border border-white/5 shrink-0">6</span>
                                    Security
                                </h3>
                                <p className="md:pl-11">
                                    We implement industry-standard security measures including encryption, secure passwords, and access
                                    controls. While we strive to protect your data, no system is 100% secure.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-purple-400 text-sm font-bold border border-white/5 shrink-0">7</span>
                                    Your Rights
                                </h3>
                                <p className="md:pl-11">
                                    Depending on your location, you may have rights to access, correct, or delete your data; object to
                                    processing; or data portability. Contact us to exercise these rights.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-purple-400 text-sm font-bold border border-white/5 shrink-0">8</span>
                                    Contact
                                </h3>
                                <p className="md:pl-11">
                                    For privacy-related questions or requests, please contact us through the support channels provided
                                    in the Service.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
