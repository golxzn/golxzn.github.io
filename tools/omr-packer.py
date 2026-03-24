#!/usr/bin/env python3

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Optional, Union
from PIL import Image

ChannelValue = Union[Image.Image, float]

DEFAULT_AO: float = 1.0
DEFAULT_METALLIC: float = 0.0
DEFAULT_ROUGHNESS: float = 1.0


def parse_channel(arg: Optional[str], def: float) -> ChannelValue:
    if arg is None:
        return def

    try:
        return float(arg)
    except ValueError:
        return Image.open(Path(arg)).convert('L')


def constant_channel(size: tuple[int, int], value: float) -> Image.Image:
    pixel: int = int(round(max(0.0, min(1.0, value)) * 255))
    return Image.new("L", size, pixel)


def resolve_channel(value: ChannelValue, size: tuple[int, int]) -> Image.Image:
    if not isinstance(value, Image.Image):
        return constant_channel(size, value)

    if value.size != size:
        raise ValueError("All textures must have identical resolution.")

    return value



def determine_size(channels: tuple[ChannelValue, ...]) -> tuple[int, int]:
    for c in channels:
        if isinstance(c, Image.Image):
            return c.size

    raise ValueError("At least one texture input must be provided.")


def pack_orm(
    ao: ChannelValue,
    metallic: ChannelValue,
    roughness: ChannelValue,
    quality: int,
    output: Path,
) -> int:

    size: tuple[int, int] = determine_size((ao, metallic, roughness))

    r: Image.Image = resolve_channel(ao, size)
    g: Image.Image = resolve_channel(metallic, size)
    b: Image.Image = resolve_channel(roughness, size)

    Image.merge("RGB", (r, g, b)).save(
        output,
        format="WEBP",
        lossless=True,
        quality=quality,
        method=6,
    )
    return 0


def main(args: argparse.Namespace) -> int:
    try:
        return pack_orm(
            ao=parse_channel(args.a, DEFAULT_AO),
            metallic=parse_channel(args.m, DEFAULT_METALLIC),
            roughness=parse_channel(args.r, DEFAULT_ROUGHNESS),
            quality=args.quality,
            output=args.output
        )
    except Exception as e:
        print(e.what)
        return -1;


if __name__ == "__main__":
    parser: argparse.ArgumentParser = argparse.ArgumentParser()

    parser.add_argument("-a", type=str, help="AO texture path OR constant value")
    parser.add_argument("-m", type=str, help="Metallic texture path OR constant value")
    parser.add_argument("-r", type=str, help="Roughness texture path OR constant value")
    parser.add_argument("-q", "--quality", type=int, help="Output image quality (80)", default=80)
    parser.add_argument("-o", "--output", required=True, type=Path)

    exit(main(parser.parse_args()))
