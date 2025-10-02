"""Minimal LiveKit voice agent used by the startup scripts.

The original project referenced helper modules that are no longer present in
this repository which caused import errors and prevented the agent worker from
starting.  This lean module restores a functional LiveKit worker so the
frontend can obtain media streams reliably.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from typing import AsyncIterator, Optional

from livekit import api
from livekit.agents import Agent, AgentSession, JobContext
from livekit.plugins import openai, silero


@dataclass
class AgentConfig:
    """Configuration collected from environment variables."""

    instructions: str = (
        "You are a helpful assistant living inside a LiveKit room. "
        "Keep replies short and conversational."
    )
    model: str = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    room_name: str = os.environ.get("LIVEKIT_ROOM_NAME", "default-room")

    @property
    def has_openai_credentials(self) -> bool:
        return bool(os.environ.get("OPENAI_API_KEY"))

    @property
    def livekit_url(self) -> str:
        return os.environ.get("LIVEKIT_URL", "ws://localhost:7880")

    @property
    def api_key(self) -> str:
        return os.environ.get("LIVEKIT_API_KEY", "")

    @property
    def api_secret(self) -> str:
        return os.environ.get("LIVEKIT_API_SECRET", "")


class LiveKitVoiceAgent:
    """Simple LiveKit worker that greets users and mirrors their intent."""

    def __init__(self, config: Optional[AgentConfig] = None) -> None:
        self.config = config or AgentConfig()
        self.logger = logging.getLogger(self.__class__.__name__)

    async def entrypoint(self, ctx: JobContext) -> None:
        """Entrypoint used by the LiveKit worker."""

        # Log connection details for debugging
        self.logger.info("Voice agent entrypoint called for room: %s", ctx.room.name)
        self.logger.info("LiveKit server URL: %s", self.config.livekit_url)

        await ctx.connect()
        self.logger.info("Voice agent connected to room: %s", ctx.room.name)

        # Create and configure the agent
        agent = Agent(instructions=self.config.instructions)

        # Initialize components with error handling
        try:
            vad = silero.VAD.load()
            self.logger.info("VAD model loaded successfully")
        except Exception as e:
            self.logger.error("Failed to load VAD model: %s", e)
            raise

        # Initialize STT, LLM, and TTS components
        stt = None
        llm = None
        tts = None

        if self.config.has_openai_credentials:
            try:
                stt = openai.STT()
                llm = openai.LLM(model=self.config.model)
                tts = openai.TTS()
                self.logger.info("OpenAI components initialized successfully")
            except Exception as e:
                self.logger.error("Failed to initialize OpenAI components: %s", e)
        else:
            self.logger.warning("No OpenAI credentials found - voice agent will not work")

        # Create and start the session
        session = AgentSession(vad=vad, stt=stt, llm=llm, tts=tts)

        try:
            await session.start(agent=agent, room=ctx.room)
            self.logger.info("Agent session started successfully")
        except Exception as e:
            self.logger.error("Failed to start agent session: %s", e)
            raise

        # Initial greeting
        try:
            await session.generate_reply(
                instructions="Greet the user warmly and offer your help."
            )
            self.logger.info("Agent greeting sent")
        except Exception as e:
            self.logger.error("Failed to send initial greeting: %s", e)

        # Listen for user speech and respond
        async for event in self._stream_events(session):
            if event.type == "user_speech_committed" and event.alternatives:
                transcript = event.alternatives[0].text
                self.logger.info("User said: %s", transcript)
                try:
                    await session.generate_reply(
                        instructions="Answer the user appropriately: " + transcript
                    )
                except Exception as e:
                    self.logger.error("Failed to generate reply: %s", e)

    async def _stream_events(self, session: AgentSession) -> AsyncIterator:
        try:
            async for event in session.stream():
                yield event
        except Exception as exc:  # pragma: no cover - diagnostic helper
            self.logger.error("Agent session aborted: %s", exc)
            raise


__all__ = ["LiveKitVoiceAgent", "AgentConfig"]
