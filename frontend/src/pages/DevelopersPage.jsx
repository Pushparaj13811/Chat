import React from "react";
import { ArrowLeft, Github, Mail, Phone, Globe, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import "../styles/DevelopersPage.css";

const DevelopersPage = () => {
  // Developer data with improved image paths and more realistic images
  const developers = [
    {
      id: 1,
      name: "Vinay Kumar Sharma",
      role: "Software Developer / Backend Developer",
      image: "vinay.JPG", // Using reliable external image source
      email: "vinay.sharma@chatapp.com",
      phone: "+977 9840042894",
      specialization: "React , Node.js , MongoDB , Express.js , JavaScript , HTML , CSS ",
      github: "https://github.com/vinaysharma1228",
      linkedin: "https://www.linkedin.com/in/vinay-kumar-sharma-43b698231/",
      website: "https://www.linkedin.com/in/vinay-kumar-sharma-43b698231/",  
      bio: "Vinay is our backend expert focused on real-time communication systems. With expertise in Node.js and WebSockets, he ensures reliable message delivery and scalable server architecture.",
    },
    {
      id: 2,
      name: "Eric Dickson",
      role: "Frontend Developer",
      image: "eric.jpg", // Using reliable external image source
      email: "eric.dickson@chatapp.com",
      phone: "+1 (555) 234-5678",
      specialization: "React , Tailwind CSS , HTML , CSS , JavaScript ",
      github: "https://github.com/sarahchen",
      linkedin: "https://linkedin.com/in/sarahchen",
      website: "https://sarahchen.io",
      bio: "Eric leads our frontend development team with over 1 years of experience building scalable web applications. Specializes in React performance optimization and modern UI development.",

    },
    {
      id: 3,
      name: "Amit Bijendra Dubey",
      role: "UI / UX Designer",
      image: "amit.jpg", // Using reliable external image source
      email: "amit.dubey@chatapp.com",
      phone: "+1 (555) 345-6789",
      specialization: "Figma , Adobe , MS OFFICE 365 , Canva , Microsoft Powerpoint , Microsoft Excel ",
      github: "https://github.com/michaelrodriguez",
      linkedin: "https://linkedin.com/in/michaelrodriguez",
      website: "https://mrodriguez.dev",
      bio: "Amit brings 2 years of UI/UX Designer experience with focus on User Experience and User Interface. Passionate about creating reliable and efficient software solutions.",
    },
    
  
  ];

  return (
    // Added animated background and gradient overlay
    <div className="min-h-screen relative bg-base-200 pt-20 pb-12 px-4 overflow-hidden">
      {/* Enhanced animated background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 animate-grid"></div>
        
        {/* Shimmer overlay */}
        <div className="absolute inset-0 animate-shimmer"></div>
        
        {/* Gradient circles with various animations */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/20 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-secondary/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-accent/15 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
        
        {/* Additional animated elements */}
        <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-primary/10 rounded-full filter blur-2xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/3 left-1/5 w-56 h-56 bg-secondary/10 rounded-full filter blur-2xl animate-pulse-slow animation-delay-3000"></div>
        
        {/* Floating particles */}
        <div className="absolute top-10 right-1/4 w-8 h-8 bg-primary/30 rounded-full filter blur-sm animate-float"></div>
        <div className="absolute top-1/3 left-20 w-6 h-6 bg-accent/30 rounded-full filter blur-sm animate-float animation-delay-1000"></div>
        <div className="absolute bottom-1/4 right-20 w-10 h-10 bg-secondary/30 rounded-full filter blur-sm animate-float animation-delay-5000"></div>
        <div className="absolute bottom-20 left-1/4 w-5 h-5 bg-primary/30 rounded-full filter blur-sm animate-float animation-delay-2000"></div>
        <div className="absolute top-2/3 right-1/3 w-7 h-7 bg-accent/30 rounded-full filter blur-sm animate-float animation-delay-3000"></div>
        
        {/* Wave elements */}
        <div className="absolute -bottom-40 left-0 right-0 h-96 bg-gradient-to-t from-primary/5 to-transparent opacity-30 animate-wave"></div>
        <div className="absolute -bottom-40 left-0 right-0 h-80 bg-gradient-to-t from-secondary/5 to-transparent opacity-20 animate-wave animation-delay-2000"></div>
        
        {/* Gradient overlay to ensure content readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-base-200/80 to-base-200/90 backdrop-blur-sm"></div>
      </div>

      {/* Main content */}
      <div className="relative max-w-7xl mx-auto">
        {/* Back Navigation - fixed position that doesn't overlap with navbar */}
        <div className="mb-8 flex justify-between items-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-focus transition-colors bg-base-100/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm hover:shadow-md"
          >
            <ArrowLeft size={18} />
            <span>Back to Login</span>
          </Link>
        </div>

        {/* Header - improved spacing */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 text-primary-focus animate-fade-in">Our Development Team</h1>
          <p className="text-lg text-base-content/80 max-w-3xl mx-auto leading-relaxed animate-fade-in animation-delay-200">
            Meet the talented professionals behind ChatApp. Our diverse team brings
            together expertise in frontend, backend, design, and system architecture
            to create a seamless chat experience.
          </p>
        </div>

        {/* Developers Grid - improved card design with transparency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
          {developers.map((developer, index) => (
            <div
              key={developer.id}
              className="group bg-base-100/70 backdrop-blur-md rounded-xl shadow-xl overflow-hidden border border-base-300/30 hover:shadow-2xl transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <div className="flex flex-col sm:flex-row items-center">
                {/* Image section */}
                <div className="sm:w-2/5 py-8 px-4 flex items-center justify-center bg-gradient-to-b from-primary/5 via-transparent to-transparent group-hover:from-primary/10 transition-colors duration-300">
                  <div className="relative aspect-square overflow-hidden rounded-full border-4 border-primary/20 shadow-lg w-full max-w-[180px] group-hover:scale-105 transition-transform duration-500">
                    <img
                      src={developer.image}
                      alt={developer.name}
                      className="w-full h-full object-cover transition-all hover:scale-110 duration-500"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          developer.name
                        )}&background=random&size=256&color=fff&bold=true`;
                      }}
                    />
                    {/* Decorative ring */}
                    <div className="absolute inset-0 rounded-full ring-2 ring-primary/10 ring-offset-2 ring-offset-base-100/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>

                {/* Details section */}
                <div className="p-6 sm:w-3/5 sm:pl-2">
                  <h2 className="text-2xl font-bold mb-1 text-primary-focus group-hover:text-primary transition-colors duration-300">{developer.name}</h2>
                  <p className="text-primary font-medium mb-4 pb-2 border-b border-base-300/50">{developer.role}</p>
                  <p className="text-base-content/70 mb-4 text-sm leading-relaxed">{developer.bio}</p>
                  
                  <div className="space-y-2 mb-4">
                    <h3 className="font-semibold text-xs text-base-content/50 uppercase tracking-wider">
                      Specialization
                    </h3>
                    <p className="text-base-content/90 font-medium">{developer.specialization}</p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-xs text-base-content/50 uppercase tracking-wider">
                      Contact
                    </h3>
                    <div className="flex flex-col gap-2">
                      <a
                        href={`mailto:${developer.email}`}
                        className="inline-flex items-center gap-2 hover:text-primary transition-colors text-sm"
                      >
                        <Mail className="w-4 h-4" />
                        <span>{developer.email}</span>
                      </a>
                      <a
                        href={`tel:${developer.phone}`}
                        className="inline-flex items-center gap-2 hover:text-primary transition-colors text-sm"
                      >
                        <Phone className="w-4 h-4" />
                        <span>{developer.phone}</span>
                      </a>
                    </div>
                  </div>

                  {/* Social Links - improved design */}
                  <div className="flex gap-3 mt-5">
                    <a
                      href={developer.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-base-200 hover:bg-primary hover:text-white text-base-content transition-colors duration-300"
                      aria-label={`${developer.name}'s GitHub`}
                    >
                      <Github size={18} />
                    </a>
                    <a
                      href={developer.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-base-200 hover:bg-primary hover:text-white text-base-content transition-colors duration-300"
                      aria-label={`${developer.name}'s LinkedIn`}
                    >
                      <Linkedin size={18} />
                    </a>
                    <a
                      href={developer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-base-200 hover:bg-primary hover:text-white text-base-content transition-colors duration-300"
                      aria-label={`${developer.name}'s Website`}
                    >
                      <Globe size={18} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Team Stats - improved design with transparency */}
        <div className="bg-base-100/70 backdrop-blur-md rounded-xl shadow-xl p-10 mb-16 border border-base-300/30 animate-fade-in animation-delay-1000">
          <h2 className="text-3xl font-bold mb-8 text-center text-primary-focus">Team Expertise</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-3">3</div>
              <div className="text-base-content/70 font-medium">Team Members</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-3">5+</div>
              <div className="text-base-content/70 font-medium">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-3">12+</div>
              <div className="text-base-content/70 font-medium">Technologies</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-3">24/7</div>
              <div className="text-base-content/70 font-medium">Support</div>
            </div>
          </div>
        </div>

        {/* Join The Team - improved design with transparency */}
        <div className="bg-primary/5 backdrop-blur-md rounded-xl p-10 text-center border border-primary/20 shadow-xl animate-fade-in animation-delay-1200">
          <h2 className="text-3xl font-bold mb-4 text-primary-focus">Join Our Team</h2>
          <p className="mb-8 max-w-2xl mx-auto text-base-content/80 leading-relaxed">
            We're always looking for talented developers and designers to join our team.
            If you're passionate about creating great user experiences and solving
            complex problems, we'd love to hear from you.
          </p>
          <a
            href="mailto:careers@chatapp.com"
            className="btn btn-primary btn-lg shadow-md hover:shadow-xl transition-shadow"
          >
            Contact Us About Careers
          </a>
        </div>
      </div>
    </div>
  );
};

export default DevelopersPage; 