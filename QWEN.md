# Voice AI Agent with Avatar Integration

## Project Overview

This is a comprehensive voice AI agent system that combines a Node.js/Express frontend with a Python-based LiveKit agent. The system allows users to interact with an AI agent through real-time voice communication with avatar visualization capabilities.

### Key Components

1. **Frontend (Node.js/Express)**: Serves the Avatar Cockpit UI and handles LiveKit token generation
2. **Agent (Python)**: LiveKit-based voice agent using OpenAI, Silero, and Deepgram plugins
3. **LiveKit Integration**: Real-time communication platform for voice/video streaming
4. **Avatar Visualization**: Cartesia AI integration for avatar previews
5. **Deployment**: Supports Fly.io and Render deployment with Docker

### Technologies Used

- **Frontend**: Node.js, Express, HTML/CSS/JavaScript (LiveKit Client SDK)
- **Backend Agent**: Python (LiveKit Agents SDK, OpenAI Plugins, Silero VAD)
- **AI Services**: OpenAI (GPT models, STT, TTS), Deepgram (STT)
- **Database**: MongoDB (via PyMongo/Motor)
- **Real-time Communication**: LiveKit
- **Avatar Service**: Cartesia AI (face & voice identifiers)
- **Deployment**: Docker, Fly.io, Render

## Architecture

The system consists of three main components working together:

1. **Frontend Server** (`server.js`): Node.js/Express application that serves the HTML UI and provides LiveKit token generation endpoint
2. **Voice Agent** (`integrated_agent.py`, `main.py`): Python application that connects to LiveKit rooms and handles voice interactions
3. **UI Interface** (`index.html`): Single-page application with video streaming and chat capabilities

## Building and Running

### Local Development

1. **Install Dependencies**:
   ```bash
   # For Node.js frontend
   npm install
   
   # For Python agent
   pip install -r requirements.txt
   ```

2. **Set Environment Variables**:
   ```bash
   export LIVEKIT_URL="wss://your-livekit-host"
   export LIVEKIT_API_KEY="lk_api_key"
   export LIVEKIT_API_SECRET="lk_api_secret"
   export OPENAI_API_KEY="your_openai_api_key"
   export OPENAI_MODEL="gpt-4o-mini"  # or other model
   ```

3. **Run the System**:
   ```bash
   # Using the startup script
   ./start_all.sh
   # or
   ./start_system.sh
   
   # Or manually run each component
   # Terminal 1: Start frontend
   npm start
   
   # Terminal 2: Start Python agent
   python main.py
   ```

4. **Access the Application**:
   - Frontend: http://localhost:3000
   - Health Check: http://localhost:3000/healthz

### Using Docker

1. **Build and run the frontend**:
   ```bash
   docker build -t voice-ai-agent .
   docker run -p 3000:3000 \
     -e LIVEKIT_URL=wss://your-livekit-host \
     -e LIVEKIT_API_KEY=lk_api_key \
     -e LIVEKIT_API_SECRET=lk_api_secret \
     voice-ai-agent
   ```

2. **For the Python agent**, there's a separate Dockerfile.agent:
   ```bash
   docker build -f Dockerfile.agent -t voice-ai-agent-python .
   docker run -e OPENAI_API_KEY=your_key \
     -e LIVEKIT_URL=wss://your-livekit-host \
     -e LIVEKIT_API_KEY=lk_api_key \
     -e LIVEKIT_API_SECRET=lk_api_secret \
     voice-ai-agent-python
   ```

## Development Conventions

### Frontend (JavaScript/Node.js)
- Uses vanilla HTML/CSS/JavaScript for the UI
- Follows Express.js conventions for server-side routing
- Implements LiveKit client SDK for real-time communication
- No build process required (static asset serving)

### Backend (Python)
- Uses LiveKit Agents SDK for voice agent functionality
- Implements VAD (Voice Activity Detection) with Silero
- Integrates STT/TTS with OpenAI services
- Uses Deepgram for alternative STT if available

