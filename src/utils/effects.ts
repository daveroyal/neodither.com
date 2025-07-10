// Image processing effects using Canvas API

export const applyVHSEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const scanlines = params.scanlines || 30;
      const noise = params.noise || 20;
      const colorShift = params.colorShift || 10;

      // Apply VHS effects
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;

          // Scanlines effect
          if (y % 2 === 0 && Math.random() < scanlines / 100) {
            data[idx] = data[idx] * 0.8;
            data[idx + 1] = data[idx + 1] * 0.8;
            data[idx + 2] = data[idx + 2] * 0.8;
          }

          // Noise effect
          if (Math.random() < noise / 100) {
            const noiseValue = Math.random() * 50 - 25;
            data[idx] = Math.max(0, Math.min(255, data[idx] + noiseValue));
            data[idx + 1] = Math.max(
              0,
              Math.min(255, data[idx + 1] + noiseValue)
            );
            data[idx + 2] = Math.max(
              0,
              Math.min(255, data[idx + 2] + noiseValue)
            );
          }

          // Color shift effect
          if (x > colorShift) {
            const shiftIdx = (y * canvas.width + (x - colorShift)) * 4;
            data[idx] = data[shiftIdx];
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applyGlitchEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const intensity = params.intensity || 50;
      const frequency = params.frequency || 30;
      const rgbShift = params.rgbShift || 15;

      // Apply glitch effects
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;

          // Random glitch lines
          if (Math.random() < frequency / 1000) {
            const glitchLength =
              Math.floor((Math.random() * intensity) / 10) + 1;
            const glitchOffset =
              Math.floor(Math.random() * rgbShift) - rgbShift / 2;

            for (let i = 0; i < glitchLength && x + i < canvas.width; i++) {
              const targetIdx = (y * canvas.width + (x + i)) * 4;
              const sourceIdx = (y * canvas.width + (x + i + glitchOffset)) * 4;

              if (sourceIdx >= 0 && sourceIdx < data.length) {
                data[targetIdx] = data[sourceIdx];
                data[targetIdx + 1] = data[sourceIdx + 1];
                data[targetIdx + 2] = data[sourceIdx + 2];
              }
            }
          }

          // RGB channel separation
          if (Math.random() < intensity / 1000) {
            const rShift = Math.floor(Math.random() * rgbShift) - rgbShift / 2;
            const gShift = Math.floor(Math.random() * rgbShift) - rgbShift / 2;
            const bShift = Math.floor(Math.random() * rgbShift) - rgbShift / 2;

            const rIdx =
              (y * canvas.width +
                Math.max(0, Math.min(canvas.width - 1, x + rShift))) *
              4;
            const gIdx =
              (y * canvas.width +
                Math.max(0, Math.min(canvas.width - 1, x + gShift))) *
              4;
            const bIdx =
              (y * canvas.width +
                Math.max(0, Math.min(canvas.width - 1, x + bShift))) *
              4;

            data[idx] = data[rIdx];
            data[idx + 1] = data[gIdx + 1];
            data[idx + 2] = data[bIdx + 2];
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applyLofiEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const saturation = params.saturation || 60;
      const contrast = params.contrast || 40;
      const grain = params.grain || 25;

      // Apply lo-fi effects
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Convert to grayscale for saturation effect
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Apply saturation
        const saturationFactor = saturation / 100;
        data[i] = r * (1 - saturationFactor) + gray * saturationFactor;
        data[i + 1] = g * (1 - saturationFactor) + gray * saturationFactor;
        data[i + 2] = b * (1 - saturationFactor) + gray * saturationFactor;

        // Apply contrast
        const contrastFactor = (contrast / 100) * 2;
        data[i] = Math.max(
          0,
          Math.min(255, (data[i] - 128) * contrastFactor + 128)
        );
        data[i + 1] = Math.max(
          0,
          Math.min(255, (data[i + 1] - 128) * contrastFactor + 128)
        );
        data[i + 2] = Math.max(
          0,
          Math.min(255, (data[i + 2] - 128) * contrastFactor + 128)
        );

        // Add grain
        if (Math.random() < grain / 100) {
          const grainValue = (Math.random() - 0.5) * 30;
          data[i] = Math.max(0, Math.min(255, data[i] + grainValue));
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grainValue));
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grainValue));
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applyCyberpunkEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const neon = params.neon || 70;
      const contrast = params.contrast || 80;
      const colorTemp = params.colorTemp || 60;

      // Apply cyberpunk effects
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Boost contrast
        const contrastFactor = (contrast / 100) * 2;
        data[i] = Math.max(0, Math.min(255, (r - 128) * contrastFactor + 128));
        data[i + 1] = Math.max(
          0,
          Math.min(255, (g - 128) * contrastFactor + 128)
        );
        data[i + 2] = Math.max(
          0,
          Math.min(255, (b - 128) * contrastFactor + 128)
        );

        // Add neon glow to bright areas
        const brightness = (r + g + b) / 3;
        if (brightness > 150) {
          const neonFactor = neon / 100;
          data[i] = Math.min(255, r + (255 - r) * neonFactor);
          data[i + 1] = Math.min(255, g + (255 - g) * neonFactor);
          data[i + 2] = Math.min(255, b + (255 - b) * neonFactor);
        }

        // Color temperature adjustment (more blue/cyan)
        const tempFactor = colorTemp / 100;
        data[i] = data[i] * (1 - tempFactor * 0.3);
        data[i + 1] = data[i + 1] * (1 - tempFactor * 0.1);
        data[i + 2] = data[i + 2] * (1 + tempFactor * 0.2);
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applyAOL90sEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const pixelation = params.pixelation || 40;
      const colors = params.colors || 50;
      const dither = params.dither || 30;

      // Apply 90s AOL effects
      const pixelSize = Math.max(1, Math.floor(pixelation / 10));

      for (let y = 0; y < canvas.height; y += pixelSize) {
        for (let x = 0; x < canvas.width; x += pixelSize) {
          const idx = (y * canvas.width + x) * 4;

          // Get average color for this pixel block
          let r = 0,
            g = 0,
            b = 0,
            count = 0;

          for (let py = 0; py < pixelSize && y + py < canvas.height; py++) {
            for (let px = 0; px < pixelSize && x + px < canvas.width; px++) {
              const blockIdx = ((y + py) * canvas.width + (x + px)) * 4;
              r += data[blockIdx];
              g += data[blockIdx + 1];
              b += data[blockIdx + 2];
              count++;
            }
          }

          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);

          // Reduce color depth
          const colorLevels = Math.floor(colors / 10) + 2;
          r = Math.floor(r / (256 / colorLevels)) * (256 / colorLevels);
          g = Math.floor(g / (256 / colorLevels)) * (256 / colorLevels);
          b = Math.floor(b / (256 / colorLevels)) * (256 / colorLevels);

          // Apply dithering
          if (Math.random() < dither / 100) {
            const ditherValue = (Math.random() - 0.5) * 50;
            r = Math.max(0, Math.min(255, r + ditherValue));
            g = Math.max(0, Math.min(255, g + ditherValue));
            b = Math.max(0, Math.min(255, b + ditherValue));
          }

          // Apply the color to the entire pixel block
          for (let py = 0; py < pixelSize && y + py < canvas.height; py++) {
            for (let px = 0; px < pixelSize && x + px < canvas.width; px++) {
              const blockIdx = ((y + py) * canvas.width + (x + px)) * 4;
              data[blockIdx] = r;
              data[blockIdx + 1] = g;
              data[blockIdx + 2] = b;
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applyFilmGrainEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const intensity = params.intensity || 50;
      const size = params.size || 3;
      const opacity = params.opacity || 60;

      // Apply film grain
      for (let y = 0; y < canvas.height; y += size) {
        for (let x = 0; x < canvas.width; x += size) {
          const grainValue = (Math.random() - 0.5) * intensity;

          for (let py = 0; py < size && y + py < canvas.height; py++) {
            for (let px = 0; px < size && x + px < canvas.width; px++) {
              const idx = ((y + py) * canvas.width + (x + px)) * 4;
              const alpha = opacity / 100;

              data[idx] = Math.max(
                0,
                Math.min(255, data[idx] + grainValue * alpha)
              );
              data[idx + 1] = Math.max(
                0,
                Math.min(255, data[idx + 1] + grainValue * alpha)
              );
              data[idx + 2] = Math.max(
                0,
                Math.min(255, data[idx + 2] + grainValue * alpha)
              );
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applySepiaEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const intensity = params.intensity || 80;
      const warmth = params.warmth || 70;
      const contrast = params.contrast || 110;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Sepia formula
        const sepiaR = r * 0.393 + g * 0.769 + b * 0.189;
        const sepiaG = r * 0.349 + g * 0.686 + b * 0.168;
        const sepiaB = r * 0.272 + g * 0.534 + b * 0.131;

        // Apply intensity
        const alpha = intensity / 100;
        data[i] = Math.min(255, r * (1 - alpha) + sepiaR * alpha);
        data[i + 1] = Math.min(255, g * (1 - alpha) + sepiaG * alpha);
        data[i + 2] = Math.min(255, b * (1 - alpha) + sepiaB * alpha);

        // Add warmth
        const warmthFactor = warmth / 100;
        data[i] = Math.min(255, data[i] * (1 + warmthFactor * 0.2));
        data[i + 1] = Math.min(255, data[i + 1] * (1 + warmthFactor * 0.1));

        // Apply contrast
        const contrastFactor = contrast / 100;
        data[i] = Math.max(
          0,
          Math.min(255, (data[i] - 128) * contrastFactor + 128)
        );
        data[i + 1] = Math.max(
          0,
          Math.min(255, (data[i + 1] - 128) * contrastFactor + 128)
        );
        data[i + 2] = Math.max(
          0,
          Math.min(255, (data[i + 2] - 128) * contrastFactor + 128)
        );
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applyVintageEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const fade = params.fade || 40;
      const grain = params.grain || 30;
      const vignette = params.vignette || 50;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;

          // Apply fade
          const fadeFactor = fade / 100;
          data[idx] = data[idx] * (1 - fadeFactor) + 255 * fadeFactor;
          data[idx + 1] = data[idx + 1] * (1 - fadeFactor) + 255 * fadeFactor;
          data[idx + 2] = data[idx + 2] * (1 - fadeFactor) + 255 * fadeFactor;

          // Add grain
          if (Math.random() < grain / 100) {
            const grainValue = (Math.random() - 0.5) * 40;
            data[idx] = Math.max(0, Math.min(255, data[idx] + grainValue));
            data[idx + 1] = Math.max(
              0,
              Math.min(255, data[idx + 1] + grainValue)
            );
            data[idx + 2] = Math.max(
              0,
              Math.min(255, data[idx + 2] + grainValue)
            );
          }

          // Apply vignette
          const distance = Math.sqrt(
            (x - centerX) * (x - centerX) + (y - centerY) * (y - centerY)
          );
          const vignetteFactor = Math.max(
            0,
            1 - (distance / maxDistance) * (vignette / 100)
          );
          data[idx] = data[idx] * vignetteFactor;
          data[idx + 1] = data[idx + 1] * vignetteFactor;
          data[idx + 2] = data[idx + 2] * vignetteFactor;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applyNeonEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const glow = params.glow || 80;
      const saturation = params.saturation || 200;
      const brightness = params.brightness || 120;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Convert to HSL for saturation boost
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const lightness = (max + min) / 2;

        // Boost saturation
        const saturationFactor = saturation / 100;
        const enhancedR = r + (r - lightness) * (saturationFactor - 1);
        const enhancedG = g + (g - lightness) * (saturationFactor - 1);
        const enhancedB = b + (b - lightness) * (saturationFactor - 1);

        // Apply brightness
        const brightnessFactor = brightness / 100;
        data[i] = Math.min(255, enhancedR * brightnessFactor);
        data[i + 1] = Math.min(255, enhancedG * brightnessFactor);
        data[i + 2] = Math.min(255, enhancedB * brightnessFactor);

        // Add glow to bright areas
        const avgBrightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (avgBrightness > 100) {
          const glowFactor = (glow / 100) * (avgBrightness / 255);
          data[i] = Math.min(255, data[i] + glowFactor * 50);
          data[i + 1] = Math.min(255, data[i + 1] + glowFactor * 50);
          data[i + 2] = Math.min(255, data[i + 2] + glowFactor * 50);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applyColorPopEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const intensity = params.intensity || 60;
      const saturation = params.saturation || 180;
      const contrast = params.contrast || 115;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Find the dominant color channel
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturationLevel = max - min;

        // Boost colors that are already saturated
        if (saturationLevel > 50) {
          const saturationFactor = saturation / 100;
          const average = (r + g + b) / 3;

          data[i] = Math.min(
            255,
            r + (r - average) * (saturationFactor - 1) * (intensity / 100)
          );
          data[i + 1] = Math.min(
            255,
            g + (g - average) * (saturationFactor - 1) * (intensity / 100)
          );
          data[i + 2] = Math.min(
            255,
            b + (b - average) * (saturationFactor - 1) * (intensity / 100)
          );
        }

        // Apply contrast
        const contrastFactor = contrast / 100;
        data[i] = Math.max(
          0,
          Math.min(255, (data[i] - 128) * contrastFactor + 128)
        );
        data[i + 1] = Math.max(
          0,
          Math.min(255, (data[i + 1] - 128) * contrastFactor + 128)
        );
        data[i + 2] = Math.max(
          0,
          Math.min(255, (data[i + 2] - 128) * contrastFactor + 128)
        );
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applyBlackWhiteEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const contrast = params.contrast || 110;
      const brightness = params.brightness || 100;
      const grain = params.grain || 15;

      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale
        const gray =
          0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

        // Apply brightness
        let brightGray = gray * (brightness / 100);

        // Apply contrast
        brightGray = (brightGray - 128) * (contrast / 100) + 128;

        // Add grain
        if (Math.random() < grain / 100) {
          const grainValue = (Math.random() - 0.5) * 20;
          brightGray += grainValue;
        }

        brightGray = Math.max(0, Math.min(255, brightGray));

        data[i] = brightGray;
        data[i + 1] = brightGray;
        data[i + 2] = brightGray;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applyBlurEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      const radius = params.radius || 5;
      const opacity = params.opacity || 100;

      // Apply CSS blur filter for better performance
      ctx.filter = `blur(${radius}px)`;
      ctx.globalAlpha = opacity / 100;
      ctx.drawImage(img, 0, 0);

      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applySharpenEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const originalData = new Uint8ClampedArray(data);

      const amount = params.amount || 100;
      const threshold = params.threshold || 10;

      // Simple sharpen kernel
      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
          const idx = (y * canvas.width + x) * 4;

          for (let c = 0; c < 3; c++) {
            const current = originalData[idx + c];
            const top = originalData[((y - 1) * canvas.width + x) * 4 + c];
            const bottom = originalData[((y + 1) * canvas.width + x) * 4 + c];
            const left = originalData[(y * canvas.width + (x - 1)) * 4 + c];
            const right = originalData[(y * canvas.width + (x + 1)) * 4 + c];

            const edge = current * 5 - top - bottom - left - right;
            const enhanced = current + (edge * amount) / 100;

            if (Math.abs(edge) > threshold) {
              data[idx + c] = Math.max(0, Math.min(255, enhanced));
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applyInfraredEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const intensity = params.intensity || 70;
      const redChannel = params.redChannel || 150;
      const contrast = params.contrast || 120;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Create false color infrared effect
        const infraredR = Math.min(255, g * (redChannel / 100));
        const infraredG = Math.min(255, r * 0.8);
        const infraredB = Math.min(255, b * 0.3);

        // Apply intensity
        const intensityFactor = intensity / 100;
        data[i] = r * (1 - intensityFactor) + infraredR * intensityFactor;
        data[i + 1] = g * (1 - intensityFactor) + infraredG * intensityFactor;
        data[i + 2] = b * (1 - intensityFactor) + infraredB * intensityFactor;

        // Apply contrast
        const contrastFactor = contrast / 100;
        data[i] = Math.max(
          0,
          Math.min(255, (data[i] - 128) * contrastFactor + 128)
        );
        data[i + 1] = Math.max(
          0,
          Math.min(255, (data[i + 1] - 128) * contrastFactor + 128)
        );
        data[i + 2] = Math.max(
          0,
          Math.min(255, (data[i + 2] - 128) * contrastFactor + 128)
        );
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applyThermalEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const intensity = params.intensity || 80;
      const colorRange = params.colorRange || 60;
      const contrast = params.contrast || 140;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Convert to thermal map based on brightness
        const brightness = (r + g + b) / 3;
        const normalized = brightness / 255;

        // Create thermal color mapping
        let thermalR, thermalG, thermalB;

        if (normalized < 0.25) {
          thermalR = 0;
          thermalG = 0;
          thermalB = Math.floor(normalized * 4 * 255);
        } else if (normalized < 0.5) {
          thermalR = 0;
          thermalG = Math.floor((normalized - 0.25) * 4 * 255);
          thermalB = 255;
        } else if (normalized < 0.75) {
          thermalR = Math.floor((normalized - 0.5) * 4 * 255);
          thermalG = 255;
          thermalB = 255 - Math.floor((normalized - 0.5) * 4 * 255);
        } else {
          thermalR = 255;
          thermalG = 255 - Math.floor((normalized - 0.75) * 4 * 256);
          thermalB = 0;
        }

        // Apply intensity
        const intensityFactor = intensity / 100;
        data[i] = r * (1 - intensityFactor) + thermalR * intensityFactor;
        data[i + 1] = g * (1 - intensityFactor) + thermalG * intensityFactor;
        data[i + 2] = b * (1 - intensityFactor) + thermalB * intensityFactor;

        // Apply contrast
        const contrastFactor = contrast / 100;
        data[i] = Math.max(
          0,
          Math.min(255, (data[i] - 128) * contrastFactor + 128)
        );
        data[i + 1] = Math.max(
          0,
          Math.min(255, (data[i + 1] - 128) * contrastFactor + 128)
        );
        data[i + 2] = Math.max(
          0,
          Math.min(255, (data[i + 2] - 128) * contrastFactor + 128)
        );
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applyPolaroidEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const fade = params.fade || 40;
      const warmth = params.warmth || 60;
      const vignette = params.vignette || 70;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;

          // Apply warmth (yellow tint)
          const warmthFactor = warmth / 100;
          data[idx] = Math.min(255, data[idx] + warmthFactor * 20);
          data[idx + 1] = Math.min(255, data[idx + 1] + warmthFactor * 15);
          data[idx + 2] = Math.max(0, data[idx + 2] - warmthFactor * 10);

          // Apply fade
          const fadeFactor = fade / 100;
          data[idx] = data[idx] * (1 - fadeFactor) + 255 * fadeFactor * 0.95;
          data[idx + 1] =
            data[idx + 1] * (1 - fadeFactor) + 255 * fadeFactor * 0.95;
          data[idx + 2] =
            data[idx + 2] * (1 - fadeFactor) + 255 * fadeFactor * 0.9;

          // Apply vignette
          const distance = Math.sqrt(
            (x - centerX) * (x - centerX) + (y - centerY) * (y - centerY)
          );
          const vignetteFactor = Math.max(
            0,
            1 - (distance / maxDistance) * (vignette / 100)
          );
          data[idx] = data[idx] * vignetteFactor;
          data[idx + 1] = data[idx + 1] * vignetteFactor;
          data[idx + 2] = data[idx + 2] * vignetteFactor;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applyCrossProcessEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const highlights = params.highlights || 120;
      const shadows = params.shadows || 80;
      const saturation = params.saturation || 160;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const brightness = (r + g + b) / 3;

        // Cross-process color shifts
        if (brightness > 128) {
          // Highlights - boost blues and cyans
          data[i] = Math.max(0, Math.min(255, r * (highlights / 100) * 0.9));
          data[i + 1] = Math.max(
            0,
            Math.min(255, g * (highlights / 100) * 1.1)
          );
          data[i + 2] = Math.max(
            0,
            Math.min(255, b * (highlights / 100) * 1.2)
          );
        } else {
          // Shadows - boost greens and magentas
          data[i] = Math.max(0, Math.min(255, r * (shadows / 100) * 1.1));
          data[i + 1] = Math.max(0, Math.min(255, g * (shadows / 100) * 1.2));
          data[i + 2] = Math.max(0, Math.min(255, b * (shadows / 100) * 0.8));
        }

        // Boost saturation
        const gray =
          0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const saturationFactor = saturation / 100;
        data[i] = gray + (data[i] - gray) * saturationFactor;
        data[i + 1] = gray + (data[i + 1] - gray) * saturationFactor;
        data[i + 2] = gray + (data[i + 2] - gray) * saturationFactor;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applyEmbossEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const originalData = new Uint8ClampedArray(data);

      const strength = params.strength || 50;
      const depth = params.depth || 3;

      // Emboss kernel
      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
          const idx = (y * canvas.width + x) * 4;

          for (let c = 0; c < 3; c++) {
            const topLeft =
              originalData[((y - 1) * canvas.width + (x - 1)) * 4 + c];
            const bottomRight =
              originalData[((y + 1) * canvas.width + (x + 1)) * 4 + c];

            const embossed = (bottomRight - topLeft + 128) * (strength / 100);
            data[idx + c] = Math.max(0, Math.min(255, embossed));
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applyEdgeDetectEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const originalData = new Uint8ClampedArray(data);

      const threshold = params.threshold || 30;
      const invert = params.invert || 0;

      // Edge detection using Sobel operator
      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
          const idx = (y * canvas.width + x) * 4;

          // Calculate gradients for each color channel
          let maxGradient = 0;

          for (let c = 0; c < 3; c++) {
            const tl = originalData[((y - 1) * canvas.width + (x - 1)) * 4 + c];
            const tm = originalData[((y - 1) * canvas.width + x) * 4 + c];
            const tr = originalData[((y - 1) * canvas.width + (x + 1)) * 4 + c];
            const ml = originalData[(y * canvas.width + (x - 1)) * 4 + c];
            const mr = originalData[(y * canvas.width + (x + 1)) * 4 + c];
            const bl = originalData[((y + 1) * canvas.width + (x - 1)) * 4 + c];
            const bm = originalData[((y + 1) * canvas.width + x) * 4 + c];
            const br = originalData[((y + 1) * canvas.width + (x + 1)) * 4 + c];

            const gx = -tl + tr - 2 * ml + 2 * mr - bl + br;
            const gy = -tl - 2 * tm - tr + bl + 2 * bm + br;
            const gradient = Math.sqrt(gx * gx + gy * gy);

            maxGradient = Math.max(maxGradient, gradient);
          }

          const edge = maxGradient > threshold ? 255 : 0;
          const finalEdge = invert ? 255 - edge : edge;

          data[idx] = finalEdge;
          data[idx + 1] = finalEdge;
          data[idx + 2] = finalEdge;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applyNESEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const pixelation = params.pixelation || 4;
      const colorDepth = params.colorDepth || 8;
      const contrast = params.contrast || 120;

      // NES color palette (simplified)
      const nesColors = [
        [124, 124, 124],
        [0, 0, 252],
        [0, 0, 188],
        [68, 40, 188],
        [148, 0, 132],
        [168, 0, 32],
        [168, 16, 0],
        [136, 20, 0],
        [80, 48, 0],
        [0, 120, 0],
        [0, 104, 0],
        [0, 88, 0],
        [0, 64, 88],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
        [188, 188, 188],
        [0, 120, 248],
        [0, 88, 248],
        [104, 68, 252],
        [216, 0, 204],
        [228, 0, 88],
        [248, 56, 0],
        [228, 92, 16],
        [172, 124, 0],
        [0, 184, 0],
        [0, 168, 0],
        [0, 168, 68],
        [0, 136, 136],
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];

      // Pixelation effect
      const pixelSize = Math.max(1, pixelation);
      for (let y = 0; y < canvas.height; y += pixelSize) {
        for (let x = 0; x < canvas.width; x += pixelSize) {
          let r = 0,
            g = 0,
            b = 0,
            count = 0;

          // Sample the block
          for (let py = 0; py < pixelSize && y + py < canvas.height; py++) {
            for (let px = 0; px < pixelSize && x + px < canvas.width; px++) {
              const idx = ((y + py) * canvas.width + (x + px)) * 4;
              r += data[idx];
              g += data[idx + 1];
              b += data[idx + 2];
              count++;
            }
          }

          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);

          // Find closest NES color
          let closestColor = nesColors[0];
          let minDistance = Infinity;

          for (const color of nesColors) {
            const distance = Math.sqrt(
              Math.pow(r - color[0], 2) +
                Math.pow(g - color[1], 2) +
                Math.pow(b - color[2], 2)
            );
            if (distance < minDistance) {
              minDistance = distance;
              closestColor = color;
            }
          }

          // Apply the color to the entire block
          for (let py = 0; py < pixelSize && y + py < canvas.height; py++) {
            for (let px = 0; px < pixelSize && x + px < canvas.width; px++) {
              const idx = ((y + py) * canvas.width + (x + px)) * 4;
              data[idx] = closestColor[0];
              data[idx + 1] = closestColor[1];
              data[idx + 2] = closestColor[2];
            }
          }
        }
      }

      // Apply contrast
      const contrastFactor = contrast / 100;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.max(
          0,
          Math.min(255, (data[i] - 128) * contrastFactor + 128)
        );
        data[i + 1] = Math.max(
          0,
          Math.min(255, (data[i + 1] - 128) * contrastFactor + 128)
        );
        data[i + 2] = Math.max(
          0,
          Math.min(255, (data[i + 2] - 128) * contrastFactor + 128)
        );
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applySegaGenesisEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const saturation = params.saturation || 140;
      const dithering = params.dithering || 25;
      const colorDepth = params.colorDepth || 512;

      // Apply saturation boost (Genesis was known for vibrant colors)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const saturationFactor = saturation / 100;

        data[i] = Math.min(255, gray + (r - gray) * saturationFactor);
        data[i + 1] = Math.min(255, gray + (g - gray) * saturationFactor);
        data[i + 2] = Math.min(255, gray + (b - gray) * saturationFactor);

        // Reduce color depth (Genesis had 512 colors but limited on-screen)
        const levels = Math.max(8, colorDepth / 64);
        data[i] = Math.floor(data[i] / (256 / levels)) * (256 / levels);
        data[i + 1] = Math.floor(data[i + 1] / (256 / levels)) * (256 / levels);
        data[i + 2] = Math.floor(data[i + 2] / (256 / levels)) * (256 / levels);

        // Add dithering
        if (Math.random() < dithering / 100) {
          const ditherValue = (Math.random() - 0.5) * 16;
          data[i] = Math.max(0, Math.min(255, data[i] + ditherValue));
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + ditherValue));
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + ditherValue));
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applySNESEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const softness = params.softness || 40;
      const colorBoost = params.colorBoost || 115;
      const brightness = params.brightness || 110;

      // Simple 16-bit color reduction
      const reduce16Bit = (value: number) => {
        // Reduce to 16-bit style color depth
        return Math.floor(value / 16) * 16;
      };

      // Process each pixel
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Apply brightness
        const brightnessFactor = brightness / 100;
        r *= brightnessFactor;
        g *= brightnessFactor;
        b *= brightnessFactor;

        // Enhance colors (SNES had vibrant colors)
        const saturationFactor = colorBoost / 100;
        const gray = r * 0.299 + g * 0.587 + b * 0.114;
        r = gray + (r - gray) * saturationFactor;
        g = gray + (g - gray) * saturationFactor;
        b = gray + (b - gray) * saturationFactor;

        // Apply 16-bit color reduction
        data[i] = Math.min(255, Math.max(0, reduce16Bit(r)));
        data[i + 1] = Math.min(255, Math.max(0, reduce16Bit(g)));
        data[i + 2] = Math.min(255, Math.max(0, reduce16Bit(b)));
      }

      ctx.putImageData(imageData, 0, 0);

      // Apply slight blur for SNES smoothness
      if (softness > 0) {
        const blurAmount = softness / 25;
        ctx.filter = `blur(${blurAmount}px)`;
        ctx.globalAlpha = 0.5;
        ctx.drawImage(canvas, 0, 0);
        ctx.filter = "none";
        ctx.globalAlpha = 1;
      }

      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applySegaCDEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const compression = params.compression || 30;
      const fmvLook = params.fmvLook || 40;
      const colorBanding = params.colorBanding || 20;

      // Simulate CD compression artifacts
      for (let y = 0; y < canvas.height; y += 2) {
        for (let x = 0; x < canvas.width; x += 2) {
          const idx = (y * canvas.width + x) * 4;

          // Compression blocks
          if (Math.random() < compression / 100) {
            const blockValue = Math.floor(Math.random() * 32) - 16;
            for (let by = 0; by < 2 && y + by < canvas.height; by++) {
              for (let bx = 0; bx < 2 && x + bx < canvas.width; bx++) {
                const blockIdx = ((y + by) * canvas.width + (x + bx)) * 4;
                data[blockIdx] = Math.max(
                  0,
                  Math.min(255, data[blockIdx] + blockValue)
                );
                data[blockIdx + 1] = Math.max(
                  0,
                  Math.min(255, data[blockIdx + 1] + blockValue)
                );
                data[blockIdx + 2] = Math.max(
                  0,
                  Math.min(255, data[blockIdx + 2] + blockValue)
                );
              }
            }
          }
        }
      }

      // FMV-style color processing
      for (let i = 0; i < data.length; i += 4) {
        // Slight color banding
        const bands = Math.max(4, 32 - colorBanding);
        data[i] = Math.floor(data[i] / (256 / bands)) * (256 / bands);
        data[i + 1] = Math.floor(data[i + 1] / (256 / bands)) * (256 / bands);
        data[i + 2] = Math.floor(data[i + 2] / (256 / bands)) * (256 / bands);

        // FMV processing look
        const fmvFactor = fmvLook / 100;
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i] * (1 - fmvFactor * 0.2) + avg * fmvFactor * 0.2;
        data[i + 1] =
          data[i + 1] * (1 - fmvFactor * 0.1) + avg * fmvFactor * 0.1;
        data[i + 2] =
          data[i + 2] * (1 - fmvFactor * 0.15) + avg * fmvFactor * 0.15;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applyShadowrunEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const crtGlow = params.crtGlow || 70;
      const matrixTint = params.matrixTint || 60;
      const scanlines = params.scanlines || 40;

      // Apply cyberpunk color grading
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Dark, moody atmosphere
        data[i] = r * 0.7; // Reduce red
        data[i + 1] = g * 1.2; // Boost green (matrix style)
        data[i + 2] = b * 0.8; // Slightly reduce blue

        // Matrix green tint
        const tintFactor = matrixTint / 100;
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = data[i] * (1 - tintFactor) + brightness * 0.3 * tintFactor;
        data[i + 1] =
          data[i + 1] * (1 - tintFactor) + brightness * 1.4 * tintFactor;
        data[i + 2] =
          data[i + 2] * (1 - tintFactor) + brightness * 0.1 * tintFactor;

        // CRT glow effect on bright areas
        if (brightness > 100) {
          const glowFactor = crtGlow / 100;
          data[i + 1] = Math.min(255, data[i + 1] + glowFactor * 30); // Green glow
        }
      }

      // Add scanlines for CRT monitor effect
      for (let y = 0; y < canvas.height; y++) {
        if (y % 3 === 0 && Math.random() < scanlines / 100) {
          for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;
            data[idx] = data[idx] * 0.8;
            data[idx + 1] = data[idx + 1] * 0.9;
            data[idx + 2] = data[idx + 2] * 0.7;
          }
        }
      }

      // Add slight noise for that gritty cyberpunk feel
      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < 0.02) {
          const noise = (Math.random() - 0.5) * 20;
          data[i] = Math.max(0, Math.min(255, data[i] + noise));
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applyColorEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Parse color from hex string (e.g., "#ff0000")
      const color = params.color || "#ff0000";
      const opacity = params.opacity || 50;
      const blendMode = params.blendMode || 0;

      // Convert hex to RGB
      const hex = color.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);

      const opacityFactor = opacity / 100;

      // Create a colored overlay
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = color;
      ctx.globalAlpha = opacityFactor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Apply blend mode
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const originalR = data[i];
        const originalG = data[i + 1];
        const originalB = data[i + 2];

        let newR, newG, newB;

        switch (blendMode) {
          case 0: // Normal
            newR = r;
            newG = g;
            newB = b;
            break;
          case 1: // Multiply
            newR = (originalR * r) / 255;
            newG = (originalG * g) / 255;
            newB = (originalB * b) / 255;
            break;
          case 2: // Screen
            newR = 255 - ((255 - originalR) * (255 - r)) / 255;
            newG = 255 - ((255 - originalG) * (255 - g)) / 255;
            newB = 255 - ((255 - originalB) * (255 - b)) / 255;
            break;
          case 3: // Overlay
            newR =
              originalR < 128
                ? (2 * originalR * r) / 255
                : 255 - (2 * (255 - originalR) * (255 - r)) / 255;
            newG =
              originalG < 128
                ? (2 * originalG * g) / 255
                : 255 - (2 * (255 - originalG) * (255 - g)) / 255;
            newB =
              originalB < 128
                ? (2 * originalB * b) / 255
                : 255 - (2 * (255 - originalB) * (255 - b)) / 255;
            break;
          case 4: // Soft Light
            newR =
              r < 128
                ? originalR -
                  ((255 - 2 * r) * originalR * (255 - originalR)) / 65025
                : originalR +
                  ((2 * r - 255) * originalR * (255 - originalR)) / 65025;
            newG =
              g < 128
                ? originalG -
                  ((255 - 2 * g) * originalG * (255 - originalG)) / 65025
                : originalG +
                  ((2 * g - 255) * originalG * (255 - originalG)) / 65025;
            newB =
              b < 128
                ? originalB -
                  ((255 - 2 * b) * originalB * (255 - originalB)) / 65025
                : originalB +
                  ((2 * b - 255) * originalB * (255 - originalB)) / 65025;
            break;
          case 5: // Hard Light
            newR =
              r < 128
                ? (2 * originalR * r) / 255
                : 255 - (2 * (255 - originalR) * (255 - r)) / 255;
            newG =
              g < 128
                ? (2 * originalG * g) / 255
                : 255 - (2 * (255 - originalG) * (255 - g)) / 255;
            newB =
              b < 128
                ? (2 * originalB * b) / 255
                : 255 - (2 * (255 - originalB) * (255 - b)) / 255;
            break;
          case 6: // Color Dodge
            newR =
              originalR === 0
                ? 0
                : Math.min(255, (originalR * 255) / (255 - r));
            newG =
              originalG === 0
                ? 0
                : Math.min(255, (originalG * 255) / (255 - g));
            newB =
              originalB === 0
                ? 0
                : Math.min(255, (originalB * 255) / (255 - b));
            break;
          case 7: // Color Burn
            newR =
              originalR === 255
                ? 255
                : Math.max(0, 255 - ((255 - originalR) * 255) / r);
            newG =
              originalG === 255
                ? 255
                : Math.max(0, 255 - ((255 - originalG) * 255) / g);
            newB =
              originalB === 255
                ? 255
                : Math.max(0, 255 - ((255 - originalB) * 255) / b);
            break;
          case 8: // Darken
            newR = Math.min(originalR, r);
            newG = Math.min(originalG, g);
            newB = Math.min(originalB, b);
            break;
          case 9: // Lighten
            newR = Math.max(originalR, r);
            newG = Math.max(originalG, g);
            newB = Math.max(originalB, b);
            break;
          case 10: // Difference
            newR = Math.abs(originalR - r);
            newG = Math.abs(originalG - g);
            newB = Math.abs(originalB - b);
            break;
          case 11: // Exclusion
            newR = originalR + r - (2 * originalR * r) / 255;
            newG = originalG + g - (2 * originalG * g) / 255;
            newB = originalB + b - (2 * originalB * b) / 255;
            break;
          default:
            newR = originalR;
            newG = originalG;
            newB = originalB;
        }

        // Apply opacity blending
        data[i] = Math.round(
          originalR * (1 - opacityFactor) + newR * opacityFactor
        );
        data[i + 1] = Math.round(
          originalG * (1 - opacityFactor) + newG * opacityFactor
        );
        data[i + 2] = Math.round(
          originalB * (1 - opacityFactor) + newB * opacityFactor
        );
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applyDitherEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const levels = params.levels || 4; // Number of color levels
      const ditherStrength = params.ditherStrength || 50;
      const pattern = params.pattern || 0; // 0=Bayer, 1=Floyd-Steinberg, 2=Random

      // Bayer matrix for ordered dithering
      const bayerMatrix = [
        [0, 8, 2, 10],
        [12, 4, 14, 6],
        [3, 11, 1, 9],
        [15, 7, 13, 5],
      ];

      const quantize = (value: number, levels: number) => {
        return Math.round((value * (levels - 1)) / 255) * (255 / (levels - 1));
      };

      if (pattern === 1) {
        // Floyd-Steinberg dithering
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;

            for (let c = 0; c < 3; c++) {
              const oldPixel = data[idx + c];
              const newPixel = quantize(oldPixel, levels);
              data[idx + c] = newPixel;

              const error = oldPixel - newPixel;
              const errorFactor = (ditherStrength / 100) * error;

              // Distribute error to neighboring pixels
              if (x + 1 < canvas.width) {
                data[idx + 4 + c] += (errorFactor * 7) / 16;
              }
              if (y + 1 < canvas.height) {
                if (x > 0) {
                  data[((y + 1) * canvas.width + (x - 1)) * 4 + c] +=
                    (errorFactor * 3) / 16;
                }
                data[((y + 1) * canvas.width + x) * 4 + c] +=
                  (errorFactor * 5) / 16;
                if (x + 1 < canvas.width) {
                  data[((y + 1) * canvas.width + (x + 1)) * 4 + c] +=
                    (errorFactor * 1) / 16;
                }
              }
            }
          }
        }
      } else {
        // Ordered dithering (Bayer or Random)
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;

            let threshold;
            if (pattern === 0) {
              // Bayer matrix
              threshold = bayerMatrix[y % 4][x % 4] / 16;
            } else {
              // Random dithering
              threshold = Math.random();
            }

            threshold = (threshold - 0.5) * (ditherStrength / 100) * 128;

            for (let c = 0; c < 3; c++) {
              const value = data[idx + c] + threshold;
              data[idx + c] = Math.max(
                0,
                Math.min(255, quantize(value, levels))
              );
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

export const applyVignetteEffect = async (
  imageUrl: string,
  params: Record<string, any>
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const intensity = params.intensity || 50;
      const size = params.size || 60;
      const softness = params.softness || 70;

      // Calculate center point
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Calculate maximum distance from center to corner
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

      // Calculate vignette radius based on size parameter
      const vignetteRadius = (maxDistance * size) / 100;

      // Calculate softness factor
      const softnessFactor = Math.max(0.1, softness / 100);

      // Process each pixel
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x) * 4;

          // Calculate distance from center
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Calculate vignette strength
          let vignetteStrength = 0;

          if (distance > vignetteRadius) {
            // Outside the vignette radius - apply darkening
            const fadeDistance = distance - vignetteRadius;
            const normalizedFade = Math.min(
              1,
              fadeDistance / (maxDistance * softnessFactor)
            );
            vignetteStrength = normalizedFade * (intensity / 100);
          }

          // Apply vignette effect
          if (vignetteStrength > 0) {
            const darkenFactor = 1 - vignetteStrength;
            data[idx] = Math.round(data[idx] * darkenFactor); // Red
            data[idx + 1] = Math.round(data[idx + 1] * darkenFactor); // Green
            data[idx + 2] = Math.round(data[idx + 2] * darkenFactor); // Blue
            // Alpha channel remains unchanged
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL());
    };

    img.src = imageUrl;
  });
};

