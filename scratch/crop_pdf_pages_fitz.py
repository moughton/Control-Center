import os
import fitz # PyMuPDF

pdf_path = r"C:\Users\mough\OneDrive\2027\02-Domains (maintain)\Golf\RCC Greens Slopes.pdf"
out_dir = r"C:\_git\Control-Center\public\assets\greens"
os.makedirs(out_dir, exist_ok=True)

doc = fitz.open(pdf_path)
print(f"Total PDF pages: {len(doc)}")

for page_num in range(len(doc)):
  if 2 <= page_num + 1 <= 19:
    hole_num = page_num # Page 2 is Hole 1
    page = doc[page_num]

    # Full page rect: page.rect (e.g. 0, 0, width, height)
    rect = page.rect
    w = rect.width
    h = rect.height

    # Crop to left column ~ 34% width, and ~ 76% height (removing right margin & bottom table)
    crop_rect = fitz.Rect(0, 0, w * 0.35, h * 0.76)
    page.set_cropbox(crop_rect)

    pix = page.get_pixmap(dpi=200)
    img_path = os.path.join(out_dir, f"h{hole_num}.png")
    pix.save(img_path)
    print(f"Saved cropped Hole #{hole_num} green map ({pix.width}x{pix.height}) to {img_path}")

print("All green slope images cropped cleanly via PyMuPDF!")
