#!/usr/bin/env python3
"""Main entry point for starting the LiveKit voice agent worker."""

import asyncio
import logging
from dotenv import load_dotenv

from livekit.agents import WorkerOptions, cli

from integrated_agent import LiveKitVoiceAgent

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def main() -> None:
    """Start the LiveKit worker."""
    logger.info("Starting Voice AI Agent with all features...")

    agent = LiveKitVoiceAgent()
    worker_options = WorkerOptions(entrypoint_fnc=agent.entrypoint)

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
