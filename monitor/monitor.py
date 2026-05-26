"""VPS system metrics collector — runs on loop, pushes to API."""
import asyncio
import logging
import os
import time

import psutil

from publishers.api_publisher import ApiPublisher

logging.basicConfig(level=logging.INFO, format="%(asctime)s [monitor] %(message)s")
log = logging.getLogger(__name__)


def collect() -> dict:
    cpu = psutil.cpu_percent(interval=1)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    uptime = int(time.time() - psutil.boot_time())
    try:
        conns = len(psutil.net_connections())
    except psutil.AccessDenied:
        conns = 0

    return {
        "cpu_pct": cpu,
        "ram_used_gb": round(mem.used / 1e9, 3),
        "ram_total_gb": round(mem.total / 1e9, 3),
        "disk_used_gb": round(disk.used / 1e9, 3),
        "disk_total_gb": round(disk.total / 1e9, 3),
        "uptime_seconds": uptime,
        "connections": conns,
        "region": os.getenv("REGION", "hermes-vps"),
    }


async def main() -> None:
    interval = int(os.getenv("MONITOR_INTERVAL_SECONDS", "5"))
    api_url = os.getenv("MONITOR_API_URL", "http://localhost:8001")
    publisher = ApiPublisher(api_url)

    log.info("Monitor starting — pushing to %s every %ds", api_url, interval)
    while True:
        try:
            snapshot = collect()
            await publisher.publish(snapshot)
            log.debug("Published: cpu=%.1f%%", snapshot["cpu_pct"])
        except Exception as exc:
            log.warning("Publish failed: %s", exc)
        await asyncio.sleep(interval)


if __name__ == "__main__":
    asyncio.run(main())
