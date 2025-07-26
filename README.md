# Outlook Calendar Integration

A modern web application that integrates with Microsoft Outlook Calendar to display and manage today's meetings. Built with Next.js, Material-UI, and Microsoft Graph API.

## 🎯 Overview

This application provides a clean, user-friendly interface to view and join today's meetings from your Outlook Calendar. It features:

- **Secure Authentication**: OAuth 2.0 integration with Microsoft Azure AD
- **Real-time Meeting Display**: Shows all meetings scheduled for today
- **One-click Join**: Direct access to Teams/Zoom meeting links
- **Automatic Token Refresh**: Seamless session management
- **Modern UI**: Beautiful Material-UI interface with responsive design

## 🏗️ Architecture

### Frontend
- **Next.js 15.2.1**: React framework with server-side rendering
- **Material-UI (MUI)**: Modern UI components and styling
- **NextAuth.js**: Authentication provider for Microsoft Azure AD
- **React 19**: Latest React features and hooks

### Backend
- **Express.js Server**: Standalone server for token management (port 3001)
- **Next.js API Routes**: Authentication and token handling endpoints
- **Microsoft Graph API**: Calendar data retrieval

### Authentication Flow
1. User clicks "Connect Outlook Calendar"
2. Redirected to Microsoft Azure AD for OAuth authentication
3. After successful login, tokens are stored in HTTP-only cookies
4. Application fetches calendar data using Microsoft Graph API
5. Automatic token refresh ensures continuous access

## 📁 Project Structure

```
outlook-integration-test/
├── components/                 # Reusable UI components
├── lib/                       # Utility libraries
├── pages/                     # Next.js pages and API routes
│   ├── api/auth/             # Authentication endpoints
│   │   ├── [...nextauth].js  # NextAuth configuration
│   │   ├── initiatelogin.js  # Login initiation
│   │   ├── logout.js         # Logout handling
│   │   ├── refresh.js        # Token refresh logic
│   │   ├── refreshtoken.js   # Token refresh utility
│   │   ├── set-tokens.js     # Token storage
│   │   └── status.js         # Authentication status
│   ├── post/
│   │   └── todayMeetingList.js # Main meeting display component
│   ├── _app.js               # App wrapper with NextAuth
│   └── index.js              # Main page
├── public/                   # Static assets
├── server.js                 # Express server for token management
├── package.json              # Dependencies and scripts
├── next.config.mjs          # Next.js configuration
└── jsconfig.json            # JavaScript configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Microsoft Azure AD application registration
- Microsoft 365 account with calendar access

### 1. Clone the Repository

```bash
git clone <repository-url>
cd outlook-integration-test
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```env
# Azure AD Configuration
AZURE_AD_CLIENT_ID=your_azure_ad_client_id
AZURE_AD_CLIENT_SECRET=your_azure_ad_client_secret
AZURE_AD_TENANT_ID=your_azure_ad_tenant_id

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=http://localhost:3000

# Optional: Custom redirect URLs
NEXTAUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback/azure-ad
```

### 4. Azure AD Application Setup

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Create a new registration:
   - **Name**: Outlook Integration App
   - **Supported account types**: Accounts in this organizational directory only
   - **Redirect URI**: `http://localhost:3000/api/auth/callback/azure-ad`

4. Configure API permissions:
   - **Microsoft Graph** → **Delegated permissions**:
     - `Calendars.Read`
     - `User.Read`
     - `offline_access`

5. Create a client secret and note down the values

### 5. Start the Application

#### Development Mode
```bash
# Terminal 1: Start the Express server
node server.js

# Terminal 2: Start the Next.js development server
npm run dev
```

#### Production Mode
```bash
npm run build
npm start
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend Server**: http://localhost:3001

## 🔧 Key Features Explained

### Authentication System

The app uses NextAuth.js with Azure AD provider for secure authentication:

```javascript
// pages/api/auth/[...nextauth].js
AzureADProvider({
  clientId: process.env.AZURE_AD_CLIENT_ID,
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
  tenantId: process.env.AZURE_AD_TENANT_ID,
  authorization: {
    params: {
      scope: "openid profile email Calendars.Read User.Read offline_access",
    },
  },
})
```

### Meeting Display Component

The main component (`todayMeetingList.js`) handles:
- **Authentication Status**: Checks if user is logged in
- **Token Management**: Automatic refresh of expired tokens
- **Calendar Fetching**: Retrieves today's meetings via Microsoft Graph API
- **UI Rendering**: Displays meetings with join buttons

### Token Management

The application implements secure token handling:
- **HTTP-only Cookies**: Tokens stored securely in cookies
- **Automatic Refresh**: Background token refresh every 5 minutes
- **Session Persistence**: Maintains user sessions across browser sessions

## 🔌 API Endpoints

### Authentication Endpoints

- `GET /api/auth/initiatelogin` - Initiates Microsoft login
- `GET /api/auth/status` - Checks authentication status
- `POST /api/auth/set-tokens` - Stores authentication tokens
- `POST /api/auth/logout` - Logs out user
- `POST /api/auth/refresh` - Refreshes access token

### Backend Server Endpoints

- `POST /get-access-token` - Generates access token using client credentials

## 🎨 UI Components

### Material-UI Integration

The app uses Material-UI for a modern, responsive design:
- **Typography**: Consistent text styling
- **Paper**: Card-based layout
- **Button**: Interactive elements
- **Avatar**: Meeting participant display
- **Dialog**: Modal dialogs for authentication

### Color Scheme
- **Primary**: Purple (#8B5CF6)
- **Hover**: Darker purple (#7C3AED)
- **Background**: Clean white with subtle shadows

## 🔒 Security Features

- **OAuth 2.0**: Secure authentication with Microsoft
- **HTTP-only Cookies**: Prevents XSS attacks on tokens
- **Token Expiry**: Automatic handling of expired tokens
- **CORS**: Configured for secure cross-origin requests
- **Environment Variables**: Sensitive data stored securely

## 🚀 Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify Azure AD configuration
   - Check environment variables
   - Ensure redirect URIs match

2. **Token Refresh Issues**
   - Check network connectivity
   - Verify client secret validity
   - Review Azure AD permissions

3. **Calendar Not Loading**
   - Confirm user has calendar permissions
   - Check Microsoft Graph API quotas
   - Verify timezone settings

### Debug Mode

Enable debug logging by adding to `.env.local`:
```env
DEBUG=next-auth:*
```

## 📝 API Documentation

### Microsoft Graph API

The app uses Microsoft Graph API to fetch calendar data:

```javascript
// Fetch today's meetings
GET https://graph.microsoft.com/v1.0/me/calendar/calendarView
Headers: {
  Authorization: `Bearer ${accessToken}`,
  Prefer: `outlook.timezone="${userTimeZone}"`
}
```

### Response Format

```json
{
  "value": [
    {
      "subject": "Meeting Title",
      "start": { "dateTime": "2024-01-01T10:00:00Z" },
      "end": { "dateTime": "2024-01-01T11:00:00Z" },
      "onlineMeeting": { "joinUrl": "https://teams.microsoft.com/..." }
    }
  ]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review Microsoft Graph API documentation

## 🔄 Version History

- **v0.1.0**: Initial release with basic calendar integration
- Features: Authentication, meeting display, join functionality

---

**Built with ❤️ using Next.js, Material-UI, and Microsoft Graph API**
