#!/usr/bin/env python3
"""Test script to verify the agent can connect to the local LiveKit server."""

import asyncio
import os
from typing import Optional

from livekit import api


async def test_connection(url: Optional[str] = None) -> bool:
    """Test connection to the local LiveKit server.

    Args:
        url: Optional override for the LiveKit API URL.

    Returns:
        ``True`` if the server responded to an API call, otherwise ``False``.
    """

    api_url = url or os.environ.get("LIVEKIT_URL", "http://localhost:7880")
    api_key = os.environ.get("LIVEKIT_API_KEY", "devkey")
    api_secret = os.environ.get("LIVEKIT_API_SECRET", "secret")

    # The REST API expects HTTP(S) URLs, convert ws:// prefixes automatically.
    if api_url.startswith("ws://"):
        api_url = "http://" + api_url[len("ws://") :]
    elif api_url.startswith("wss://"):
        api_url = "https://" + api_url[len("wss://") :]

    print(f"Testing connection to LiveKit server at: {api_url}")

    try:
        async with api.LiveKitAPI(url=api_url, api_key=api_key, api_secret=api_secret) as client:
            rooms = await client.room.list_rooms()
        print("✓ Successfully connected to LiveKit server")
        print(f"  - Number of rooms: {len(rooms)}")
    except Exception as exc:  # pragma: no cover - diagnostic utility
        print(f"✗ Failed to connect to LiveKit server: {exc}")
        return False

    return True


if __name__ == "__main__":
    os.environ.setdefault("LIVEKIT_URL", "http://localhost:7880")
    os.environ.setdefault("LIVEKIT_API_KEY", "devkey")
    os.environ.setdefault("LIVEKIT_API_SECRET", "secret")

    success = asyncio.run(test_connection())
    if success:
        print("\nYou can now run your agent with:")
        print("  python main.py")
    else:
        print("\nPlease start the LiveKit server first:")
        print("  cd server && ./start_server_docker.sh")
