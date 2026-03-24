"""
TikTok Publisher — VideoMachine SaaS
Uses tiktok-uploader (github.com/wkaisertexas/tiktok-uploader, 695★, active Mar 2026)
which authenticates via browser cookies — NO official API key required.

Install: pip install tiktok-uploader
Cookie extraction: use browser extension "Cookie Editor" → export JSON → paste in Settings
"""
import os
import json
import logging
import tempfile
from typing import Optional

logger = logging.getLogger(__name__)


def _cookies_to_file(cookies_json: str) -> str:
    """Write cookies JSON string to a temp file, return the path."""
    tmp = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
    # Accept both JSON string and already-parsed list
    if isinstance(cookies_json, str):
        data = json.loads(cookies_json)
    else:
        data = cookies_json
    json.dump(data, tmp)
    tmp.close()
    return tmp.name


class TikTok:
    """
    Posts videos to TikTok via browser cookie authentication.
    No developer account, no API key, no payment required.

    Uses: tiktok-uploader (pip install tiktok-uploader)
    Ref:  https://github.com/wkaisertexas/tiktok-uploader
    """

    def __init__(self, cookies: str, topic: str) -> None:
        """
        Args:
            cookies: TikTok session cookies as JSON string
                     (export from browser using "Cookie Editor" extension)
            topic:   Topic/niche for AI caption generation via Ollama
        """
        self.cookies = cookies
        self.topic = topic

    # ──────────────────────────────────────────────────────
    # Caption generation via Ollama (no API key needed)
    # ──────────────────────────────────────────────────────
    def generate_caption(self) -> str:
        """Generate a TikTok caption with hashtags using the local Ollama LLM."""
        try:
            from llm_provider import generate_text
            prompt = (
                f"Write a short, engaging TikTok caption for a video about '{self.topic}'. "
                "Include 3-5 relevant hashtags. Keep it under 150 characters. "
                "Be energetic and use emojis."
            )
            return generate_text(prompt).strip()
        except Exception as e:
            logger.warning(f"Ollama caption failed: {e}. Using fallback.")
            tag = self.topic.replace(' ', '')
            return f"🔥 {self.topic} #{tag} #viral #trending"

    # ──────────────────────────────────────────────────────
    # Upload via tiktok-uploader (cookie-based, no API)
    # ──────────────────────────────────────────────────────
    def post(
        self,
        video_path: str,
        custom_caption: Optional[str] = None,
        headless: bool = True,
    ) -> dict:
        """
        Upload a video to TikTok using stored browser cookies.

        Args:
            video_path:     Path to the .mp4 file
            custom_caption: Caption override (AI-generated if None)
            headless:       Run browser in headless mode

        Returns:
            dict with status and caption used
        """
        try:
            from tiktok_uploader.upload import upload_video
        except ImportError:
            raise ImportError(
                "tiktok-uploader not installed. Run: pip install tiktok-uploader"
            )

        if not os.path.isfile(video_path):
            raise FileNotFoundError(f"Video not found: {video_path}")

        caption = custom_caption or self.generate_caption()
        cookies_file = _cookies_to_file(self.cookies)

        try:
            logger.info(f"Uploading to TikTok (cookie-based): {os.path.basename(video_path)}")
            upload_video(
                video_path,
                description=caption,
                cookies=cookies_file,
                headless=headless,
            )
            logger.info("TikTok upload complete.")
            return {"status": "published", "caption": caption, "method": "cookie"}
        finally:
            try:
                os.unlink(cookies_file)
            except Exception:
                pass
