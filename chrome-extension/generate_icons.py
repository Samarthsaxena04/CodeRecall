
import os
import shutil

ICON_DIR = os.path.join(os.path.dirname(__file__), "icons")
os.makedirs(ICON_DIR, exist_ok=True)

# Try Pillow first
try:
    from PIL import Image
    # Try generated icon first, fallback to project logo
    sources = [
        os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "assets", "logo.png"),
    ]
    
    src = None
    for s in sources:
        if os.path.exists(s):
            src = s
            break
    
    if not src:
        print("No source image found. Please place a logo.png in the icons/ folder manually.")
        exit(1)
    
    img = Image.open(src)
    for size in [16, 48, 128]:
        resized = img.resize((size, size), Image.LANCZOS)
        out_path = os.path.join(ICON_DIR, f"icon{size}.png")
        resized.save(out_path)
        print(f"Created {out_path}")
    
    print("Done!")

except ImportError:
    print("Pillow not installed. Creating placeholder icons from logo...")
    # Just copy the logo as-is for all sizes (Chrome will scale them)
    logo = os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "assets", "logo.png")
    if os.path.exists(logo):
        for size in [16, 48, 128]:
            dest = os.path.join(ICON_DIR, f"icon{size}.png")
            shutil.copy2(logo, dest)
            print(f"Copied logo to {dest} (will be auto-scaled by Chrome)")
    else:
        print("No logo found. Please add icon16.png, icon48.png, icon128.png to the icons/ folder manually.")
