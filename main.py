#!/usr/bin/env python3
"""Main entry point for starting the LiveKit voice agent worker."""

import asyncio
import logging
from dotenv import load_dotenv
import os

from livekit.agents import WorkerOptions, cli
from livekit.agents.job import JobContext, JobAcceptanceTimeout
from livekit import api

from integrated_agent import LiveKitVoiceAgent, AgentConfig

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def job_request_fnc(job: JobContext):
    """Handle incoming job requests from the LiveKit server."""
    logger.info(f"Received job request for room: {job.room.name}")
    
    # Use the room name from the job context to ensure we're in the right room
    config = AgentConfig(room_name=job.room.name)
    agent = LiveKitVoiceAgent(config=config)
    
    # Accept the job and run the agent
    try:
        await agent.entrypoint(job)
    except Exception as e:
        logger.error(f"Error in agent entrypoint: {e}")
        raise


async def main() -> None:
    """Start the LiveKit worker."""
    logger.info("Starting Voice AI Agent with all features...")
    
    # Get configuration from environment variables
    livekit_url = os.environ.get("LIVEKIT_URL", "ws://localhost:7880")
    api_key = os.environ.get("LIVEKIT_API_KEY", "")
    api_secret = os.environ.get("LIVEKIT_API_SECRET", "")
    
    logger.info(f"LiveKit server URL: {livekit_url}")
    
    # Ensure credentials are available
    if not api_key or not api_secret:
        logger.warning("LIVEKIT_API_KEY or LIVEKIT_API_SECRET not set - agent may not connect properly")
    
    # Create worker options
    worker_options = WorkerOptions(
        request_fnc=job_request_fnc,
        worker_type="room",  # Agent joins rooms as they are created
        auto_subscribe="all"  # Subscribe to all tracks by default
    )

    logger.info("Voice AI Agent is starting...")
    await cli.run_app(worker_options)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Voice AI Agent stopped by user")
    except Exception as exc:  # pragma: no cover - diagnostic helper
        logger.error("Error running Voice AI Agent: %s", exc)
        raise
