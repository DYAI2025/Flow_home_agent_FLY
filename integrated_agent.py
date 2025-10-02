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

    @property
    def has_openai_credentials(self) -> bool:
        return bool(os.environ.get("OPENAI_API_KEY"))


class LiveKitVoiceAgent:
    """Simple LiveKit worker that greets users and mirrors their intent."""

    def __init__(self, config: Optional[AgentConfig] = None) -> None:
        self.config = config or AgentConfig()
        self.logger = logging.getLogger(self.__class__.__name__)

    async def entrypoint(self, ctx: JobContext) -> None:
        """Entrypoint used by the LiveKit worker."""

        await ctx.connect()
        self.logger.info("Voice agent connected to room: %s", ctx.room.name)

        agent = Agent(instructions=self.config.instructions)

        session = AgentSession(
            vad=silero.VAD.load(),
            stt=openai.STT() if self.config.has_openai_credentials else None,
            llm=openai.LLM(model=self.config.model)
            if self.config.has_openai_credentials
            else None,
            tts=openai.TTS() if self.config.has_openai_credentials else None,
        )

        await session.start(agent=agent, room=ctx.room)
        await session.generate_reply(
            instructions="Greet the user warmly and offer your help."
        )

        async for event in self._stream_events(session):
            if event.type == "user_speech_committed" and event.alternatives:
                transcript = event.alternatives[0].text
                self.logger.info("User said: %s", transcript)
                await session.generate_reply(
                    instructions="Answer the user appropriately: " + transcript
                )

    async def _stream_events(self, session: AgentSession) -> AsyncIterator:
        try:
            async for event in session.stream():
                yield event
        except Exception as exc:  # pragma: no cover - diagnostic helper
            self.logger.error("Agent session aborted: %s", exc)
            raise


__all__ = ["LiveKitVoiceAgent", "AgentConfig"]
