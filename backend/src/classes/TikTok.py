"""
TikTok Video Publisher — VideoMachine SaaS
Uses TikTok Content Posting API (v2) to upload videos.
Generates TikTok-optimised captions via Ollama.
"""
import os
import time
import json
import logging
import requests
from typing import Optional

logger = logging.getLogger(__name__)


class TikTok:
    """
    Posts short-form videos to TikTok via the official Content Posting API.

    Requires:
    - A TikTok for Developers app with `video.publish` scope
    - A valid access token (obtained via OAuth 2.0)
    """

    UPLOAD_URL = "https://open.tiktokapis.com/v2/post/publish/video/init/"
    QUERY_URL  = "https://open.tiktokapis.com/v2/post/publish/status/fetch/"

    def __init__(self, access_token: str, topic: str) -> None:
        self.access_token = access_token
        self.topic = topic
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json; charset=UTF-8",
        }

    # ──────────────────────────────────────────────
    # Caption generation via Ollama (same as Twitter)
    # ──────────────────────────────────────────────
    def generate_caption(self) -> str:
        """Generate a TikTok caption with hashtags using Ollama."""
        try:
            from llm_provider import generate_text
            prompt = (
                f"Write a short, engaging TikTok caption for a video about '{self.topic}'. "
                "Include 3-5 relevant hashtags. Keep it under 150 characters. "
                "Be energetic and use emojis."
            )
            caption = generate_text(prompt).strip()
            logger.info(f"Generated TikTok caption: {caption[:80]}...")
            return caption
        except Exception as e:
            logger.warning(f"Ollama caption generation failed: {e}. Using fallback.")
            return f"Check this out! #{self.topic.replace(' ', '')} #viral #trending"

    # ──────────────────────────────────────────────
    # Upload video file to TikTok (FILE_UPLOAD mode)
    # ──────────────────────────────────────────────
    def upload_video(
        self,
        video_path: str,
        caption: Optional[str] = None,
        privacy: str = "PUBLIC_TO_EVERYONE",
    ) -> dict:
        """
        Upload a video file to TikTok using the Content Posting API.

        Args:
            video_path:  Local path to the video file (.mp4)
            caption:     Post caption (generated if None)
            privacy:     PUBLIC_TO_EVERYONE | MUTUAL_FOLLOW_FRIENDS | FOLLOWER_OF_CREATOR | SELF_ONLY

        Returns:
            dict with publish_id and status
        """
        if not os.path.isfile(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        if caption is None:
            caption = self.generate_caption()

        file_size = os.path.getsize(video_path)
        logger.info(f"Uploading {video_path} ({file_size} bytes) to TikTok…")

        # Step 1 — Init upload
        init_payload = {
            "post_info": {
                "title": caption,
                "privacy_level": privacy,
                "disable_duet": False,
                "disable_comment": False,
                "disable_stitch": False,
            },
            "source_info": {
                "source": "FILE_UPLOAD",
                "video_size": file_size,
                "chunk_size": file_size,
                "total_chunk_count": 1,
            },
        }

        r = requests.post(self.UPLOAD_URL, headers=self.headers, json=init_payload, timeout=30)
        r.raise_for_status()
        init_data = r.json()

        if init_data.get("error", {}).get("code", "ok") != "ok":
            raise RuntimeError(f"TikTok init error: {init_data['error']}")

        publish_id  = init_data["data"]["publish_id"]
        upload_url  = init_data["data"]["upload_url"]
        logger.info(f"TikTok publish_id: {publish_id}")

        # Step 2 — Upload binary
        with open(video_path, "rb") as f:
            video_data = f.read()

        upload_headers = {
            "Content-Range": f"bytes 0-{file_size - 1}/{file_size}",
            "Content-Type": "video/mp4",
        }
        r2 = requests.put(upload_url, headers=upload_headers, data=video_data, timeout=120)
        r2.raise_for_status()
        logger.info("Video binary uploaded successfully.")

        # Step 3 — Poll for processing status
        return self._poll_status(publish_id)

    def _poll_status(self, publish_id: str, max_wait: int = 120) -> dict:
        """Poll TikTok until processing is complete or fails."""
        deadline = time.time() + max_wait
        while time.time() < deadline:
            r = requests.post(
                self.QUERY_URL,
                headers=self.headers,
                json={"publish_id": publish_id},
                timeout=15,
            )
            r.raise_for_status()
            data = r.json()
            status = data.get("data", {}).get("status", "UNKNOWN")
            logger.info(f"TikTok publish status: {status}")

            if status == "PUBLISH_COMPLETE":
                return {"publish_id": publish_id, "status": "published",
                        "tiktok_status": status}
            if status in ("FAILED", "PUBLISH_FAILED"):
                reason = data.get("data", {}).get("fail_reason", "unknown")
                raise RuntimeError(f"TikTok publish failed: {reason}")

            time.sleep(5)

        raise TimeoutError(f"TikTok processing timed out after {max_wait}s")

    # ──────────────────────────────────────────────
    # Convenience: generate caption + post
    # ──────────────────────────────────────────────
    def post(
        self,
        video_path: str,
        custom_caption: Optional[str] = None,
        privacy: str = "PUBLIC_TO_EVERYONE",
    ) -> dict:
        caption = custom_caption or self.generate_caption()
        return self.upload_video(video_path, caption=caption, privacy=privacy)
