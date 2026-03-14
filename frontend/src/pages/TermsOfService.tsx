import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
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
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-pink-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Terms of Service</h1>
                            <p className="text-pink-100/60 text-sm mt-1">Last updated: March 2025</p>
                        </div>
                    </div>

                    <div className="space-y-6 text-pink-100/90 text-sm leading-relaxed">
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

export default TermsOfService;
