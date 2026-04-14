import Navbar from '../components/Navbar';
import { FileText } from 'lucide-react';

const TermsOfService = () => {
    return (
        <div className="min-h-screen pb-12">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10">
                <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute top-0 left-0 -ml-20 -mt-20 w-64 h-64 rounded-full bg-pink-500/10 blur-[80px]"></div>
                    <div className="absolute bottom-0 right-0 -mr-20 -mb-20 w-64 h-64 rounded-full bg-indigo-500/10 blur-[80px]"></div>
                    
                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-12 border-b border-white/10 pb-8">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500/20 to-indigo-500/20 flex items-center justify-center border border-white/10 shrink-0">
                                <FileText className="w-8 h-8 text-pink-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">Terms of Service</h1>
                                <p className="text-white/50 font-medium">Last updated: March 2025</p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-10 text-white/80 text-base leading-loose">
                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-pink-400 text-sm font-bold border border-white/5 shrink-0">1</span>
                                    Acceptance of Terms
                                </h3>
                                <p className="md:pl-11">
                                    By accessing or using SystemVoting (&quot;the Service&quot;), you agree to be bound by these Terms of Service.
                                    If you do not agree to these terms, please do not use our Service.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-pink-400 text-sm font-bold border border-white/5 shrink-0">2</span>
                                    Description of Service
                                </h3>
                                <p className="md:pl-11">
                                    SystemVoting provides an online platform for creating, managing, and participating in polls and surveys.
                                    The Service allows users to vote, comment, and engage with community-driven decision-making.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-pink-400 text-sm font-bold border border-white/5 shrink-0">3</span>
                                    User Accounts
                                </h3>
                                <p className="md:pl-11">
                                    You must register for an account to access certain features. You agree to provide accurate information
                                    and maintain the security of your credentials. You are responsible for all activities under your account.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-pink-400 text-sm font-bold border border-white/5 shrink-0">4</span>
                                    Acceptable Use
                                </h3>
                                <p className="md:pl-11">
                                    You agree not to use the Service to: create fraudulent or misleading polls; harass other users; spread
                                    malware; violate applicable laws; or interfere with the Service&apos;s operation. We reserve the right to
                                    suspend or terminate accounts that violate these terms.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-pink-400 text-sm font-bold border border-white/5 shrink-0">5</span>
                                    Intellectual Property
                                </h3>
                                <p className="md:pl-11">
                                    The Service, including its design, logos, and content (excluding user-generated content), is owned by
                                    SystemVoting. You retain ownership of content you create but grant us a license to display and operate
                                    it within the Service.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-pink-400 text-sm font-bold border border-white/5 shrink-0">6</span>
                                    Limitation of Liability
                                </h3>
                                <p className="md:pl-11">
                                    The Service is provided &quot;as is.&quot; We are not liable for any indirect, incidental, or consequential
                                    damages arising from your use of the Service. Our total liability shall not exceed the amount you paid
                                    us (if any) in the past twelve months.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-pink-400 text-sm font-bold border border-white/5 shrink-0">7</span>
                                    Changes
                                </h3>
                                <p className="md:pl-11">
                                    We may update these Terms from time to time. We will notify users of material changes via email or
                                    in-app notice. Continued use after changes constitutes acceptance of the new Terms.
                                </p>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-pink-400 text-sm font-bold border border-white/5 shrink-0">8</span>
                                    Contact
                                </h3>
                                <p className="md:pl-11">
                                    For questions about these Terms, please contact us through the support channels provided in the Service.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TermsOfService;
