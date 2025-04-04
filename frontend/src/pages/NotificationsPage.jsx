import React, { useState } from "react";
import { Bell, Shield, Zap, Gift, Info, Check, Calendar, Users, ArrowRight } from "lucide-react";
import "../styles/DevelopersPage.css";

const NotificationsPage = () => {
  // Sample notifications data with different categories
  const notificationsData = [
    {
      id: 1,
      type: "security",
      title: "Security Update: Two-Factor Authentication",
      description: "We've added two-factor authentication to enhance your account security. Enable it now in your security settings.",
      date: "June 15, 2024",
      isRead: false,
      icon: <Shield className="w-5 h-5" />,
      ctaText: "Enable 2FA",
      ctaLink: "/settings/security"
    },
    {
      id: 2,
      type: "feature",
      title: "New Feature: Voice Messages",
      description: "You can now send voice messages to your contacts. Try our new voice recording feature in your chats.",
      date: "June 10, 2024",
      isRead: false,
      icon: <Zap className="w-5 h-5" />,
      ctaText: "Try it now",
      ctaLink: "/"
    },
    {
      id: 3,
      type: "update",
      title: "App Update: Version 2.3.0",
      description: "We've released a new app version with performance improvements and bug fixes. Update now for the best experience.",
      date: "June 5, 2024",
      isRead: true,
      icon: <Info className="w-5 h-5" />,
      ctaText: "See changes",
      ctaLink: "/updates"
    },
    {
      id: 4,
      type: "feature",
      title: "New Feature: Dark Mode",
      description: "You can now switch between light and dark themes. Try our new dark mode for a more comfortable night-time experience.",
      date: "May 29, 2024",
      isRead: true,
      icon: <Zap className="w-5 h-5" />,
      ctaText: "Change theme",
      ctaLink: "/settings/appearance"
    },
    {
      id: 5,
      type: "security",
      title: "Privacy Policy Update",
      description: "We've updated our privacy policy to provide more transparency about how we handle your data.",
      date: "May 20, 2024",
      isRead: true,
      icon: <Shield className="w-5 h-5" />,
      ctaText: "Read more",
      ctaLink: "/privacy"
    },
    {
      id: 6,
      type: "event",
      title: "Community Webinar: Advanced Chat Features",
      description: "Join our product team for a live demonstration of advanced features and tips to enhance your messaging experience.",
      date: "May 15, 2024",
      isRead: true,
      icon: <Calendar className="w-5 h-5" />,
      ctaText: "Register",
      ctaLink: "/events"
    },
    {
      id: 7,
      type: "update",
      title: "Server Maintenance Notice",
      description: "We'll be performing server maintenance on June 20 from 2AM to 4AM UTC. Some services may be temporarily unavailable.",
      date: "May 10, 2024",
      isRead: true,
      icon: <Info className="w-5 h-5" />,
      ctaText: "Learn more",
      ctaLink: "/status"
    },
    {
      id: 8,
      type: "promo",
      title: "Invite Friends & Earn Rewards",
      description: "Invite your friends to Chatty and earn premium features when they join. Share your referral link now!",
      date: "May 5, 2024",
      isRead: true,
      icon: <Gift className="w-5 h-5" />,
      ctaText: "Invite friends",
      ctaLink: "/referral"
    },
    {
      id: 9,
      type: "community",
      title: "Join Our User Feedback Program",
      description: "Help shape the future of Chatty by joining our user feedback program. Your insights matter to us!",
      date: "April 28, 2024",
      isRead: true,
      icon: <Users className="w-5 h-5" />,
      ctaText: "Join now",
      ctaLink: "/feedback"
    }
  ];

  // State for notifications and filter
  const [notifications, setNotifications] = useState(notificationsData);
  const [filter, setFilter] = useState("all");

  // Function to mark a notification as read
  const markAsRead = (id) => {
    setNotifications(
      notifications.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  // Function to mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(
      notifications.map(notification => ({ ...notification, isRead: true }))
    );
  };

  // Filter notifications based on selected filter
  const filteredNotifications = filter === "all" 
    ? notifications 
    : filter === "unread"
    ? notifications.filter(notification => !notification.isRead)
    : notifications.filter(notification => notification.type === filter);

  // Function to get class for category badge
  const getCategoryClass = (type) => {
    switch(type) {
      case "security": return "bg-red-100 text-red-700";
      case "feature": return "bg-purple-100 text-purple-700";
      case "update": return "bg-blue-100 text-blue-700";
      case "event": return "bg-yellow-100 text-yellow-700";
      case "promo": return "bg-green-100 text-green-700";
      case "community": return "bg-orange-100 text-orange-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen relative bg-base-200 pt-20 pb-16 px-4 overflow-hidden">
      {/* Background animations */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5 animate-grid"></div>
        
        {/* Animated elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/10 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-base-200/80 to-base-200/90 backdrop-blur-sm"></div>
      </div>

      {/* Content */}
      <div className="relative max-w-4xl mx-auto">
        <div className="bg-base-100/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-base-300/30 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <Bell className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-center mb-3">Notifications</h1>
            <div className="w-20 h-1 bg-primary rounded-full mb-6"></div>
            <p className="text-center text-lg max-w-2xl text-base-content/80">
              Stay updated with the latest features, security updates, and announcements.
            </p>
          </div>

          {/* Filter and actions bar */}
          <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={() => setFilter("all")} 
                className={`btn btn-sm ${filter === "all" ? 'btn-primary' : 'btn-ghost'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilter("unread")} 
                className={`btn btn-sm ${filter === "unread" ? 'btn-primary' : 'btn-ghost'}`}
              >
                Unread
              </button>
              <button 
                onClick={() => setFilter("security")} 
                className={`btn btn-sm ${filter === "security" ? 'btn-primary' : 'btn-ghost'}`}
              >
                Security
              </button>
              <button 
                onClick={() => setFilter("feature")} 
                className={`btn btn-sm ${filter === "feature" ? 'btn-primary' : 'btn-ghost'}`}
              >
                Features
              </button>
              <button 
                onClick={() => setFilter("update")} 
                className={`btn btn-sm ${filter === "update" ? 'btn-primary' : 'btn-ghost'}`}
              >
                Updates
              </button>
            </div>
            <button 
              onClick={markAllAsRead} 
              className="btn btn-sm btn-outline"
            >
              <Check className="w-4 h-4 mr-1" />
              Mark all as read
            </button>
          </div>

          {/* Notifications list */}
          <div className="space-y-4">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`bg-base-100 rounded-xl border p-4 transition-all hover:shadow-md ${!notification.isRead ? 'border-primary border-l-4' : 'border-base-300'}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${getCategoryClass(notification.type)} shrink-0`}>
                      {notification.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg text-base-content">{notification.title}</h3>
                          <span className="text-xs text-base-content/60 block mb-2">{notification.date}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getCategoryClass(notification.type)}`}>
                          {notification.type}
                        </span>
                      </div>
                      <p className="text-base-content/70 mb-3">{notification.description}</p>
                      <div className="flex justify-between items-center">
                        <a 
                          href={notification.ctaLink} 
                          className="text-primary hover:text-primary-focus flex items-center gap-1 text-sm font-medium"
                        >
                          {notification.ctaText} <ArrowRight className="w-3 h-3" />
                        </a>
                        {!notification.isRead && (
                          <span className="inline-block w-2 h-2 bg-primary rounded-full"></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-base-content/60">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-40" />
                <p className="text-lg font-medium">No notifications found</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default NotificationsPage; 