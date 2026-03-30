import struct
import zlib
import os

def create_png(width, height, pixels):
    def chunk(ctype, data):
        c = ctype + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    
    raw = b''
    for y in range(height):
        raw += b'\x00'  
        for x in range(width):
            idx = (y * width + x) * 4
            raw += bytes(pixels[idx:idx+4])
    
    compressed = zlib.compress(raw)
    
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    idat = chunk(b'IDAT', compressed)
    iend = chunk(b'IEND', b'')
    
    return sig + ihdr + idat + iend

def draw_icon(size):
    pixels = [0] * (size * size * 4)
    cx, cy = size / 2, size / 2
    radius = size * 0.45
    inner_r = size * 0.32
    
    for y in range(size):
        for x in range(size):
            idx = (y * size + x) * 4
            
            # Background - dark navy rounded rect (approximate with distance check)
            corner_r = size * 0.18
            # Check if inside rounded rect
            in_rect = True
            if x < corner_r and y < corner_r:
                in_rect = ((x - corner_r)**2 + (y - corner_r)**2) <= corner_r**2
            elif x > size - corner_r and y < corner_r:
                in_rect = ((x - (size - corner_r))**2 + (y - corner_r)**2) <= corner_r**2
            elif x < corner_r and y > size - corner_r:
                in_rect = ((x - corner_r)**2 + (y - (size - corner_r))**2) <= corner_r**2
            elif x > size - corner_r and y > size - corner_r:
                in_rect = ((x - (size - corner_r))**2 + (y - (size - corner_r))**2) <= corner_r**2
            
            if not in_rect:
                pixels[idx:idx+4] = [0, 0, 0, 0]  # transparent
                continue
            
            # Distance from center
            dist = ((x - cx)**2 + (y - cy)**2) ** 0.5
            
            if dist <= inner_r:
                # Inner circle - gradient blue to purple
                t = (x + y) / (size * 2)
                r = int(96 + t * 71)   # 60a5fa -> a78bfa
                g = int(165 - t * 26)
                b = int(250 - t * 0)
                pixels[idx:idx+4] = [r, g, b, 255]
            else:
                # Background
                pixels[idx:idx+4] = [17, 24, 39, 255]  # #111827
    
    return pixels

def main():
    icon_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'icons')
    os.makedirs(icon_dir, exist_ok=True)
    
    for size in [16, 48, 128]:
        pixels = draw_icon(size)
        png_data = create_png(size, size, pixels)
        path = os.path.join(icon_dir, f'icon{size}.png')
        with open(path, 'wb') as f:
            f.write(png_data)
        print(f'Created {path} ({len(png_data)} bytes)')
    
    print('Done! Icons are ready.')

if __name__ == '__main__':
    main()
