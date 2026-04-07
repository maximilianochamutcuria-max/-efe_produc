from PIL import Image, ImageDraw, ImageFont
import os

base = "images/gymna_vs_cariocas"

input_folder = f"{base}/original"
preview_folder = f"{base}/preview"
watermark_folder = f"{base}/watermarked"

os.makedirs(preview_folder, exist_ok=True)
os.makedirs(watermark_folder, exist_ok=True)

logo = Image.open("logo.png").convert("RGBA")

for file in os.listdir(input_folder):
    if file.lower().endswith((".jpg", ".jpeg", ".png")):
        img_path = os.path.join(input_folder, file)
        img = Image.open(img_path).convert("RGBA")

        # 🔹 PREVIEW (SIN MARCA)
        preview = img.copy()
        preview.thumbnail((800, 800))
        preview.convert("RGB").save(os.path.join(preview_folder, file), quality=85)

        # 🔥 WATERMARK
        watermark_layer = Image.new("RGBA", img.size)
        draw = ImageDraw.Draw(watermark_layer)

        for x in range(0, img.width, 300):
            for y in range(0, img.height, 300):

                # LOGO
                logo_resized = logo.resize((150, 150))
                watermark_layer.paste(logo_resized, (x, y), logo_resized)

                # TEXTO
                draw.text((x, y + 160), "@efe_produc", fill=(255,255,255,80))

        combined = Image.alpha_composite(img, watermark_layer)

        combined.convert("RGB").save(
            os.path.join(watermark_folder, file),
            quality=90
        )

print("✅ PREVIEW + WATERMARK generados")