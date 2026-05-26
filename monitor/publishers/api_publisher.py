"""Publish metrics to the Agent OS API via HTTP POST."""
import asyncio
import logging

import httpx

log = logging.getLogger(__name__)

_MAX_RETRIES = 3
_BACKOFF_BASE = 2.0


class ApiPublisher:
    def __init__(self, api_url: str):
        self._url = f"{api_url.rstrip('/')}/api/metrics/ingest"

    async def publish(self, snapshot: dict) -> None:
        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.post(self._url, json=snapshot)
                    resp.raise_for_status()
                return
            except (httpx.HTTPError, httpx.ConnectError) as exc:
                if attempt == _MAX_RETRIES:
                    raise
                wait = _BACKOFF_BASE ** attempt
                log.warning("Attempt %d failed (%s), retrying in %.1fs", attempt, exc, wait)
                await asyncio.sleep(wait)
