import os
from PIL import Image

greens_dir = r"C:\_git\Control-Center\public\assets\greens"

for hole_num in range(1, 19):
  img_path = os.path.join(greens_dir, f"h{hole_num}.png")
  if not os.path.exists(img_path):
    continue

  img = Image.open(img_path)
  width, height = img.size

  # The green diagram is located on the left ~ 34% of the image (0 to int(width * 0.35))
  # And height is ~ 80% from top (excluding the bottom Rounds table)
  left = 0
  top = 0
  right = int(width * 0.35)
  bottom = int(height * 0.76) # Crop out bottom table

  cropped = img.crop((left, top, right, bottom))
  cropped.save(img_path)
  print(f"Cropped Hole #{hole_num} image from ({width}x{height}) to ({cropped.size[0]}x{cropped.size[1]})")

print("All green slope images cropped successfully!")
