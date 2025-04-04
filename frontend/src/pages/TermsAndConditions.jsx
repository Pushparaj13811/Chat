import React from "react";
import { Scroll, UserCheck, Shield, AlertOctagon, Milestone, RefreshCw } from "lucide-react";
import "../styles/DevelopersPage.css";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen relative bg-base-200 pt-20 pb-16 px-4 overflow-hidden">
      {/* Background animations */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 animate-grid"></div>
        
        {/* Animated elements */}
        <div className="absolute -top-20 right-0 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-primary/5 rounded-full filter blur-2xl animate-pulse-slow"></div>
        
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-base-200/90 to-base-200/95 backdrop-blur-sm"></div>
      </div>

      {/* Content */}
      <div className="relative max-w-4xl mx-auto">
        <div className="bg-base-100/80 backdrop-blur-md p-10 rounded-2xl shadow-xl border border-base-300/30 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <Scroll className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-center mb-3">Terms and Conditions</h1>
            <div className="w-20 h-1 bg-primary rounded-full mb-6"></div>
            <p className="text-center text-lg max-w-2xl text-base-content/80">
              Welcome to our Real-Time Chat App. By accessing or using our service, you agree to be bound by these Terms and Conditions.
            </p>
          </div>

          {/* Terms Sections */}
          <div className="space-y-10">
            <div className="terms-section animate-fade-in animation-delay-200">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0 mt-1">
                  <UserCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-primary-focus">1. Usage Policy</h2>
                  <p className="text-base-content/70 leading-relaxed">
                    Users must communicate respectfully at all times. Our platform is designed to foster positive 
                    interactions and meaningful connections. Any form of harassment, hate speech, discrimination, 
                    or inappropriate behavior will result in an immediate suspension or permanent ban from our services.
                    We encourage constructive communication and reserve the right to moderate content as necessary 
                    to maintain a safe environment for all users.
                  </p>
                </div>
              </div>
            </div>

            <div className="terms-section animate-fade-in animation-delay-300">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0 mt-1">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-primary-focus">2. Data Privacy</h2>
                  <p className="text-base-content/70 leading-relaxed">
                    We value your privacy and are committed to protecting your personal data. Information collected 
                    is used only to improve your experience and provide our services. We implement robust security 
                    measures to safeguard your information and do not share your personal data with third parties 
                    without explicit consent. For complete details about our privacy practices, please refer to our 
                    <a href="/privacy" className="text-primary hover:underline ml-1">Privacy Policy</a>.
                  </p>
                </div>
              </div>
            </div>

            <div className="terms-section animate-fade-in animation-delay-400">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0 mt-1">
                  <UserCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-primary-focus">3. User Responsibilities</h2>
                  <div className="text-base-content/70 leading-relaxed space-y-2">
                    <p>As a user of our platform, you agree to the following responsibilities:</p>
                    <ul className="space-y-2 pl-5">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>You are responsible for maintaining the confidentiality of your login credentials and account security.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>You agree not to use our platform for illegal, fraudulent, or unauthorized purposes.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>You will not attempt to circumvent any security features or technical limitations of our service.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Any violation of our rules may result in temporary suspension or permanent termination of your account.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="terms-section animate-fade-in animation-delay-500">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0 mt-1">
                  <AlertOctagon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-primary-focus">4. Prohibited Activities</h2>
                  <div className="text-base-content/70 leading-relaxed">
                    <p className="mb-3">Users must not engage in any of the following prohibited activities:</p>
                    <ul className="space-y-3 pl-5">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Impersonating other users, staff members, or any other individuals or entities.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Sharing or distributing harmful content including malware, viruses, or phishing attempts.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Using automated bots, scripts, or other technologies to access the platform or harvest data.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Engaging in any fraudulent activities or deceptive practices.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>Attempting to gain unauthorized access to other users' accounts or our systems.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="terms-section animate-fade-in animation-delay-600">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0 mt-1">
                  <Milestone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-primary-focus">5. Intellectual Property</h2>
                  <p className="text-base-content/70 leading-relaxed">
                    All content, features, and functionality of our platform, including but not limited to text, graphics, 
                    logos, icons, images, audio clips, and software, are owned by us and are protected by international 
                    copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, 
                    create derivative works of, publicly display, or use our intellectual property without explicit permission.
                  </p>
                </div>
              </div>
            </div>

            <div className="terms-section animate-fade-in animation-delay-700">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0 mt-1">
                  <RefreshCw className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-primary-focus">6. Updates to Terms</h2>
                  <p className="text-base-content/70 leading-relaxed">
                    These terms may be updated periodically to reflect changes in our services, legal requirements, or best 
                    practices. We will notify users of significant changes through email or notices on our platform. 
                    Your continued use of our services after such updates constitutes your acceptance of the revised terms.
                    We recommend reviewing these terms regularly to stay informed about your rights and obligations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-base-300/30 text-center animate-fade-in animation-delay-800">
            <p className="text-sm text-base-content/60">
              Last updated: June 2024 • For questions about these terms, contact <a href="mailto:legal@chatapp.com" className="text-primary hover:underline">legal@chatapp.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
