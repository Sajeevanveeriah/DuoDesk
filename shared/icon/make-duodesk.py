"""Original DuoDesk icon: two offset screens on one continuous desk. GPL-3.0."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent
scale = 4
im = Image.new('RGBA', (1024 * scale, 1024 * scale), (0, 0, 0, 0))
d = ImageDraw.Draw(im)
def rr(box, radius, fill, outline=None, width=1):
    d.rounded_rectangle(tuple(int(v * scale) for v in box), radius=int(radius * scale), fill=fill, outline=outline, width=width * scale)
rr((30, 30, 994, 994), 215, '#111827')
rr((180, 230, 615, 665), 85, '#202e44', '#bdcde6', 24)
rr((407, 365, 842, 800), 85, '#172338', '#88a9c7', 24)
d.line([(248*scale, 836*scale),(776*scale, 836*scale)], fill='#bdcde6', width=20*scale)
im = im.resize((1024, 1024), Image.Resampling.LANCZOS)
im.save(root/'duodesk.png')
im.save(root/'duodesk.ico', sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
im.save(root/'duodesk.icns')
for size in (16,32,48,64,128,256,512):
    im.resize((size,size),Image.Resampling.LANCZOS).save(root/f'duodesk-{size}.png')
print('Generated original DuoDesk PNG, ICO and ICNS assets.')
