#!/usr/bin/env python3
from __future__ import annotations

import math
import random
from pathlib import Path


def _escape_xml(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def generate_svg(
    *,
    width: int = 1200,
    height: int = 630,
    seed: int = 20251214,
    dot_count: int = 850,
    r_min: float = 1.4,
    r_max: float = 5.2,
    safe_w: int = 980,
    safe_h: int = 250,
    safe_pad: int = 36,
) -> str:
    rnd = random.Random(seed)

    safe_x0 = (width - safe_w) / 2 - safe_pad
    safe_y0 = (height - safe_h) / 2 - safe_pad
    safe_x1 = (width + safe_w) / 2 + safe_pad
    safe_y1 = (height + safe_h) / 2 + safe_pad

    dots: list[tuple[float, float, float, float]] = []
    attempts = 0
    max_attempts = dot_count * 40

    while len(dots) < dot_count and attempts < max_attempts:
        attempts += 1
        x = rnd.uniform(0, width)
        y = rnd.uniform(0, height)

        if safe_x0 <= x <= safe_x1 and safe_y0 <= y <= safe_y1:
            continue

        u = rnd.random()
        r = r_min + (r_max - r_min) * (u**2)

        edge = min(x, y, width - x, height - y)
        fade = max(0.0, min(1.0, (edge - 6.0) / 64.0))
        opacity = 0.22 + 0.78 * fade

        dots.append((x, y, r, opacity))

    dots_svg = "\n".join(
        f'    <circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.2f}" fill="black" opacity="{opacity:.3f}" />'
        for (x, y, r, opacity) in dots
    )

    title = _escape_xml("POINTILISM")
    subtitle = _escape_xml("A calm, monochrome surface to explore.")

    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <rect width="{width}" height="{height}" fill="white" />
  <g>
{dots_svg}
  </g>
  <g font-family="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" fill="black" text-anchor="middle">
    <text x="{width/2:.1f}" y="{height/2 - 22:.1f}" font-size="96" font-weight="800" letter-spacing="2">{title}</text>
    <text x="{width/2:.1f}" y="{height/2 + 62:.1f}" font-size="34" font-weight="500" opacity="0.92">{subtitle}</text>
  </g>
</svg>
"""


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    assets_dir = root / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)

    svg = generate_svg()
    (assets_dir / "og.svg").write_text(svg, encoding="utf-8")
    print("Wrote assets/og.svg")
    print("Now run: magick assets/og.svg assets/og.png")


if __name__ == "__main__":
    main()
