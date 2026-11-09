from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
ICONS = ROOT / "public" / "icons"
ICONS.mkdir(parents=True, exist_ok=True)

PAPER = (244, 239, 228, 255)
INK = (40, 37, 31, 255)
RED = (184, 70, 44, 255)


def draw_icon(size: int, safe_scale: float = 1.0) -> Image.Image:
    scale = 4
    canvas_size = size * scale
    image = Image.new("RGBA", (canvas_size, canvas_size), PAPER)
    draw = ImageDraw.Draw(image)
    center_x = canvas_size / 2
    center_y = canvas_size * 0.58
    max_radius = canvas_size * 0.32 * safe_scale
    stroke = max(2, round(canvas_size * 0.028 * safe_scale))

    for ratio, opacity in ((1.0, 0.40), (0.675, 0.66), (0.35, 1.0)):
        radius = max_radius * ratio
        color = (INK[0], INK[1], INK[2], round(255 * opacity))
        box = [center_x - radius, center_y - radius, center_x + radius, center_y + radius]
        draw.arc(box, start=180, end=360, fill=color, width=stroke)
        # PIL does not support round caps for arcs; add end caps.
        cap = stroke / 2
        for angle_x in (center_x - radius, center_x + radius):
            draw.ellipse(
                [angle_x - cap, center_y - cap, angle_x + cap, center_y + cap],
                fill=color,
            )

    dot_radius = max(3, round(canvas_size * 0.034 * safe_scale))
    dot_x = center_x + max_radius * 0.98
    dot_y = center_y + canvas_size * 0.025
    draw.ellipse(
        [dot_x - dot_radius, dot_y - dot_radius, dot_x + dot_radius, dot_y + dot_radius],
        fill=RED,
    )

    return image.resize((size, size), Image.Resampling.LANCZOS)


for size, filename, safe_scale in (
    (192, "icon-192.png", 1.0),
    (512, "icon-512.png", 1.0),
    (512, "icon-maskable-512.png", 0.74),
    (180, "apple-touch-icon.png", 1.0),
):
    draw_icon(size, safe_scale).save(ICONS / filename, optimize=True)

print("icons generated")
