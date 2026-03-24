"""
SocialPublisher — VideoMachine SaaS
Unified multi-platform video/post publisher using Playwright browser automation.
No official API keys or developer accounts required.
Authentication is done via browser cookies (session hijacking the logged-in session).

Inspired by:
  - UniAPI: github.com/LiuLucian/uniapi (34★, Playwright, 5 platforms)
  - tiktok-uploader: github.com/wkaisertexas/tiktok-uploader (695★)
  - youtube_uploader_selenium: github.com/linouk23/youtube_uploader_selenium (661★)

Supported platforms:
  - Facebook   (post text + video/image to feed)
  - Instagram  (Reels via mobile web or desktop upload)
  - LinkedIn   (video post to feed)

Usage:
    publisher = SocialPublisher(platform_cookies={
        "facebook": "<JSON cookies string>",
        "instagram": "<JSON cookies string>",
        "linkedin": "<JSON cookies string>",
    })
    results = publisher.publish_all(
        video_path="/path/to/video.mp4",
        caption="My caption #hashtag",
        platforms=["facebook", "instagram", "linkedin"],
    )
"""
import os
import json
import logging
import tempfile
import time
from typing import Optional, List, Dict

logger = logging.getLogger(__name__)


def _load_cookies(cookies_input) -> list:
    """Parse cookies from JSON string or list."""
    if isinstance(cookies_input, str):
        return json.loads(cookies_input)
    return cookies_input


def _save_cookies_file(cookies_input) -> str:
    cookies = _load_cookies(cookies_input)
    tmp = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
    json.dump(cookies, tmp)
    tmp.close()
    return tmp.name


# ─────────────────────────────────────────────
# Facebook Publisher (Playwright)
# ─────────────────────────────────────────────

class FacebookPublisher:
    """Post text + video to Facebook feed via Playwright + cookies."""

    def post(self, video_path: str, caption: str, cookies_json: str, headless: bool = True) -> dict:
        from playwright.sync_api import sync_playwright

        cookies = _load_cookies(cookies_json)

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=headless)
            context = browser.new_context(
                viewport={"width": 1280, "height": 800},
                user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
            )
            # Inject saved cookies
            context.add_cookies(cookies)
            page = context.new_page()

            try:
                logger.info("Facebook: opening feed...")
                page.goto("https://www.facebook.com/", wait_until="domcontentloaded", timeout=30000)
                time.sleep(2)

                # Click "What's on your mind?" / "Qu'avez-vous en tête ?"
                post_box = page.locator('[aria-label*="mind"], [aria-label*="tête"], [data-testid="status-attachment-mentions-input"]')
                post_box.first.click(timeout=10000)
                time.sleep(1)

                # Type caption
                page.keyboard.type(caption, delay=30)
                time.sleep(1)

                # Attach video if provided
                if video_path and os.path.isfile(video_path):
                    # Click photo/video button
                    photo_btn = page.locator('[aria-label*="Photo"], [aria-label*="Vidéo"], [aria-label*="photo"], [aria-label*="vidéo"]')
                    photo_btn.first.click(timeout=8000)
                    time.sleep(1)

                    # File input
                    file_input = page.locator('input[type="file"]').first
                    file_input.set_input_files(video_path)
                    # Wait for upload progress to complete (max 3 min)
                    page.wait_for_selector('[aria-label*="Remove"], [aria-label*="Supprimer"]', timeout=180000)
                    time.sleep(2)

                # Click Post / Publier button
                post_btn = page.locator('[aria-label*="Post"], [aria-label*="Publier"]').last
                post_btn.click(timeout=10000)
                time.sleep(3)

                logger.info("Facebook: post submitted.")
                return {"status": "published", "platform": "facebook"}

            except Exception as e:
                page.screenshot(path="/tmp/fb_error.png")
                raise RuntimeError(f"Facebook post failed: {e}")
            finally:
                browser.close()


# ─────────────────────────────────────────────
# Instagram Publisher (Playwright)
# ─────────────────────────────────────────────

class InstagramPublisher:
    """Post a Reel/video to Instagram feed via Playwright + cookies."""

    def post(self, video_path: str, caption: str, cookies_json: str, headless: bool = True) -> dict:
        from playwright.sync_api import sync_playwright

        cookies = _load_cookies(cookies_json)

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=headless)
            context = browser.new_context(
                viewport={"width": 1080, "height": 900},
                user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
            )
            context.add_cookies(cookies)
            page = context.new_page()

            try:
                logger.info("Instagram: navigating to upload...")
                page.goto("https://www.instagram.com/", wait_until="domcontentloaded", timeout=30000)
                time.sleep(2)

                # Click "New Post" (plus/create button)
                create_btn = page.locator('[aria-label*="New post"], [aria-label*="Nouveau post"], svg[aria-label*="New"]')
                create_btn.first.click(timeout=10000)
                time.sleep(1)

                # Select "Post" from menu if shown
                try:
                    post_option = page.get_by_text("Post", exact=True)
                    post_option.first.click(timeout=5000)
                    time.sleep(1)
                except Exception:
                    pass

                # Upload file
                file_input = page.locator('input[type="file"]').first
                file_input.set_input_files(video_path)
                time.sleep(3)

                # Click "Next" through steps
                for _ in range(3):
                    try:
                        next_btn = page.locator('button:has-text("Next"), button:has-text("Suivant")').first
                        next_btn.click(timeout=8000)
                        time.sleep(2)
                    except Exception:
                        break

                # Add caption
                caption_area = page.locator('textarea, [aria-label*="caption"], [aria-label*="Caption"]').first
                caption_area.click(timeout=8000)
                caption_area.fill(caption)
                time.sleep(1)

                # Share
                share_btn = page.locator('button:has-text("Share"), button:has-text("Partager")').first
                share_btn.click(timeout=10000)
                time.sleep(4)

                logger.info("Instagram: post submitted.")
                return {"status": "published", "platform": "instagram"}

            except Exception as e:
                page.screenshot(path="/tmp/ig_error.png")
                raise RuntimeError(f"Instagram post failed: {e}")
            finally:
                browser.close()


