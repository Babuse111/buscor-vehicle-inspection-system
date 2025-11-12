# Android Image Asset Requirements for React Native/Expo

## 🎯 Android Build System Image Requirements

### **1. File Format Requirements**
- **Format:** PNG-24 (24-bit PNG with transparency)
- **Color Space:** sRGB color profile
- **Compression:** Standard PNG compression (not progressive)
- **Alpha Channel:** Optional but supported
- **Avoid:** JPEG disguised as PNG, progressive PNG, exotic color profiles

### **2. Size and Dimension Guidelines**
- **Maximum Recommended Size:** 512x512 pixels for app icons
- **Logo Assets:** 150x150 to 300x300 pixels (what we're using)
- **File Size:** Under 50KB recommended, under 100KB maximum
- **Aspect Ratio:** Square (1:1) preferred for logos
- **Pixel Density:** 72-96 DPI standard

### **3. Metadata Requirements**
```
✅ GOOD Metadata:
- Standard PNG chunks (IHDR, PLTE, IDAT, IEND)
- Basic text information
- sRGB color profile

❌ PROBLEMATIC Metadata:
- Adobe Photoshop metadata
- EXIF data from cameras
- Custom ICC color profiles
- Progressive JPEG headers in PNG
- Corrupted or non-standard chunks
```

### **4. Android Resource Naming Rules**
- **Allowed:** lowercase letters, numbers, underscores, hyphens
- **Forbidden:** uppercase letters, spaces, special characters
- **Example Good Names:** `buscor_logo.png`, `company-logo.png`, `logo.png`
- **Example Bad Names:** `Buscor Logo.png`, `logo@2x.png`, `logo (1).png`

### **5. React Native Specific Requirements**
- **Asset Resolution:** React Native auto-scales, so one size is sufficient
- **Bundle Location:** Must be in `/assets/` folder
- **Import Path:** Relative path from component: `require('../../assets/logo.png')`
- **Metro Bundler:** Must recognize the file during bundling

### **6. AAPT2 (Android Asset Packaging Tool) Specifics**
AAPT2 is very strict about:
- **Valid PNG headers**
- **Proper chunk structure**
- **No corrupted data**
- **Standard compression**
- **Valid color depth**

## 🔧 How to Create Compatible Images

### **Method 1: Using Sharp (Node.js) - What We Did**
```javascript
await sharp(inputPath)
  .resize(150, 150, { 
    fit: 'inside',
    withoutEnlargement: true
  })
  .png({
    quality: 80,           // Good quality
    compressionLevel: 9,   // Maximum compression
    progressive: false,    // Standard PNG
    palette: true         // Optimize colors
  })
  .toFile(outputPath);
```

### **Method 2: Using Online Tools**
- **TinyPNG.com** - Excellent compression
- **Squoosh.app** - Google's image optimizer
- **ImageOptim** - Mac/Windows app

### **Method 3: Photoshop/GIMP Settings**
```
File > Export > Export As
Format: PNG-24
Quality: High
Color Profile: sRGB
Metadata: None or Minimal
```

## ⚠️ Common Rejection Reasons

### **1. "AAPT: error: file failed to compile"**
**Causes:**
- JPEG saved with .png extension
- Corrupted PNG chunks
- Non-standard metadata
- Progressive PNG format

**Solution:**
- Re-save as proper PNG
- Strip all metadata
- Use standard compression

### **2. "Resource compilation failed"**
**Causes:**
- Invalid filename (uppercase, spaces)
- File too large (>100KB)
- Exotic color profiles

**Solution:**
- Rename with lowercase/underscores
- Compress image
- Convert to sRGB

### **3. Metro bundler can't find asset**
**Causes:**
- Wrong file path in require()
- File not in assets folder
- Case-sensitive path issues

**Solution:**
- Check relative path
- Ensure file is in assets/
- Use exact filename case

## 📋 Quick Validation Checklist

Before using any logo:
- [ ] File format: PNG (not JPEG-as-PNG)
- [ ] Size: Under 300x300 pixels
- [ ] File size: Under 50KB
- [ ] Filename: lowercase, no spaces
- [ ] Color space: sRGB
- [ ] Metadata: Minimal or stripped
- [ ] Test: Can be opened in image viewer

## 🛠️ Debug Commands

### Check image details:
```bash
# Node.js with Sharp
const metadata = await sharp('logo.png').metadata();
console.log(metadata);

# ImageMagick
magick identify -verbose logo.png

# File command (Linux/Mac)
file logo.png
```

### Expected output for good PNG:
```
Format: PNG
Width: 150
Height: 150
Channels: 3 or 4 (RGB or RGBA)
Depth: 8-bit
Color space: sRGB
Compression: deflate
```

## 💡 Pro Tips

1. **Start with SVG if possible** - Convert to PNG at exact size needed
2. **Use automated tools** - Let Sharp/TinyPNG handle optimization
3. **Test immediately** - Run `npx expo start` after adding image
4. **Keep backups** - Save original high-res version
5. **Batch process** - Create multiple sizes if needed for different screens

The key is that Android's AAPT2 tool is extremely picky about proper PNG format and metadata. Most rejections happen because of format issues, not the actual image content!