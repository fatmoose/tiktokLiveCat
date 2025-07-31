# TikTok Live Connector

A full-stack application that connects to TikTok Live streams and displays real-time visual effects based on live engagement events like likes, comments, gifts, follows, and shares.

## 🚀 Features

- **Real-time TikTok Live Events**: Connects to TikTok Live streams and captures events
- **Visual Effects**: Confetti animations, progress bars, and interactive elements
- **Multiple Event Types**: Handles likes, comments, gifts, follows, shares, and viewer count
- **Responsive Design**: Modern React-based UI with smooth animations
- **WebSocket Communication**: Real-time updates using Socket.IO

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- Active TikTok Live stream to connect to

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd cat
```

### 2. Install All Dependencies
```bash
npm run install-all
```

## 🏃‍♂️ Running the Application

### Option 1: Run Both Client and Server Together (Recommended)
```bash
npm run dev
```
This will start both the server (`http://localhost:8081`) and client (`http://localhost:5173`) simultaneously.

### Option 2: Run Individually
```bash
# Start server only
npm run server

# Start client only (in a new terminal)
npm run client
```

### Option 3: Legacy Method
```bash
# Start the Server
cd server
npm start

# Start the Client (in a new terminal)
cd client
npm run dev
```

### 3. Connect to a TikTok Live Stream
1. Open your browser and go to `http://localhost:5173`
2. Click the "Connect" button
3. Enter a TikTok username (e.g., `@username`)
4. Click "Connect" to start receiving live events

## 📋 Available Scripts

From the root directory, you can run:

- `npm run dev` - **Start both client and server together**
- `npm run server` - Start only the server
- `npm run client` - Start only the client
- `npm run install-all` - Install dependencies for both client and server
- `npm run build` - Build the client for production
- `npm start` - Start the server for production

## 📁 Project Structure

```
cat/
├── server/                 # Node.js backend
│   ├── index.js           # Main server file
│   ├── connectionWrapper.js # TikTok connection wrapper
│   └── package.json       # Server dependencies
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── connect/   # Connection interface
│   │   │   ├── counter/   # Progress bar and confetti
│   │   │   ├── toothless/ # Animated GIF display
│   │   │   └── snack/     # Decorative elements
│   │   ├── App.jsx        # Main app component
│   │   ├── config.js      # Configuration settings
│   │   └── clientWrapper.js # Socket.IO client wrapper
│   └── package.json       # Client dependencies
```

## 🎯 Supported Events

- **Likes**: Triggers confetti and progress bar updates
- **Comments**: Logged to console (can be extended)
- **Gifts**: Displays gift information
- **Follows**: Shows new follower notifications
- **Shares**: Tracks stream shares
- **Viewer Count**: Monitors live viewer count

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the client directory:
```
VITE_SERVER_URL=http://localhost:8081
```

### Server Configuration
- **Port**: Default 8081 (set via `process.env.PORT`)
- **Session ID**: Optional TikTok session ID (set via `process.env.SESSIONID`)

## 🐛 Troubleshooting

### Common Issues

1. **Connection Failed**: Ensure the TikTok username is correct and the stream is live
2. **No Events**: Verify the stream has active engagement (likes, comments, etc.)
3. **Port Conflicts**: Change ports in config if 8081 or 5173 are in use

### Debug Mode
Enable debug logging by setting environment variables:
```bash
DEBUG=* npm start
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Based On

This project uses the [TikTok-Live-Connector](https://github.com/zerodytrash/TikTok-Live-Connector) library for connecting to TikTok Live streams. 