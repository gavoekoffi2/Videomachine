"""
Video Generation Service - Core engine based on MoneyPrinterV2
Handles: script generation, TTS, image fetching, video assembly
"""
import os
import json
import asyncio
import subprocess
import tempfile
import shutil
from typing import Optional, List
from pathlib import Path
import httpx
import logging

logger = logging.getLogger(__name__)


class VideoGeneratorService:
    def __init__(self):
        self.upload_dir = Path(os.getenv("UPLOAD_DIR", "./uploads"))
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        (self.upload_dir / "videos").mkdir(exist_ok=True)
        (self.upload_dir / "audio").mkdir(exist_ok=True)
        (self.upload_dir / "images").mkdir(exist_ok=True)
        (self.upload_dir / "temp").mkdir(exist_ok=True)

    async def generate_script(self, topic: str, language: str = "fr", style: str = "motivational") -> str:
        """Generate video script using AI"""
        from app.core.config import settings

        style_prompts = {
            "motivational": "inspirant et motivant",
            "educational": "éducatif et informatif",
            "news": "informatif style journal",
            "story": "narratif et captivant",
            "marketing": "persuasif et commercial",
        }
        style_desc = style_prompts.get(style, "engageant")

        prompt = f"""Crée un script vidéo court (60-90 secondes) en {language} sur le sujet: "{topic}".

Style: {style_desc}
Format: texte narratif divisé en 5-7 sections courtes.
Chaque section = 1 image/scène.
Pas de markdown, juste le texte.
Rends-le accrocheur et adapté aux réseaux sociaux (YouTube Shorts, TikTok, Instagram Reels).

Script:"""

        if settings.ANTHROPIC_API_KEY:
            import anthropic
            client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            message = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )
            return message.content[0].text.strip()
        elif settings.OPENAI_API_KEY:
            import openai
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1024
            )
            return response.choices[0].message.content.strip()
        else:
            # Fallback: generate a demo script
            return self._demo_script(topic, language)

    def _demo_script(self, topic: str, language: str) -> str:
        if language == "fr":
            return f"""Bienvenue dans cette vidéo sur {topic}.

{topic} est un sujet fascinant qui mérite toute notre attention aujourd'hui.

Voici ce que vous devez absolument savoir sur {topic}.

Les experts s'accordent à dire que {topic} va transformer notre façon de vivre.

Rejoignez les milliers de personnes qui ont déjà découvert les secrets de {topic}.

N'attendez plus, passez à l'action dès maintenant!

Abonnez-vous pour plus de contenu inspirant sur {topic} et bien d'autres sujets."""
        else:
            return f"""Welcome to this video about {topic}.

{topic} is a fascinating subject that deserves our full attention today.

Here's what you absolutely need to know about {topic}.

Experts agree that {topic} will transform the way we live.

Join the thousands of people who have already discovered the secrets of {topic}.

Don't wait any longer, take action now!

Subscribe for more inspiring content about {topic} and many other topics."""

    async def generate_tts(self, text: str, voice_name: str = "fr-FR-DeniseNeural",
                           output_path: str = None) -> str:
        """Generate text-to-speech audio"""
        if output_path is None:
            output_path = str(self.upload_dir / "audio" / f"audio_{os.urandom(8).hex()}.mp3")

        try:
            import edge_tts
            communicate = edge_tts.Communicate(text, voice_name)
            await communicate.save(output_path)
            return output_path
        except Exception as e:
            logger.warning(f"edge-tts failed: {e}, trying gTTS fallback")
            return await self._gtts_fallback(text, output_path)

    async def _gtts_fallback(self, text: str, output_path: str) -> str:
        from gtts import gTTS
        lang = "fr" if "fr" in output_path or "fr" in text[:10] else "en"
        tts = gTTS(text=text, lang=lang, slow=False)
        tts.save(output_path)
        return output_path

    async def fetch_images(self, queries: List[str], count_per_query: int = 2) -> List[str]:
        """Fetch stock images from Pexels or Pixabay"""
        from app.core.config import settings
        images = []

        for query in queries:
            try:
                if settings.PEXELS_API_KEY:
                    imgs = await self._fetch_pexels(query, count_per_query, settings.PEXELS_API_KEY)
                    images.extend(imgs)
                elif settings.PIXABAY_API_KEY:
                    imgs = await self._fetch_pixabay(query, count_per_query, settings.PIXABAY_API_KEY)
                    images.extend(imgs)
                else:
                    # Use placeholder gradient images
                    imgs = await self._create_placeholder_images(query, count_per_query)
                    images.extend(imgs)
            except Exception as e:
                logger.error(f"Failed to fetch images for {query}: {e}")
                imgs = await self._create_placeholder_images(query, count_per_query)
                images.extend(imgs)

        return images

    async def _fetch_pexels(self, query: str, count: int, api_key: str) -> List[str]:
        images = []
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://api.pexels.com/v1/search",
                headers={"Authorization": api_key},
                params={"query": query, "per_page": count, "orientation": "portrait"}
            )
            if resp.status_code == 200:
                data = resp.json()
                for photo in data.get("photos", []):
                    img_url = photo["src"]["large"]
                    img_path = await self._download_image(img_url)
                    if img_path:
                        images.append(img_path)
        return images

    async def _fetch_pixabay(self, query: str, count: int, api_key: str) -> List[str]:
        images = []
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://pixabay.com/api/",
                params={
                    "key": api_key, "q": query, "per_page": count,
                    "image_type": "photo", "orientation": "vertical"
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                for hit in data.get("hits", []):
                    img_path = await self._download_image(hit["largeImageURL"])
                    if img_path:
                        images.append(img_path)
        return images

    async def _download_image(self, url: str) -> Optional[str]:
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    ext = url.split(".")[-1].split("?")[0] or "jpg"
                    path = str(self.upload_dir / "images" / f"img_{os.urandom(8).hex()}.{ext}")
                    with open(path, "wb") as f:
                        f.write(resp.content)
                    return path
        except Exception as e:
            logger.error(f"Failed to download image {url}: {e}")
        return None

    async def _create_placeholder_images(self, text: str, count: int) -> List[str]:
        """Create gradient placeholder images when no API key is available"""
        images = []
        try:
            from PIL import Image, ImageDraw, ImageFont
            import random

            gradients = [
                [(63, 94, 251), (252, 70, 107)],
                [(17, 153, 142), (56, 239, 125)],
                [(238, 9, 121), (255, 106, 0)],
                [(0, 195, 255), (0, 43, 255)],
                [(131, 58, 180), (253, 29, 29)],
            ]

            for i in range(count):
                w, h = 1080, 1920
                img = Image.new("RGB", (w, h))
                draw = ImageDraw.Draw(img)
                colors = gradients[random.randint(0, len(gradients) - 1)]

                for y in range(h):
                    r = int(colors[0][0] + (colors[1][0] - colors[0][0]) * y / h)
                    g = int(colors[0][1] + (colors[1][1] - colors[0][1]) * y / h)
                    b = int(colors[0][2] + (colors[1][2] - colors[0][2]) * y / h)
                    draw.line([(0, y), (w, y)], fill=(r, g, b))

                path = str(self.upload_dir / "images" / f"placeholder_{os.urandom(8).hex()}.jpg")
                img.save(path, "JPEG", quality=85)
                images.append(path)
        except Exception as e:
            logger.error(f"Failed to create placeholder: {e}")
        return images

    def extract_keywords(self, script: str, count: int = 5) -> List[str]:
        """Extract keywords from script for image search"""
        words = script.split()
        stop_words = {"le", "la", "les", "un", "une", "des", "de", "du", "et", "ou",
                      "en", "dans", "sur", "pour", "par", "avec", "sans", "the", "a",
                      "an", "and", "or", "in", "on", "for", "with", "this", "that"}
        keywords = []
        for word in words:
            word_clean = word.lower().strip(".,!?;:")
            if len(word_clean) > 4 and word_clean not in stop_words and word_clean not in keywords:
                keywords.append(word_clean)
            if len(keywords) >= count:
                break
        return keywords if keywords else ["nature", "technology", "success", "business", "people"]

    async def assemble_video(self, images: List[str], audio_path: str,
                              output_path: str = None, resolution: str = "1080x1920") -> str:
        """Assemble final video from images and audio using ffmpeg"""
        if output_path is None:
            output_path = str(self.upload_dir / "videos" / f"video_{os.urandom(8).hex()}.mp4")

        w, h = map(int, resolution.split("x"))
        temp_dir = self.upload_dir / "temp" / os.urandom(8).hex()
        temp_dir.mkdir(parents=True)

        try:
            if not images:
                images = await self._create_placeholder_images("video", 5)

            # Get audio duration
            audio_duration = await self._get_audio_duration(audio_path)
            img_duration = max(2.0, audio_duration / len(images))

            # Create input file list for ffmpeg concat
            concat_file = str(temp_dir / "concat.txt")
            with open(concat_file, "w") as f:
                for img in images:
                    # Resize image to target resolution
                    resized = str(temp_dir / f"resized_{Path(img).name}")
                    await self._resize_image(img, resized, w, h)
                    f.write(f"file '{resized}'\n")
                    f.write(f"duration {img_duration:.2f}\n")

            # FFmpeg command to create video with audio
            cmd = [
                "ffmpeg", "-y",
                "-f", "concat", "-safe", "0", "-i", concat_file,
                "-i", audio_path,
                "-vf", f"scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:black",
                "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                "-c:a", "aac", "-b:a", "128k",
                "-shortest", "-movflags", "+faststart",
                output_path
            ]

            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                logger.error(f"FFmpeg error: {stderr.decode()}")
                # Fallback: simple video without complex filter
                await self._simple_video_assembly(images[0] if images else None,
                                                   audio_path, output_path, w, h)

            return output_path
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    async def _resize_image(self, input_path: str, output_path: str, w: int, h: int):
        try:
            from PIL import Image
            img = Image.open(input_path).convert("RGB")
            # Resize maintaining aspect ratio, pad to fill
            img_ratio = img.width / img.height
            target_ratio = w / h
            if img_ratio > target_ratio:
                new_h = h
                new_w = int(h * img_ratio)
            else:
                new_w = w
                new_h = int(w / img_ratio)
            img = img.resize((new_w, new_h), Image.LANCZOS)
            # Crop center
            left = (new_w - w) // 2
            top = (new_h - h) // 2
            img = img.crop((left, top, left + w, top + h))
            img.save(output_path, "JPEG", quality=90)
        except Exception as e:
            logger.error(f"Image resize failed: {e}")
            shutil.copy(input_path, output_path)

    async def _simple_video_assembly(self, image_path: Optional[str], audio_path: str,
                                      output_path: str, w: int, h: int):
        """Fallback: single image looped over audio"""
        if not image_path:
            return
        cmd = [
            "ffmpeg", "-y",
            "-loop", "1", "-i", image_path,
            "-i", audio_path,
            "-c:v", "libx264", "-preset", "fast",
            "-c:a", "aac", "-b:a", "128k",
            "-shortest", "-vf", f"scale={w}:{h}",
            output_path
        ]
        proc = await asyncio.create_subprocess_exec(*cmd,
                                                     stdout=asyncio.subprocess.PIPE,
                                                     stderr=asyncio.subprocess.PIPE)
        await proc.communicate()

    async def _get_audio_duration(self, audio_path: str) -> float:
        """Get audio duration using ffprobe"""
        try:
            cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                   "-of", "json", audio_path]
            proc = await asyncio.create_subprocess_exec(*cmd,
                                                         stdout=asyncio.subprocess.PIPE,
                                                         stderr=asyncio.subprocess.PIPE)
            stdout, _ = await proc.communicate()
            data = json.loads(stdout.decode())
            return float(data["format"]["duration"])
        except Exception:
            return 30.0  # default 30 seconds

    async def generate_thumbnail(self, video_path: str) -> Optional[str]:
        """Extract thumbnail from video"""
        try:
            thumb_path = video_path.replace(".mp4", "_thumb.jpg")
            cmd = ["ffmpeg", "-y", "-i", video_path, "-ss", "00:00:01",
                   "-vframes", "1", "-q:v", "2", thumb_path]
            proc = await asyncio.create_subprocess_exec(*cmd,
                                                         stdout=asyncio.subprocess.PIPE,
                                                         stderr=asyncio.subprocess.PIPE)
            await proc.communicate()
            if os.path.exists(thumb_path):
                return thumb_path
        except Exception as e:
            logger.error(f"Thumbnail generation failed: {e}")
        return None

    async def full_pipeline(self, video_id: int, topic: str, language: str = "fr",
                             style: str = "motivational", voice_name: str = "fr-FR-DeniseNeural",
                             resolution: str = "1080x1920", db=None) -> dict:
        """Complete video generation pipeline"""
        from app.models.video import Video

        def update_status(status: str, **kwargs):
            if db:
                vid = db.query(Video).filter(Video.id == video_id).first()
                if vid:
                    vid.status = status
                    for k, v in kwargs.items():
                        setattr(vid, k, v)
                    db.commit()

        try:
            update_status("processing")

            # Step 1: Generate script
            logger.info(f"[Video {video_id}] Generating script...")
            script = await self.generate_script(topic, language, style)
            update_status("processing", script=script)

            # Step 2: Generate TTS
            logger.info(f"[Video {video_id}] Generating TTS...")
            audio_path = await self.generate_tts(script, voice_name)

            # Step 3: Fetch images
            logger.info(f"[Video {video_id}] Fetching images...")
            keywords = self.extract_keywords(script)
            images = await self.fetch_images([topic] + keywords[:3])

            if not images:
                images = await self._create_placeholder_images(topic, 5)

            # Step 4: Assemble video
            logger.info(f"[Video {video_id}] Assembling video...")
            video_path = await self.assemble_video(images, audio_path, resolution=resolution)

            # Step 5: Generate thumbnail
            thumbnail_path = await self.generate_thumbnail(video_path)

            # Get file info
            file_size = os.path.getsize(video_path) if os.path.exists(video_path) else 0
            duration = await self._get_audio_duration(video_path)

            # Build URLs
            base_url = f"/uploads/videos/{Path(video_path).name}"
            thumb_url = f"/uploads/videos/{Path(thumbnail_path).name}" if thumbnail_path else None

            from datetime import datetime
            update_status("completed",
                          video_url=base_url,
                          thumbnail_url=thumb_url,
                          duration=duration,
                          file_size=file_size,
                          completed_at=datetime.utcnow())

            return {
                "status": "completed",
                "video_url": base_url,
                "thumbnail_url": thumb_url,
                "duration": duration,
                "script": script
            }

        except Exception as e:
            logger.exception(f"[Video {video_id}] Generation failed: {e}")
            update_status("failed", error_message=str(e))
            return {"status": "failed", "error": str(e)}


video_generator = VideoGeneratorService()