// Enhanced upscaling functions for better image quality
export const upscaleImage = async (
  imageData: string,
  targetWidth: number,
  targetHeight: number,
  method: "bilinear" | "bicubic" | "lanczos" | "ai" = "bicubic"
): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const img = new Image();

    img.onload = () => {
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Set image smoothing based on method
      ctx.imageSmoothingEnabled = true;

      switch (method) {
        case "bilinear":
          ctx.imageSmoothingQuality = "low";
          break;
        case "bicubic":
          ctx.imageSmoothingQuality = "medium";
          break;
        case "lanczos":
          ctx.imageSmoothingQuality = "high";
          break;
        case "ai":
          // For AI upscaling, we'll use high quality + additional processing
          ctx.imageSmoothingQuality = "high";
          break;
      }

      // Draw the resized image
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Apply additional AI-like enhancements for the "ai" method
      if (method === "ai") {
        applyAIEnhancement(ctx, targetWidth, targetHeight);
      }

      resolve(canvas.toDataURL());
    };

    img.src = imageData;
  });
};

// AI-like enhancement using advanced image processing
const applyAIEnhancement = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Apply edge enhancement
  const enhancedData = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      // Simple edge detection and enhancement
      for (let c = 0; c < 3; c++) {
        const current = data[idx + c];
        const left = data[idx - 4 + c];
        const right = data[idx + 4 + c];
        const top = data[idx - width * 4 + c];
        const bottom = data[idx + width * 4 + c];

        // Calculate edge strength
        const edgeStrength =
          Math.abs(current - left) +
          Math.abs(current - right) +
          Math.abs(current - top) +
          Math.abs(current - bottom);

        // Enhance edges slightly
        if (edgeStrength > 30) {
          enhancedData[idx + c] = Math.min(255, current + edgeStrength * 0.1);
        }
      }
    }
  }

  // Apply subtle noise reduction
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        const neighbors = [
          data[idx - 4 + c],
          data[idx + 4 + c],
          data[idx - width * 4 + c],
          data[idx + width * 4 + c],
        ];

        // Simple noise reduction by averaging with neighbors
        const avg =
          neighbors.reduce((sum, val) => sum + val, 0) / neighbors.length;
        const current = enhancedData[idx + c];
        enhancedData[idx + c] = current * 0.8 + avg * 0.2;
      }
    }
  }

  ctx.putImageData(new ImageData(enhancedData, width, height), 0, 0);
};

// Utility function to check if upscaling is needed
export const isUpscaling = (
  originalWidth: number,
  originalHeight: number,
  targetWidth: number,
  targetHeight: number
): boolean => {
  return targetWidth > originalWidth || targetHeight > originalHeight;
};
