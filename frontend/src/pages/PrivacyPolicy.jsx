import React from "react";
import { Shield, Lock, Eye, Check, AlertTriangle, RefreshCw } from "lucide-react";
import "../styles/DevelopersPage.css";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen relative bg-base-200 pt-20 pb-16 px-4 overflow-hidden">
      {/* Background animations */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 animate-grid"></div>
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 animate-shimmer"></div>
        
        {/* Gradient circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary/10 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/10 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-base-200/80 to-base-200/90 backdrop-blur-sm"></div>
      </div>

      {/* Content */}
      <div className="relative max-w-4xl mx-auto">
        <div className="bg-base-100/80 backdrop-blur-md p-10 rounded-2xl shadow-xl border border-base-300/30 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-center mb-3">Privacy Policy</h1>
            <div className="w-20 h-1 bg-primary rounded-full mb-6"></div>
            <p className="text-center text-lg max-w-2xl text-base-content/80">
              Your privacy is important to us. This policy explains how we collect, use, and protect your personal data.
            </p>
          </div>

          {/* Policy Sections */}
          <div className="space-y-10">
            <div className="policy-section animate-fade-in animation-delay-200">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0 mt-1">
                  <Eye className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-primary-focus">1. Data Collection</h2>
                  <p className="text-base-content/70 leading-relaxed">
                    We collect only necessary information, such as your name, email, and login credentials for account creation and communication. 
                    Our data collection practices are designed to be transparent and minimal, ensuring we only collect what's needed to provide 
                    our services effectively and securely.
                  </p>
                </div>
              </div>
            </div>

            <div className="policy-section animate-fade-in animation-delay-300">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0 mt-1">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-primary-focus">2. How We Use Your Data</h2>
                  <p className="text-base-content/70 leading-relaxed">
                    Your data is used to provide and improve our services, personalize your experience, and communicate important updates.
                    We analyze usage patterns to enhance our platform's functionality and user experience, ensuring our services remain
                    relevant and valuable to you.
                  </p>
                </div>
              </div>
            </div>

            <div className="policy-section animate-fade-in animation-delay-400">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0 mt-1">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-primary-focus">3. Data Security</h2>
                  <div className="text-base-content/70 leading-relaxed space-y-2">
                    <p>
                      We implement robust security measures to ensure your data remains protected at all times:
                    </p>
                    <ul className="space-y-2 pl-5">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>We implement strict security measures to prevent unauthorized access to your data.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Your passwords are securely stored using industry-standard encryption.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>We do not sell or share your data with third parties without explicit consent.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Regular security audits are conducted to identify and address potential vulnerabilities.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="policy-section animate-fade-in animation-delay-500">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0 mt-1">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-primary-focus">4. Cookies and Tracking</h2>
                  <p className="text-base-content/70 leading-relaxed">
                    We may use cookies to enhance your experience and provide personalized features. These cookies help us 
                    remember your preferences, analyze traffic patterns, and optimize our platform for your needs. You 
                    can disable cookies in your browser settings at any time, though this may affect certain functionality.
                  </p>
                </div>
              </div>
            </div>

            <div className="policy-section animate-fade-in animation-delay-600">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0 mt-1">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-primary-focus">5. Your Rights</h2>
                  <div className="text-base-content/70 leading-relaxed space-y-2">
                    <p>As a user, you have several rights regarding your personal data:</p>
                    <ul className="space-y-2 pl-5">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>You can request access to all data we hold about you.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>You can request correction or deletion of your personal information.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>You have the right to withdraw consent for data collection at any time.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>You can contact our privacy team with any concerns about your data.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="policy-section animate-fade-in animation-delay-700">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0 mt-1">
                  <RefreshCw className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-primary-focus">6. Policy Updates</h2>
                  <p className="text-base-content/70 leading-relaxed">
                    This policy may be updated periodically to reflect changes in our practices or regulatory requirements.
                    We will notify you of any significant changes through email or prominent notices on our platform.
                    We encourage you to review this policy regularly to stay informed about how we protect your data.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-base-300/30 text-center animate-fade-in animation-delay-800">
            <p className="text-sm text-base-content/60">
              Last updated: June 2024 • Contact us at <a href="mailto:privacy@chatapp.com" className="text-primary hover:underline">privacy@chatapp.com</a> with any questions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