### Environment Variables
- `LIVEKIT_URL`: URL for LiveKit server (ws:// or wss://)
- `LIVEKIT_API_KEY`: LiveKit API key
- `LIVEKIT_API_SECRET`: LiveKit API secret
- `OPENAI_API_KEY`: OpenAI API key for agent functionality
- `OPENAI_MODEL`: OpenAI model to use (default: gpt-4o-mini)
- `PORT`: Port for the frontend server (default: 3000)
- `CARTESIA_API_KEY`: Cartesia API key for avatar rendering (backend only)
- `CARTESIA_FACE_ID`: Cartesia face identifier used for the cockpit preview
- `CARTESIA_VOICE_ID`: Cartesia voice identifier presented in the UI
- `CARTESIA_API_URL` *(optional)*: Override for the Cartesia API base URL (default `https://api.cartesia.ai/v1`)
- `CARTESIA_FACE_RENDER_PATH` *(optional)*: Path template for Cartesia face renders (default `/faces/{faceId}/render`)
- `CARTESIA_FACE_RENDER_URL` *(optional)*: Complete URL template (supports `{faceId}` placeholder) for avatar rendering

## Deployment

### Fly.io Deployment

1. **Authenticate with Fly.io**:
   ```bash
   fly auth login
   ```

2. **Create or configure the application**:
   ```bash
   fly launch --no-deploy
   ```

3. **Set secrets**:
   ```bash
   fly secrets set \
     LIVEKIT_URL=wss://your-livekit-host \
     LIVEKIT_API_KEY=lk_api_key \
     LIVEKIT_API_SECRET=lk_api_secret \
     OPENAI_API_KEY=your_openai_key \
     CARTESIA_API_KEY=your_cartesia_key \
     CARTESIA_FACE_ID=cartesia_face_id \
     CARTESIA_VOICE_ID=cartesia_voice_id
   ```

4. **Deploy**:
   ```bash
   fly deploy
   ```

### Render Deployment

The project includes `render.yaml` for easy deployment to Render:

1. Create a new Web Service in the Render dashboard
2. Point it to this repository
3. Use `npm start` as the start command
4. Configure the same environment variables as in Fly.io

## Key Features

1. **Voice AI Agent**: Real-time voice interaction with AI using STT/TTS
2. **Avatar Visualization**: Preview Cartesia AI avatars
3. **Real-time Communication**: LiveKit-based audio/video streaming
4. **Data Messaging**: Text chat alongside voice communication
5. **Responsive UI**: Clean, modern interface for agent interaction
6. **Multi-platform Deployment**: Supports Fly.io, Render, and Docker

## Configuration Options

The Python agent supports these configuration options:

- **Instructions**: Customize the agent's behavior via `instructions` parameter
- **Model**: Set via `OPENAI_MODEL` environment variable (default: gpt-4o-mini)
- **VAD**: Uses Silero VAD for voice activity detection
- **STT/TTS**: Uses OpenAI services when credentials are available
- **Deepgram**: Alternative STT service when available

## File Structure

```
├── Dockerfile                # Docker image for the frontend
├── Dockerfile.agent          # Docker image for the Python agent
├── README.md                 # Project documentation
├── DEPLOYMENT.md             # Deployment instructions
├── fly.toml                  # Fly.io configuration
├── render.yaml               # Render configuration
├── index.html                # Single-page application
├── package.json              # Node.js metadata
├── server.js                 # Express server with LiveKit token endpoint
├── integrated_agent.py       # Python LiveKit voice agent implementation
├── main.py                   # Python agent entry point
├── requirements.txt          # Python dependencies
├── start_all.sh              # Startup script for all components
├── start_system.sh           # Alternative startup script
├── stop_all.sh               # Stop all components
└── stop_system.sh            # Stop all components (alternative)
```