# ─────────────────────────────────────────────
# LinkedIn Publisher (Playwright)
# ─────────────────────────────────────────────

class LinkedInPublisher:
    """Post text + video to LinkedIn feed via Playwright + cookies."""

    def post(self, video_path: str, caption: str, cookies_json: str, headless: bool = True) -> dict:
        from playwright.sync_api import sync_playwright

        cookies = _load_cookies(cookies_json)

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=headless)
            context = browser.new_context(
                viewport={"width": 1280, "height": 800},
                user_agent="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
            )
            context.add_cookies(cookies)
            page = context.new_page()

            try:
                logger.info("LinkedIn: opening feed...")
                page.goto("https://www.linkedin.com/feed/", wait_until="domcontentloaded", timeout=30000)
                time.sleep(2)

                # Click "Start a post"
                start_post = page.locator('[placeholder*="post"], .share-box-feed-entry__trigger').first
                start_post.click(timeout=10000)
                time.sleep(2)

                # Type caption
                editor = page.locator('.ql-editor, [contenteditable="true"]').first
                editor.click()
                editor.type(caption, delay=25)
                time.sleep(1)

                # Attach video if provided
                if video_path and os.path.isfile(video_path):
                    media_btn = page.locator('[aria-label*="Add a video"], [aria-label*="Video"]').first
                    media_btn.click(timeout=8000)
                    time.sleep(1)
                    file_input = page.locator('input[type="file"]').first
                    file_input.set_input_files(video_path)
                    # Wait for processing
                    time.sleep(10)

                # Click "Post" / "Publier"
                post_btn = page.locator('button.share-actions__primary-action, button:has-text("Post"), button:has-text("Publier")').first
                post_btn.click(timeout=10000)
                time.sleep(3)

                logger.info("LinkedIn: post submitted.")
                return {"status": "published", "platform": "linkedin"}

            except Exception as e:
                page.screenshot(path="/tmp/li_error.png")
                raise RuntimeError(f"LinkedIn post failed: {e}")
            finally:
                browser.close()


# ─────────────────────────────────────────────
# Unified SocialPublisher
# ─────────────────────────────────────────────

PUBLISHERS = {
    "facebook":  FacebookPublisher,
    "instagram": InstagramPublisher,
    "linkedin":  LinkedInPublisher,
}


class SocialPublisher:
    """
    Unified publisher — publish a video to multiple platforms with one call.
    Each platform uses cookies (no API key needed).
    """

    def __init__(self, platform_cookies: Dict[str, str], headless: bool = True):
        """
        Args:
            platform_cookies: {platform_name: cookies_json_string}
            headless:         Run browsers headlessly
        """
        self.cookies = platform_cookies
        self.headless = headless

    def generate_caption(self, topic: str, platform: str) -> str:
        """Generate a platform-optimized caption via Ollama."""
        try:
            from llm_provider import generate_text
            hints = {
                "facebook": "casual, longer, use emojis, 2-3 hashtags",
                "instagram": "engaging, 5-10 hashtags, emojis",
                "linkedin": "professional tone, no hashtag spam, 1-2 industry hashtags",
            }
            style = hints.get(platform, "engaging, 3-5 hashtags")
            prompt = (
                f"Write a {platform} post caption for a video about '{topic}'. "
                f"Style: {style}. Keep it under 200 characters."
            )
            return generate_text(prompt).strip()
        except Exception as e:
            logger.warning(f"Caption generation failed for {platform}: {e}")
            return f"Check this out! #{topic.replace(' ', '')} #video"

    def publish_all(
        self,
        video_path: str,
        topic: str,
        captions: Optional[Dict[str, str]] = None,
        platforms: Optional[List[str]] = None,
    ) -> Dict[str, dict]:
        """
        Publish to all configured platforms (or a subset).

        Args:
            video_path: Path to the .mp4 video file
            topic:      Topic for AI caption generation
            captions:   Optional per-platform caption overrides {"facebook": "...", ...}
            platforms:  Subset of platforms to publish to (default: all with cookies)

        Returns:
            Dict[platform_name -> result_dict]
        """
        target = platforms or list(self.cookies.keys())
        results = {}

        for platform in target:
            if platform not in self.cookies:
                results[platform] = {"status": "skipped", "reason": "no cookies configured"}
                continue
            if platform not in PUBLISHERS:
                results[platform] = {"status": "skipped", "reason": "platform not supported"}
                continue

            caption = (captions or {}).get(platform) or self.generate_caption(topic, platform)
            publisher = PUBLISHERS[platform]()
            try:
                result = publisher.post(
                    video_path=video_path,
                    caption=caption,
                    cookies_json=self.cookies[platform],
                    headless=self.headless,
                )
                results[platform] = result
                logger.info(f"✅ Published to {platform}")
            except Exception as e:
                logger.error(f"❌ {platform} failed: {e}")
                results[platform] = {"status": "failed", "error": str(e)}

        return results
