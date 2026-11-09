from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
RES = ROOT / "android" / "app" / "src" / "main" / "res"
PAPER = (244, 239, 228, 255)
INK = (40, 37, 31, 255)
RED = (184, 70, 44, 255)


def draw_mark(size, scale=1.0, background=None, round_mask=False):
    oversample = 4
    canvas = size * oversample
    image = Image.new("RGBA", (canvas, canvas), background or (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    center_x = canvas / 2
    center_y = canvas * 0.58
    max_radius = canvas * 0.32 * scale
    stroke = max(2, round(canvas * 0.028))
    for ratio, opacity in ((1.0, 0.40), (0.675, 0.66), (0.35, 1.0)):
        radius = max_radius * ratio
        color = (INK[0], INK[1], INK[2], round(255 * opacity))
        box = [center_x - radius, center_y - radius, center_x + radius, center_y + radius]
        draw.arc(box, start=180, end=360, fill=color, width=stroke)
        cap = stroke / 2
        for x in (center_x - radius, center_x + radius):
            draw.ellipse([x - cap, center_y - cap, x + cap, center_y + cap], fill=color)

    dot_radius = max(3, round(canvas * 0.034))
    dot_x = center_x + max_radius * 0.98
    dot_y = center_y + canvas * 0.026
    draw.ellipse(
        [dot_x - dot_radius, dot_y - dot_radius, dot_x + dot_radius, dot_y + dot_radius],
        fill=RED,
    )
    image = image.resize((size, size), Image.Resampling.LANCZOS)
    if round_mask:
        mask = Image.new("L", (size, size), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.ellipse([0, 0, size, size], fill=255)
        image.putalpha(mask)
    return image


def save(image, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=True)


for density, legacy, adaptive in (
    ("mdpi", 48, 108),
    ("hdpi", 72, 162),
    ("xhdpi", 96, 216),
    ("xxhdpi", 144, 324),
    ("xxxhdpi", 192, 432),
):
    folder = RES / f"mipmap-{density}"
    save(draw_mark(legacy, 1.0, PAPER), folder / "ic_launcher.png")
    save(draw_mark(legacy, 1.0, PAPER, round_mask=True), folder / "ic_launcher_round.png")
    save(draw_mark(adaptive, 0.84, None), folder / "ic_launcher_foreground.png")

save(draw_mark(512, 0.9, None), RES / "drawable-nodpi" / "splash_icon.png")
print("android icons generated")
