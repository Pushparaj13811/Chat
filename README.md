# Chat Application

## Overview
This chat application provides a real-time messaging platform with features such as text, image, and voice messaging, user authentication, audio/video calls, group chats, and message reactions. It is built with a React frontend and a Node.js backend, utilizing WebSockets for real-time communication and WebRTC for voice/video calling features.

## Features

### Frontend

- **Components**
  - **ChatContainer**: Manages the chat interface, displaying messages, and handling message input.
  - **MessageInput**: Handles text, image, and voice message input, including recording and previewing voice messages.
  - **VoiceMessage**: Plays voice messages with controls for play, pause, and progress tracking.
  - **CompactVoicePlayer**: A simplified player for voice messages.
  - **MessageOptions**: Provides options for message actions like edit, delete, and reply.
  - **MessageReactions**: Displays and manages reactions to messages.
  - **EditMessageModal**: Modal for editing messages.
  - **Sidebar**: Displays a list of users for chat selection.
  - **AuthRoutes**: Manages authentication-related routes.
  - **ChatHeader**, **Navbar**, **NoChatSelected**: UI components for navigation and chat interface.
  - **AuthImagePattern**: Provides a consistent visual pattern for authentication pages.
  - **GroupChatContainer**: Manages group chat interfaces and functionality.
  - **GroupMessageInput**: Specialized input component for group messaging.
  - **CallInProgress**, **CallRinging**: Components for managing real-time audio/video calls.
  - **MinimizedCall**: Allows users to minimize ongoing calls while using other app features.

- **Pages**
  - **LoginPage**, **SignUpPage**: User authentication pages with social login options (Google, Facebook, GitHub).
  - **ForgotPassword**, **ResetPassword**: Password recovery and reset pages.
  - **HomePage**, **ProfilePage**, **SettingsPage**: Main application pages for user interaction.
  - **AboutUs**, **PrivacyPolicy**, **TermsAndConditions**: Informational pages with animated backgrounds and responsive design.
  - **DevelopersPage**: Showcases the development team with professional profiles and animated UI.
  - **NotificationsPage**: Displays system notifications with filtering by type and read/unread status.
  - **AdminLoginPage**, **AdminDashboard**: Admin-only pages for system management and monitoring.

- **State Management**
  - **useChatStore**: Manages chat-related state, including messages, users, and socket connections.
  - **useAuthStore**: Manages authentication state.
  - **useThemeStore**: Manages theme settings.
  - **useCallStore**: Manages audio/video call state including streaming, connection, and UI controls.

- **Hooks and Context**
  - **useOutsideClick**: Custom hook for detecting clicks outside a component.
  - **SocketContext**, **MessagesContext**: Context providers for managing socket connections and message state.
  - **GroupsContext**: Context provider for managing group chat functionality.

- **Utilities**
  - **formatTimestamp**, **authUtils**: Utility functions for formatting and authentication.
  - **axios.js**: Configures Axios for API requests.
  - **audio-utils.js**: Utilities for handling audio playback, especially for calls.
  
- **UI/UX Features**
  - **Responsive Design**: Adapts to different screen sizes for optimal user experience.
  - **Theme Support**: Light and dark theme options.
  - **Animated Backgrounds**: Interactive and animated backgrounds for enhanced visual appeal.
  - **Notification System**: User notification system with multiple categories (security, features, updates, events, etc.).
  - **Interactive Components**: Hover effects, transitions, and microinteractions.
  - **File Sharing**: Support for sharing documents, images, and voice messages with preview capabilities.

### Backend

- **Controllers**
  - **message.controller.js**: Manages message operations, including sending, receiving, and updating message status.
  - **auth.controller.js**: Handles user authentication, including login, signup, password management, and OTP verification.
  - **groupMessage.controller.js**: Manages group message operations.
  - **admin.controller.js**: Handles admin-only operations and dashboard data.

- **Models**
  - **message.model.js**: Defines the schema for messages.
  - **user.model.js**: Defines the schema for users.
  - **group.model.js**: Defines the schema for group chats.
  - **groupMessage.model.js**: Defines the schema for group messages.

- **Routes**
  - **message.routes.js**: API endpoints for message operations.
  - **auth.routes.js**: API endpoints for authentication operations.
  - **groups.routes.js**: API endpoints for group management.
  - **admin.routes.js**: API endpoints for admin operations.

- **Utilities and Libraries**
  - **emailSender.js**: Utility for sending emails.
  - **socket.js**: Manages socket connections for real-time communication.
  - **cloudinary.js**: Configures Cloudinary for file uploads and storage.
  - **passport.js**: Implements social authentication strategies (Google, Facebook, GitHub).

- **Middleware**
  - **auth.middleware.js**: Middleware for authentication checks.
  - **adminAuth.js**: Middleware for admin-only route protection.

- **Templates**
  - **welcomeEmail.hbs**, **forgotPassword.hbs**: Email templates for user notifications.
  - **otpVerification.hbs**: Email template for OTP verification during signup.

- **Seeds**
  - **user.seed.js**: Seed data for initializing the database with users.

## Advanced Features

- **Real-time Audio/Video Calls**: WebRTC-based calling with audio-only or video modes, call controls, and quality indicators.
- **Group Chat Management**: Create groups, add/remove members, promote/demote admins, and share media.
- **File Attachments**: Send and receive images, documents, and voice messages with preview capabilities.
- **Social Authentication**: Login with Google, Facebook, or GitHub accounts.
- **Admin Dashboard**: Comprehensive admin panel with user management, analytics, system health monitoring, and content moderation.
- **OTP Verification**: Secure sign-up process with email verification.
- **Message Reactions**: React to messages with emojis in both private and group chats.
- **Message Types**: Support for text, image, voice notes, and document messages.
- **Typing Indicators**: Real-time indicators when users are typing.
- **Online Status**: Track user online/offline status.
- **Message Pinning**: Pin important messages in group chats for easy reference.

## Installation

1. Clone the repository.
2. Navigate to the `frontend` and `backend` directories and run `npm install` to install dependencies.
3. Set up environment variables as needed in `.env` files.
4. Run the frontend and backend servers using `npm start`.

## Usage

- Access the application via the frontend URL.
- Log in or sign up to start chatting, with options for social login.
- Use the chat interface to send text, images, documents, and voice messages.
- Create and manage group chats with friends or colleagues.
- Initiate audio or video calls with contacts.
- Check notifications for updates on app features, security, and events.
- View information about the development team on the Developers page.
- Manage your profile settings and preferences.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
