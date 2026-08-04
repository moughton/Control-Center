import os
import sys

pdf_path = r"C:\Users\mough\OneDrive\2027\02-Domains (maintain)\Golf\RCC Greens Slopes.pdf"
out_dir = r"C:\_git\Control-Center\public\assets\greens"
os.makedirs(out_dir, exist_ok=True)

try:
  import fitz # PyMuPDF
  doc = fitz.open(pdf_path)
  print(f"Total PDF pages: {len(doc)}")
  for page_num in range(len(doc)):
    page = doc[page_num]
    pix = page.get_pixmap(dpi=150)
    # Page 2 -> Hole 1, Page 3 -> Hole 2 ... Page 19 -> Hole 18
    if 2 <= page_num + 1 <= 19:
      hole_num = page_num # Page 2 is Hole 1
      img_path = os.path.join(out_dir, f"h{hole_num}.png")
      pix.save(img_path)
      print(f"Saved Hole #{hole_num} green contour map to {img_path}")
except Exception as e:
  print(f"Error extracting PDF: {e}")
