#!/usr/bin/env python3
"""Export app branding from online-spelling-quiz.png (requires Pillow)."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
RESAMPLE = Image.Resampling.LANCZOS


def icon(artwork, size, fill=0.92, background=(0, 0, 0, 0)):
    canvas = Image.new("RGBA", (size, size), background)
    extent = round(size * fill)
    mark = ImageOps.contain(artwork, (extent, extent), RESAMPLE)
    canvas.alpha_composite(mark, ((size - mark.width) // 2, (size - mark.height) // 2))
    return canvas


def social_preview(artwork):
    canvas = Image.new("RGBA", (1200, 630), "#071311")
    draw = ImageDraw.Draw(canvas)
    # Keep the supplied artwork on its own panel so small preview text stays clear.
    draw.rounded_rectangle((744, 64, 1136, 566), radius=40, fill="#0c2927")
    mark = icon(artwork, 360)
    canvas.alpha_composite(mark, (760, 135))
    bold = "DejaVuSans-Bold.ttf"
    regular = "DejaVuSans.ttf"
    draw.rounded_rectangle((72, 100, 316, 140), radius=12, fill="#134e4a")
    draw.text((90, 110), "ONLINE SPELLING QUIZ", font=ImageFont.truetype(bold, 17), fill="#5eead4")
    draw.text((72, 190), "Master Your", font=ImageFont.truetype(bold, 58), fill="#f0fdfa")
    draw.text((72, 260), "Spelling Online", font=ImageFont.truetype(bold, 58), fill="#f0fdfa")
    draw.text((76, 370), "Interactive audio quizzes, personalized", font=ImageFont.truetype(regular, 25), fill="#b2cfca")
    draw.text((76, 408), "word lists, and instant feedback.", font=ImageFont.truetype(regular, 25), fill="#b2cfca")
    draw.text((76, 512), "Built by Imran Pollob  ·  Free & Open Source", font=ImageFont.truetype(bold, 20), fill="#5eead4")
    canvas.convert("RGB").save(PUBLIC / "og-image.png", optimize=True)


def main():
    source = Image.open(ROOT / "online-spelling-quiz.png").convert("RGBA")
    # Ignore faint edge specks when centering, retaining a little breathing room.
    bounds = source.getchannel("A").point(lambda alpha: 255 if alpha >= 16 else 0).getbbox()
    if bounds is None:
        raise ValueError("The source logo is empty")
    left, top, right, bottom = bounds
    padding = 8
    artwork = source.crop((max(0, left - padding), max(0, top - padding),
                           min(source.width, right + padding), min(source.height, bottom + padding)))

    brand = icon(artwork, 512)
    brand.save(PUBLIC / "brand-logo.png", optimize=True)
    brand.save(ROOT / "src/assets/brand-logo.png", optimize=True)
    for size in (16, 32):
        icon(artwork, size).save(PUBLIC / f"favicon-{size}x{size}.png", optimize=True)
    icon(artwork, 64).save(PUBLIC / "favicon.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64)])
    for size in (192, 512):
        icon(artwork, size).save(PUBLIC / f"logo{size}.png", optimize=True)
    icon(artwork, 180, fill=0.80, background="#ecfdfb").convert("RGB").save(
        PUBLIC / "apple-touch-icon.png", optimize=True)
    # A square within 56% of the canvas fits inside the maskable 80% safe circle.
    icon(artwork, 512, fill=0.56, background="#ecfdfb").convert("RGB").save(
        PUBLIC / "logo-maskable512.png", optimize=True)
    social_preview(artwork)
    print("Updated header logo, favicons, app icons, and social preview.")


if __name__ == "__main__":
    main()
