from PIL import Image, ImageDraw, ImageFont
import os

base_folder = "images"

watermark_text = "@efe_produc"

for album in os.listdir(base_folder):
    album_path = os.path.join(base_folder, album)

    if not os.path.isdir(album_path):
        continue

    original_path = os.path.join(album_path, "original")
    preview_path = os.path.join(album_path, "preview")

    os.makedirs(preview_path, exist_ok=True)

    for file in os.listdir(original_path):
        if not file.lower().endswith(".jpg"):
            continue

        img_path = os.path.join(original_path, file)
        img = Image.open(img_path).convert("RGBA")

        overlay = Image.new("RGBA", img.size, (255,255,255,0))
        draw = ImageDraw.Draw(overlay)

        width, height = img.size

        try:
            font = ImageFont.truetype("Arial.ttf", 60)
        except:
            font = ImageFont.load_default()

        # WATERMARK REPETIDO
        for x in range(0, width, 300):
            for y in range(0, height, 200):
                draw.text((x, y), watermark_text, fill=(255,255,255,80), font=font)

        final = Image.alpha_composite(img, overlay)

        # REDUCIR CALIDAD (extra protección)
        final = final.convert("RGB")
        final.thumbnail((1600,1600))

        save_path = os.path.join(preview_path, file)
        final.save(save_path, quality=70)

print("✅ Previews generados con watermark")