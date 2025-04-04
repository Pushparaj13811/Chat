import React from "react";
import { Users, Heart, Shield, Sparkles, MessageSquare, Mail, Phone, MapPin } from "lucide-react";
import "../styles/DevelopersPage.css";

const AboutUs = () => {
  // Team members data
  const teamMembers = [
    {
      id: 1,
      name: "Vinay Sharma",
      role: "Founder & CEO",
      image: "vinay.JPG"
    },
    {
      id: 2,
      name: "Eric Dickson",
      role: "CTO",
      image: "eric.jpg"
    },
   
    {
      id: 4,
      name: "Amit Dubey",
      role: "Head of Support",
      image: "amit.jpg"
    }
  ];

  return (
    <div className="min-h-screen relative bg-base-200 pt-20 pb-16 px-4 overflow-hidden">
      {/* Background animations */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 animate-grid"></div>
        
        {/* Animated elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/10 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        
        {/* Floating particles */}
        <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-primary/30 rounded-full filter blur-sm animate-float"></div>
        <div className="absolute bottom-1/4 left-1/3 w-8 h-8 bg-secondary/30 rounded-full filter blur-sm animate-float animation-delay-3000"></div>
        
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-base-200/80 to-base-200/90 backdrop-blur-sm"></div>
      </div>

      {/* Content */}
      <div className="relative max-w-4xl mx-auto">
        <div className="bg-base-100/80 backdrop-blur-md p-10 rounded-2xl shadow-xl border border-base-300/30 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col items-center mb-10">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <MessageSquare className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-center mb-3">About Us</h1>
            <div className="w-20 h-1 bg-primary rounded-full mb-6"></div>
            <p className="text-center text-lg max-w-2xl text-base-content/80">
              We are a passionate team dedicated to providing a seamless and secure real-time chat experience that brings people together.
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-10">
            {/* Our Story */}
            <div className="about-section animate-fade-in animation-delay-200">
              <h2 className="text-2xl font-bold mb-5 text-primary-focus text-center">Our Story</h2>
              <p className="text-base-content/70 leading-relaxed text-center mb-8 max-w-3xl mx-auto">
                Founded in 2022, our journey began with a simple goal: to create a communication platform that prioritizes 
                both user experience and privacy. We believe that staying connected shouldn't come at the cost of security or 
                simplicity. Today, we serve users across the globe, bringing people together through secure, reliable, 
                and intuitive messaging solutions.
              </p>
            </div>

            {/* Mission */}
            <div className="about-section animate-fade-in animation-delay-300">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0 mt-1">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-primary-focus">Our Mission</h2>
                  <p className="text-base-content/70 leading-relaxed">
                    To create a reliable, user-friendly, and engaging chat platform that connects people worldwide while
                    maintaining the highest standards of privacy and security. We strive to break down communication barriers
                    and foster meaningful connections through intuitive technology that anyone can use.
                  </p>
                </div>
              </div>
            </div>

            {/* Values */}
            <div className="about-section animate-fade-in animation-delay-400">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0 mt-1">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3 text-primary-focus">Our Values</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    <div className="bg-base-100/50 p-5 rounded-xl border border-base-300/30">
                      <h3 className="font-bold mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <span>Security</span>
                      </h3>
                      <p className="text-sm text-base-content/70">
                        We prioritize user privacy and data protection at every level of our platform.
                      </p>
                    </div>
                    <div className="bg-base-100/50 p-5 rounded-xl border border-base-300/30">
                      <h3 className="font-bold mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span>Innovation</span>
                      </h3>
                      <p className="text-sm text-base-content/70">
                        Constantly improving our chat features to provide cutting-edge communication tools.
                      </p>
                    </div>
                    <div className="bg-base-100/50 p-5 rounded-xl border border-base-300/30">
                      <h3 className="font-bold mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <span>Community</span>
                      </h3>
                      <p className="text-sm text-base-content/70">
                        Building a friendly and inclusive environment where everyone feels welcome.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Team */}
            <div className="about-section animate-fade-in animation-delay-500">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0 mt-1">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-primary-focus">Meet Our Team</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {teamMembers.map(member => (
                      <div key={member.id} className="flex flex-col items-center">
                        <div className="w-20 h-20 mb-3 rounded-full overflow-hidden border-2 border-primary/20">
                          <img 
                            src={member.image} 
                            alt={member.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                member.name
                              )}&background=random&size=100&color=fff`;
                            }}
                          />
                        </div>
                        <h3 className="font-bold text-sm">{member.name}</h3>
                        <p className="text-xs text-primary">{member.role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Section */}
            <div className="about-section animate-fade-in animation-delay-600">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0 mt-1">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4 text-primary-focus">Contact Us</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-primary shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-sm mb-1">Email</h3>
                        <a href="mailto:support@chatapp.com" className="text-primary hover:underline text-sm">
                          support@chatapp.com
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-primary shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-sm mb-1">Support Hours</h3>
                        <p className="text-base-content/70 text-sm">
                          Mon - Fri, 9 AM - 6 PM 
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-sm mb-1">Headquarters</h3>
                        <p className="text-base-content/70 text-sm">
                          Rajkot, India
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-base-300/30 text-center animate-fade-in animation-delay-700">
            <p className="text-sm text-base-content/60">
              Last updated: June 2024 • We're constantly evolving to better serve our users.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
