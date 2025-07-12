import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useIsMobile } from "../src/hooks/useIsMobile";
import {
  applyVHSEffect,
  applyGlitchEffect,
  applyLofiEffect,
  applyCyberpunkEffect,
  applyAOL90sEffect,
  applyFilmGrainEffect,
  applySepiaEffect,
  applyVintageEffect,
  applyNeonEffect,
  applyColorPopEffect,
  applyBlackWhiteEffect,
  applyBlurEffect,
  applySharpenEffect,
  applyInfraredEffect,
  applyThermalEffect,
  applyPolaroidEffect,
  applyCrossProcessEffect,
  applyEmbossEffect,
  applyEdgeDetectEffect,
  applyNESEffect,
  applySegaGenesisEffect,
  applySNESEffect,
  applySegaCDEffect,
  applyShadowrunEffect,
  applyColorEffect,
  applyDitherEffect,
  applyVignetteEffect,
} from "../src/utils/effects";

interface Layer {
  id: string;
  imageData: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: string;
  effectType?: string;
  effectParams?: Record<string, number | string>;
}

interface EffectsPanelProps {
  currentImage: string | null;
  selectedLayer: Layer | null;
  isEditingLayer: boolean;
  onImageChange: (imageData: string, effectName: string) => void;
  isPreviewMode: boolean;
  onStartPreview: (effectName: string) => void;
  onUpdatePreview: (
    previewData: string,
    effectParams?: Record<string, number | string>
  ) => void;
  onApplyPreview: () => void;
  onCancelPreview: () => void;
  onEditLayer: (layerId: string) => void;
  onClearEffectSelection?: () => void;
  onNavigateToCanvas?: () => void;
}

// Define types for effect parameters
interface EffectParam {
  min: number;
  max: number;
  default: number | string;
  label: string;
  type?: "color" | "number" | "select";
  options?: Array<{ value: number; label: string }>;
}

interface Effect {
  id: string;
  name: string;
  icon: string;
  description: string;
  params: Record<string, EffectParam>;
}

interface EffectCategory {
  name: string;
  icon: string;
  color: string;
  effects: Effect[];
}

// Effect mapping for better maintainability
const EFFECT_FUNCTIONS = {
  vhs: applyVHSEffect,
  glitch: applyGlitchEffect,
  lofi: applyLofiEffect,
  cyberpunk: applyCyberpunkEffect,
  aol90s: applyAOL90sEffect,
  nes: applyNESEffect,
  genesis: applySegaGenesisEffect,
  snes: applySNESEffect,
  segacd: applySegaCDEffect,
  shadowrun: applyShadowrunEffect,
  filmgrain: applyFilmGrainEffect,
  sepia: applySepiaEffect,
  vintage: applyVintageEffect,
  neon: applyNeonEffect,
  colorpop: applyColorPopEffect,
  blackwhite: applyBlackWhiteEffect,
  blur: applyBlurEffect,
  sharpen: applySharpenEffect,
  infrared: applyInfraredEffect,
  thermal: applyThermalEffect,
  polaroid: applyPolaroidEffect,
  crossprocess: applyCrossProcessEffect,
  emboss: applyEmbossEffect,
  edgedetect: applyEdgeDetectEffect,
  color: applyColorEffect,
  dither: applyDitherEffect,
  vignette: applyVignetteEffect,
} as const;

// Organized effect categories
const EFFECT_CATEGORIES: Record<string, EffectCategory> = {
  retro: {
    name: "Retro & Gaming",
    icon: "🎮",
    color: "#ff6b6b",
    effects: [
      {
        id: "vhs",
        name: "VHS Glitch",
        icon: "📺",
        description: "Dramatic VHS tape glitches",
        params: {
          tracking: { min: 0, max: 100, default: 30, label: "Tracking Errors" },
          chromatic: { min: 0, max: 100, default: 25, label: "Color Separation" },
          dropout: { min: 0, max: 100, default: 20, label: "Signal Dropout" },
          syncLoss: { min: 0, max: 100, default: 15, label: "Sync Loss" },
          tapeNoise: { min: 0, max: 100, default: 25, label: "Tape Noise" },
          colorBleed: { min: 0, max: 100, default: 30, label: "Color Bleeding" },
          scanlines: { min: 0, max: 100, default: 40, label: "Scanlines" },
          noiseType: { 
            min: 0,
            max: 3,
            type: "select", 
            default: 0, 
            label: "Noise Type",
            options: [
              { value: 0, label: "Mixed" },
              { value: 1, label: "Luminance" },
              { value: 2, label: "Chrominance" },
              { value: 3, label: "High Frequency" }
            ]
          },
        },
      },
      {
        id: "aol90s",
        name: "90s Internet",
        icon: "💿",
        description: "Retro web aesthetics",
        params: {
          pixelation: { min: 0, max: 100, default: 40, label: "Pixelation" },
          colors: { min: 0, max: 100, default: 50, label: "Color Depth" },
          dither: { min: 0, max: 100, default: 30, label: "Dithering" },
        },
      },
      {
        id: "nes",
        name: "NES Classic",
        icon: "🎮",
        description: "8-bit Nintendo nostalgia",
        params: {
          pixelation: { min: 1, max: 8, default: 4, label: "Pixel Size" },
          colorDepth: { min: 4, max: 16, default: 8, label: "Color Depth" },
          contrast: { min: 80, max: 150, default: 120, label: "Contrast" },
          scanlines: { min: 0, max: 100, default: 20, label: "Scanlines" },
          dithering: { min: 0, max: 100, default: 15, label: "Dithering" },
        },
      },
      {
        id: "genesis",
        name: "Sega Genesis",
        icon: "🕹️",
        description: "16-bit Sega blast processing",
        params: {
          saturation: { min: 100, max: 200, default: 140, label: "Saturation" },
          dithering: { min: 0, max: 50, default: 25, label: "Dithering" },
          colorDepth: {
            min: 256,
            max: 1024,
            default: 512,
            label: "Color Depth",
          },
          scanlines: { min: 0, max: 100, default: 30, label: "Scanlines" },
          sharpness: { min: 50, max: 200, default: 130, label: "Sharpness" },
        },
      },
      {
        id: "snes",
        name: "Super Nintendo",
        icon: "🎯",
        description: "16-bit Nintendo smoothness",
        params: {
          softness: { min: 0, max: 60, default: 40, label: "CRT Softness" },
          colorBoost: {
            min: 100,
            max: 150,
            default: 115,
            label: "Color Boost",
          },
          brightness: { min: 90, max: 130, default: 110, label: "Brightness" },
          colorBleed: { min: 0, max: 100, default: 25, label: "Color Bleeding" },
          scanlines: { min: 0, max: 100, default: 15, label: "Scanlines" },
        },
      },
      {
        id: "segacd",
        name: "Sega CD",
        icon: "📀",
        description: "FMV compression artifacts",
        params: {
          compression: { min: 10, max: 50, default: 30, label: "Compression" },
          fmvLook: { min: 20, max: 60, default: 40, label: "FMV Processing" },
          colorBanding: {
            min: 10,
            max: 40,
            default: 20,
            label: "Color Banding",
          },
        },
      },
    ],
  },
  modern: {
    name: "Modern & Digital",
    icon: "⚡",
    color: "#4ecdc4",
    effects: [
      {
        id: "glitch",
        name: "Digital Glitch",
        icon: "⚡",
        description: "Digital corruption effect",
        params: {
          intensity: { min: 0, max: 100, default: 50, label: "Glitch Intensity" },
          frequency: { min: 0, max: 100, default: 30, label: "Glitch Frequency" },
          rgbShift: { min: 0, max: 100, default: 15, label: "RGB Separation" },
          blockCorruption: { min: 0, max: 100, default: 40, label: "Block Corruption" },
          digitalNoise: { min: 0, max: 100, default: 20, label: "Digital Noise" },
        },
      },
      {
        id: "cyberpunk",
        name: "Cyberpunk Neon",
        icon: "🤖",
        description: "Futuristic neon glow",
        params: {
          neon: { min: 0, max: 100, default: 70, label: "Neon Intensity" },
          contrast: { min: 0, max: 200, default: 80, label: "Contrast" },
          colorTemp: { min: 0, max: 100, default: 60, label: "Cool/Warm" },
          glowRadius: { min: 0, max: 100, default: 30, label: "Glow Radius" },
          saturation: { min: 50, max: 200, default: 150, label: "Color Boost" },
        },
      },
      {
        id: "shadowrun",
        name: "Shadowrun CRT",
        icon: "🌃",
        description: "Cyberpunk hacker terminal",
        params: {
          crtGlow: { min: 0, max: 100, default: 70, label: "CRT Glow" },
          matrixTint: { min: 0, max: 100, default: 60, label: "Matrix Tint" },
          scanlines: { min: 0, max: 100, default: 40, label: "Scanlines" },
          phosphorDecay: { min: 0, max: 100, default: 30, label: "Phosphor Decay" },
          interference: { min: 0, max: 100, default: 20, label: "Signal Noise" },
        },
      },
      {
        id: "neon",
        name: "Neon Glow",
        icon: "✨",
        description: "Electric neon effect",
        params: {
          glow: { min: 0, max: 100, default: 60, label: "Glow Intensity" },
          color: {
            min: 0,
            max: 0,
            default: "#00ffff",
            label: "Neon Color",
            type: "color",
          },
          brightness: { min: 0, max: 200, default: 120, label: "Brightness" },
        },
      },
      {
        id: "dither",
        name: "Digital Dither",
        icon: "🔲",
        description: "Retro dithering effect",
        params: {
          intensity: { min: 0, max: 100, default: 50, label: "Intensity" },
          pattern: { min: 1, max: 8, default: 4, label: "Pattern Size" },
        },
      },
    ],
  },
  vintage: {
    name: "Vintage & Film",
    icon: "📸",
    color: "#f7b731",
    effects: [
      {
        id: "vintage",
        name: "Vintage Film",
        icon: "📸",
        description: "Classic film look",
        params: {
          fade: { min: 0, max: 100, default: 50, label: "Fade" },
          grain: { min: 0, max: 100, default: 30, label: "Grain" },
          vignette: { min: 0, max: 100, default: 25, label: "Vignette" },
          warmth: { min: 0, max: 100, default: 40, label: "Warmth" },
          scratches: { min: 0, max: 100, default: 20, label: "Scratches" },
          dustSpots: { min: 0, max: 100, default: 15, label: "Dust Spots" },
        },
      },
      {
        id: "sepia",
        name: "Sepia Tone",
        icon: "🟤",
        description: "Classic sepia toning",
        params: {
          intensity: { min: 0, max: 100, default: 80, label: "Intensity" },
          warmth: { min: 0, max: 100, default: 60, label: "Warmth" },
        },
      },
      {
        id: "polaroid",
        name: "Polaroid",
        icon: "🖼️",
        description: "Instant camera look",
        params: {
          fade: { min: 0, max: 100, default: 40, label: "Fade" },
          warmth: { min: 0, max: 100, default: 60, label: "Warmth" },
          vignette: { min: 0, max: 100, default: 30, label: "Vignette" },
        },
      },
      {
        id: "filmgrain",
        name: "Film Grain",
        icon: "🎞️",
        description: "Analog film texture",
        params: {
          intensity: { min: 0, max: 100, default: 65, label: "Intensity" },
          size: { min: 1, max: 10, default: 3, label: "Grain Size" },
          opacity: { min: 0, max: 100, default: 80, label: "Opacity" },
          grainType: {
            min: 0,
            max: 3,
            type: "select",
            default: 0,
            label: "Grain Type",
            options: [
              { value: 0, label: "Fine" },
              { value: 1, label: "Medium" },
              { value: 2, label: "Coarse" },
              { value: 3, label: "Mixed" }
            ]
          },
          shadows: { min: 0, max: 100, default: 85, label: "Shadow Grain" },
          highlights: { min: 0, max: 100, default: 45, label: "Highlight Grain" },
        },
      },
      {
        id: "lofi",
        name: "Lo-Fi Aesthetic",
        icon: "🎵",
        description: "Vintage low-fi look",
        params: {
          warmth: { min: 0, max: 100, default: 60, label: "Warmth" },
          grain: { min: 0, max: 100, default: 40, label: "Film Grain" },
          vignette: { min: 0, max: 100, default: 30, label: "Vignette" },
        },
      },
    ],
  },
  artistic: {
    name: "Artistic & Creative",
    icon: "🎨",
    color: "#a55eea",
    effects: [
      {
        id: "colorpop",
        name: "Color Pop",
        icon: "🌈",
        description: "Selective color enhancement",
        params: {
          intensity: { min: 0, max: 200, default: 120, label: "Intensity" },
          hue: { min: 0, max: 360, default: 180, label: "Target Hue" },
          range: { min: 10, max: 90, default: 30, label: "Color Range" },
        },
      },
      {
        id: "crossprocess",
        name: "Cross Process",
        icon: "🔄",
        description: "Film cross-processing",
        params: {
          intensity: { min: 0, max: 100, default: 60, label: "Intensity" },
          colorShift: { min: 0, max: 100, default: 40, label: "Color Shift" },
        },
      },
      {
        id: "emboss",
        name: "Emboss",
        icon: "🏔️",
        description: "3D embossed effect",
        params: {
          strength: { min: 0, max: 100, default: 50, label: "Strength" },
          depth: { min: 1, max: 10, default: 3, label: "Depth" },
        },
      },
      {
        id: "edgedetect",
        name: "Edge Detect",
        icon: "🔍",
        description: "Outline detection",
        params: {
          threshold: { min: 0, max: 255, default: 50, label: "Threshold" },
          invert: { min: 0, max: 1, default: 0, label: "Invert" },
        },
      },
      {
        id: "vignette",
        name: "Vignette",
        icon: "⭕",
        description: "Dark edge framing",
        params: {
          intensity: { min: 0, max: 100, default: 50, label: "Intensity" },
          size: { min: 10, max: 90, default: 60, label: "Size" },
          softness: { min: 0, max: 100, default: 40, label: "Softness" },
        },
      },
    ],
  },
  technical: {
    name: "Technical & Filters",
    icon: "🔧",
    color: "#26de81",
    effects: [
      {
        id: "blur",
        name: "Blur",
        icon: "🌫️",
        description: "Gaussian blur effect",
        params: {
          radius: { min: 0, max: 20, default: 5, label: "Blur Radius" },
        },
      },
      {
        id: "sharpen",
        name: "Sharpen",
        icon: "🔪",
        description: "Image sharpening",
        params: {
          strength: { min: 0, max: 100, default: 50, label: "Strength" },
        },
      },
      {
        id: "blackwhite",
        name: "Black & White",
        icon: "⚫",
        description: "Monochrome conversion",
        params: {
          contrast: { min: 0, max: 200, default: 110, label: "Contrast" },
          brightness: { min: 0, max: 200, default: 100, label: "Brightness" },
          grain: { min: 0, max: 50, default: 15, label: "Film Grain" },
          conversionMethod: {
            min: 0,
            max: 3,
            type: "select",
            default: 0,
            label: "Conversion Method",
            options: [
              { value: 0, label: "Luminance" },
              { value: 1, label: "Red Channel" },
              { value: 2, label: "Green Channel" },
              { value: 3, label: "Blue Channel" }
            ]
          },
        },
      },
      {
        id: "infrared",
        name: "Infrared",
        icon: "🌡️",
        description: "Infrared camera effect",
        params: {
          intensity: { min: 0, max: 100, default: 70, label: "Intensity" },
          redChannel: { min: 0, max: 200, default: 150, label: "Red Boost" },
          contrast: { min: 50, max: 200, default: 120, label: "Contrast" },
          falseColor: {
            min: 0,
            max: 2,
            type: "select",
            default: 0,
            label: "False Color",
            options: [
              { value: 0, label: "Standard" },
              { value: 1, label: "Wood's Effect" },
              { value: 2, label: "Aerochrome" }
            ]
          },
        },
      },
      {
        id: "thermal",
        name: "Thermal",
        icon: "🔥",
        description: "Thermal imaging effect",
        params: {
          intensity: { min: 0, max: 100, default: 80, label: "Intensity" },
          colorRange: { min: 20, max: 100, default: 60, label: "Color Range" },
          contrast: { min: 80, max: 200, default: 140, label: "Contrast" },
          palette: {
            min: 0,
            max: 4,
            type: "select",
            default: 0,
            label: "Thermal Palette",
            options: [
              { value: 0, label: "Hot Iron" },
              { value: 1, label: "Rainbow" },
              { value: 2, label: "Grayscale" },
              { value: 3, label: "Medical" },
              { value: 4, label: "Arctic" }
            ]
          },
        },
      },
      {
        id: "color",
        name: "Insert Color",
        icon: "🎨",
        description: "Add a colored layer overlay",
        params: {
          color: {
            min: 0,
            max: 0,
            default: "#ff0000",
            label: "Color",
            type: "color",
          },
          opacity: { min: 0, max: 100, default: 50, label: "Opacity" },
          blendMode: {
            min: 0,
            max: 11,
            default: 0,
            label: "Blend Mode",
            type: "select",
            options: [
              { value: 0, label: "Normal" },
              { value: 1, label: "Multiply" },
              { value: 2, label: "Screen" },
              { value: 3, label: "Overlay" },
              { value: 4, label: "Soft Light" },
              { value: 5, label: "Hard Light" },
              { value: 6, label: "Color Dodge" },
              { value: 7, label: "Color Burn" },
              { value: 8, label: "Darken" },
              { value: 9, label: "Lighten" },
              { value: 10, label: "Difference" },
              { value: 11, label: "Exclusion" }
            ],
          },
        },
      },
    ],
  },
};

export const EffectsPanel: React.FC<EffectsPanelProps> = ({
  currentImage,
  selectedLayer,
  isEditingLayer,
  onImageChange,
  isPreviewMode,
  onStartPreview,
  onUpdatePreview,
  onApplyPreview,
  onCancelPreview,
  onEditLayer,
  onClearEffectSelection,
  onNavigateToCanvas,
}) => {
  const isMobile = useIsMobile();
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [effectParams, setEffectParams] = useState<
    Record<string, number | string>
  >({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [processedImagePreview, setProcessedImagePreview] = useState<
    string | null
  >(null);
  const [layoutResetKey, setLayoutResetKey] = useState(0);
  
  // Mobile preview zoom state
  const [previewZoom, setPreviewZoom] = useState(100);
  const [previewPanOffset, setPreviewPanOffset] = useState({ x: 0, y: 0 });
  const [isPreviewPanning, setIsPreviewPanning] = useState(false);
  const [lastPreviewTouch, setLastPreviewTouch] = useState<{ x: number; y: number } | null>(null);
  const [lastPreviewTap, setLastPreviewTap] = useState<number>(0);

  // Get all effects from all categories
  const allEffects = useMemo(() => {
    return Object.values(EFFECT_CATEGORIES).flatMap(
      (category) => category.effects
    );
  }, []);

  // Filter effects based on search term
  const filteredEffects = useMemo(() => {
    if (!searchTerm) {
      // Show all effects when "all" is selected, otherwise show category effects
      if (selectedCategory === "all") {
        return allEffects;
      }
      return EFFECT_CATEGORIES[selectedCategory]?.effects || [];
    }

    return allEffects.filter(
      (effect) =>
        effect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        effect.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, selectedCategory, allEffects]);

  // Get category for an effect (for search results)
  const getEffectCategory = useCallback((effectId: string) => {
    for (const [key, category] of Object.entries(EFFECT_CATEGORIES)) {
      if (category.effects.some((effect) => effect.id === effectId)) {
        return category;
      }
    }
    return null;
  }, []);



  const clearEffectSelection = useCallback(() => {
    setSelectedEffect(null);
    setEffectParams({});
    setError(null);
    setShowOriginal(false);
    setProcessedImagePreview(null);
    // Reset zoom state
    setPreviewZoom(100);
    setPreviewPanOffset({ x: 0, y: 0 });
    // Force layout reset by changing the key
    setLayoutResetKey(prev => prev + 1);
  }, []);

  const handleApplyPreview = useCallback(() => {
    onApplyPreview();
    clearEffectSelection();
    // Reset toggle state
    setShowOriginal(false);
    // Navigate to canvas on mobile after applying
    if (isMobile && onNavigateToCanvas) {
      onNavigateToCanvas();
    }
  }, [onApplyPreview, clearEffectSelection, isMobile, onNavigateToCanvas]);



  // Load layer parameters when editing a layer
  useEffect(() => {
    if (isEditingLayer && selectedLayer && selectedLayer.effectType) {
      const effect = allEffects.find((e) => e.id === selectedLayer.effectType);
      if (effect) {
        setSelectedEffect(selectedLayer.effectType);
        // Load saved parameters or use defaults
        const params =
          selectedLayer.effectParams ||
          Object.fromEntries(
            Object.entries(effect.params).map(([key, param]) => [
              key,
              param.default,
            ])
          );
        setEffectParams(params);
      }
    }
  }, [isEditingLayer, selectedLayer, allEffects]);

  // Generate live preview with improved debouncing
  const generateLivePreview = useCallback(async () => {
    if (!selectedEffect || !currentImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      const effectFunction =
        EFFECT_FUNCTIONS[selectedEffect as keyof typeof EFFECT_FUNCTIONS];
      if (!effectFunction) {
        throw new Error(`Effect function not found: ${selectedEffect}`);
      }

      const processedImage = await effectFunction(currentImage, effectParams);
      setProcessedImagePreview(processedImage);

      // Show original or processed based on toggle state
      if (showOriginal) {
        onUpdatePreview(currentImage!, effectParams);
      } else {
        onUpdatePreview(processedImage, effectParams);
      }
    } catch (error) {
      console.error("Error generating preview:", error);
      setError("Failed to generate preview. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [
    selectedEffect,
    currentImage,
    effectParams,
    onUpdatePreview,
    showOriginal,
  ]);

  // Handle comparison toggle
  const handleComparisonToggle = useCallback(() => {
    const newShowOriginal = !showOriginal;
    setShowOriginal(newShowOriginal);

    if (processedImagePreview) {
      // Immediately update the preview based on the toggle
      if (newShowOriginal) {
        onUpdatePreview(currentImage!, effectParams);
      } else {
        onUpdatePreview(processedImagePreview, effectParams);
      }
    }
  }, [
    showOriginal,
    processedImagePreview,
    currentImage,
    effectParams,
    onUpdatePreview,
  ]);

  // Debounced preview generation
  useEffect(() => {
    if (isPreviewMode && selectedEffect && currentImage) {
      const timeoutId = setTimeout(() => {
        generateLivePreview();
      }, 300); // Increased debounce time for better performance

      return () => clearTimeout(timeoutId);
    }
  }, [isPreviewMode, selectedEffect, currentImage, generateLivePreview]);

  // Mobile preview touch handlers
  const handlePreviewTouchStart = useCallback((event: React.TouchEvent) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const now = Date.now();
      
      // Check for double tap (within 300ms)
      if (now - lastPreviewTap < 300) {
        // Double tap - reset zoom
        setPreviewZoom(100);
        setPreviewPanOffset({ x: 0, y: 0 });
        setLastPreviewTap(0);
        event.preventDefault(); // Prevent any default behavior
        return;
      }
      
      setLastPreviewTap(now);
      setLastPreviewTouch({ x: touch.clientX, y: touch.clientY });
      setIsPreviewPanning(true);
    }
  }, [lastPreviewTap]);

  const handlePreviewTouchMove = useCallback((event: React.TouchEvent) => {
    if (isPreviewPanning && lastPreviewTouch && event.touches.length === 1) {
      const touch = event.touches[0];
      const deltaX = touch.clientX - lastPreviewTouch.x;
      const deltaY = touch.clientY - lastPreviewTouch.y;
      
      // Allow panning at any zoom level to see the whole image
      setPreviewPanOffset(prev => {
        const newX = prev.x + deltaX;
        const newY = prev.y + deltaY;
        
        // Calculate bounds - allow generous panning even at 100% or below
        // At 100% zoom, allow panning up to 200px in any direction
        const baseOffset = 200;
        const zoomOffset = Math.max(0, (previewZoom - 100) * 4);
        const maxOffset = baseOffset + zoomOffset;
        
        return {
          x: Math.max(-maxOffset, Math.min(maxOffset, newX)),
          y: Math.max(-maxOffset, Math.min(maxOffset, newY))
        };
      });
      
      setLastPreviewTouch({ x: touch.clientX, y: touch.clientY });
    }
  }, [isPreviewPanning, lastPreviewTouch, previewZoom]);

  const handlePreviewTouchEnd = useCallback(() => {
    setIsPreviewPanning(false);
    setLastPreviewTouch(null);
  }, []);

  // Reset layout key when preview mode changes
  useEffect(() => {
    if (!isPreviewMode) {
      setLayoutResetKey(prev => prev + 1);
    }
  }, [isPreviewMode]);

  const handleEffectClick = useCallback(
    (effectId: string) => {
      if (!currentImage) {
        setError("Please upload an image first!");
        return;
      }

      const effect = allEffects.find((e) => e.id === effectId);
      if (effect) {
        const defaultParams = Object.fromEntries(
          Object.entries(effect.params).map(([key, param]) => [
            key,
            param.default,
          ])
        );
        setSelectedEffect(effectId);
        setEffectParams(defaultParams);
        setError(null);
        setShowOriginal(false);
        setProcessedImagePreview(null);
        onStartPreview(effect.name);
      }
    },
    [currentImage, allEffects, onStartPreview]
  );

  const handleEditSelectedLayer = useCallback(() => {
    if (selectedLayer && selectedLayer.effectType) {
      onEditLayer(selectedLayer.id);
    }
  }, [selectedLayer, onEditLayer]);

  const handleParamChange = useCallback(
    (paramName: string, value: number | string) => {
      setEffectParams((prev) => ({ ...prev, [paramName]: value }));
    },
    []
  );

  const selectedEffectData = useMemo(() => {
    return allEffects.find((e) => e.id === selectedEffect);
  }, [selectedEffect, allEffects]);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "4px",
        gap: "4px",
        background: "var(--bg-primary)",
        fontFamily: "MS Sans Serif, sans-serif",
        fontSize: "11px",
      }}
    >
      {/* Error Display */}
      {error && (
        <div
          style={{
            padding: "6px",
            background: "var(--bg-warning)",
            border: "1px solid var(--border-secondary)",
            fontSize: "11px",
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            borderRadius: "0",
          }}
        >
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Search and Filter Section */}
      <div
        style={{
          padding: "8px",
          background: "var(--bg-primary)",
          marginBottom: "4px",
        }}
      >
        {/* Search Bar with Clear Button */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              type="text"
              placeholder="Search effects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "4px 20px 4px 4px",
                fontSize: "11px",
                border: "2px inset var(--bg-primary)",
                background: "var(--bg-input)",
                outline: "none",
                color: "var(--text-primary)",
                fontFamily: "MS Sans Serif, sans-serif",
                borderRadius: "0",
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{
                  position: "absolute",
                  right: "4px",
                  top: "4px",
                  background: "var(--bg-button)",
                  border: "1px outset var(--bg-button)",
                  fontSize: "10px",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  padding: "2px 4px",
                  fontFamily: "MS Sans Serif, sans-serif",
                  borderRadius: "0",
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs - Always visible but dimmed when searching */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: isMobile ? "1px" : "2px",
            opacity: searchTerm ? 0.6 : 1,
          }}
        >
          {/* All Effects Button */}
          <button
            onClick={() => {
              setSelectedCategory("all");
              if (searchTerm) setSearchTerm(""); // Clear search when clicking category
            }}
            style={{
              flex: "1",
              minWidth: isMobile ? "45px" : "60px",
              padding: isMobile ? "3px 1px" : "4px 2px",
              fontSize: isMobile ? "9px" : "11px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: isMobile ? "1px" : "2px",
              background: selectedCategory === "all" ? "var(--bg-button-active)" : "var(--bg-button)",
              color: selectedCategory === "all" ? "var(--text-button-active)" : "var(--text-primary)",
              border: selectedCategory === "all" 
                ? "2px inset var(--bg-button)"
                : "2px outset var(--bg-button)",
              opacity: isPreviewMode ? 0.7 : 1,
              cursor: searchTerm ? "pointer" : "default",
              fontFamily: "MS Sans Serif, sans-serif",
              borderRadius: "0",
            }}
            disabled={isPreviewMode}
            title={searchTerm ? "Show all effects" : "All effects"}
          >
            <span style={{ fontSize: isMobile ? "8px" : "10px" }}>✨</span>
            <span>All</span>
          </button>

          {Object.entries(EFFECT_CATEGORIES).map(([key, category]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedCategory(key);
                if (searchTerm) setSearchTerm(""); // Clear search when clicking category
              }}
              style={{
                flex: "1",
                minWidth: isMobile ? "45px" : "60px",
                padding: isMobile ? "3px 1px" : "4px 2px",
                fontSize: isMobile ? "9px" : "11px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: isMobile ? "1px" : "2px",
                background: selectedCategory === key ? "var(--bg-button-active)" : "var(--bg-button)",
                color: selectedCategory === key ? "var(--text-button-active)" : "var(--text-primary)",
                border: selectedCategory === key 
                  ? "2px inset var(--bg-button)"
                  : "2px outset var(--bg-button)",
                opacity: isPreviewMode ? 0.7 : 1,
                cursor: searchTerm ? "pointer" : "default",
                fontFamily: "MS Sans Serif, sans-serif",
                borderRadius: "0",
              }}
              disabled={isPreviewMode}
              title={searchTerm ? `Switch to ${category.name}` : category.name}
            >
              <span style={{ fontSize: isMobile ? "8px" : "10px" }}>{category.icon}</span>
              <span>{category.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>



      {/* Effect Buttons Grid */}
      <div 
        key={layoutResetKey} 
        style={{ flex: 1, overflow: "auto" }} 
        className="win99-scrollbar effects-grid-container"
      >
        {/* Search Results Counter */}
        {searchTerm && (
          <div
            style={{
              fontSize: "11px",
              color: "var(--text-secondary)",
              marginBottom: "4px",
              textAlign: "center",
              fontStyle: "italic",
              fontFamily: "MS Sans Serif, sans-serif",
            }}
          >
            Found {filteredEffects.length} effect
            {filteredEffects.length !== 1 ? "s" : ""}
            {filteredEffects.length === 0 && " - try different keywords"}
          </div>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
            gap: "4px",
            opacity: isPreviewMode ? 0.5 : 1,
          }}
        >
          {filteredEffects.map((effect) => {
            const category = getEffectCategory(effect.id);
            return (
              <button
                key={effect.id}
                onClick={() => !isPreviewMode && handleEffectClick(effect.id)}
                title={
                  isPreviewMode
                    ? "Finish current preview first"
                    : effect.description
                }
                disabled={!currentImage || isPreviewMode}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "8px 4px",
                  gap: "3px",
                  minHeight: "60px",
                  fontSize: "11px",
                  opacity: !currentImage || isPreviewMode ? 0.5 : 1,
                  cursor:
                    !currentImage || isPreviewMode ? "not-allowed" : "pointer",
                  background: selectedEffect === effect.id ? "var(--bg-button-active)" : "var(--bg-button)",
                  border: selectedEffect === effect.id 
                    ? "2px inset var(--bg-button)"
                    : "2px outset var(--bg-button)",
                  color: selectedEffect === effect.id ? "var(--text-button-active)" : "var(--text-primary)",
                  fontFamily: "MS Sans Serif, sans-serif",
                  borderRadius: "0",
                }}
              >
                <div style={{ fontSize: "16px" }}>{effect.icon}</div>
                <div
                  style={{
                    lineHeight: "1.1",
                    textAlign: "center",
                    fontWeight: "bold",
                    wordBreak: "break-word",
                  }}
                >
                  {effect.name}
                </div>

              </button>
            );
          })}
        </div>
      </div>

      {/* Live Preview Controls */}
      {isPreviewMode && selectedEffect && selectedEffectData && (
        <div
          style={{
            padding: "8px",
            background: "var(--bg-primary)",
          }}
        >


          {/* Preview Thumbnail - Show only on mobile */}
          {isMobile && (currentImage || processedImagePreview) && (
            <div
              style={{
                marginBottom: "12px",
                padding: "8px",
                background: "var(--bg-primary)",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "bold",
                  marginBottom: "6px",
                  color: "var(--text-primary)",
                  textAlign: "center",
                  fontFamily: "MS Sans Serif, sans-serif",
                }}
              >
                {selectedEffectData ? `${selectedEffectData.name} Preview` : "Preview"} (drag to pan)
              </div>
                                                                                        {/* Large Preview with Overlay Toggle */}
               <div style={{ textAlign: "center", position: "relative", display: "inline-block" }}>
                 {/* Large Preview Image */}
                 {processedImagePreview ? (
                   <>
                     <div
                       className="preview-zoom-container prevent-zoom"
                       style={{
                         position: "relative",
                         overflow: "hidden",
                         border: "2px inset var(--bg-button)",
                         background: "var(--bg-input)",
                         margin: "0 auto",
                         width: "100%",
                         height: "250px",
                         touchAction: "none",
                         display: "flex",
                         alignItems: "center",
                         justifyContent: "center",
                         cursor: isPreviewPanning ? "grabbing" : "grab",
                       }}
                       onTouchStart={handlePreviewTouchStart}
                       onTouchMove={handlePreviewTouchMove}
                       onTouchEnd={handlePreviewTouchEnd}
                       onWheel={(e) => {
                         e.preventDefault();
                         const delta = e.deltaY > 0 ? -25 : 25;
                         const newZoom = Math.max(50, Math.min(600, previewZoom + delta));
                         setPreviewZoom(newZoom);
                       }}
                     >
                       <img
                         className="preview-zoom-image"
                         src={showOriginal ? currentImage! : processedImagePreview}
                         alt={showOriginal ? "Original" : "Preview"}
                         style={{
                           width: `${previewZoom}%`,
                           height: "auto",
                           maxWidth: "none",
                           minWidth: "auto",
                           objectFit: "contain",
                           transform: `translate(${previewPanOffset.x}px, ${previewPanOffset.y}px)`,
                           transition: isPreviewPanning ? "none" : "transform 0.1s ease",
                           flexShrink: 0,
                           flexGrow: 0,
                           flexBasis: "auto",
                           userSelect: "none",
                         }}
                         draggable={false}
                         onLoad={() => console.log('Image loaded with zoom:', previewZoom)}
                       />
                     </div>
                     
                     {/* Overlay Toggle Button */}
                     <button
                       onClick={handleComparisonToggle}
                       disabled={isProcessing}
                       style={{
                         position: "absolute",
                         top: "8px",
                         right: "8px",
                         padding: "4px",
                         fontSize: "12px",
                         width: "28px",
                         height: "28px",
                         background: "var(--bg-button)",
                         border: "2px outset var(--bg-button)",
                         opacity: isProcessing ? 0.7 : 1,
                         cursor: "pointer",
                         display: "flex",
                         alignItems: "center",
                         justifyContent: "center",
                         borderRadius: "0",
                         fontFamily: "MS Sans Serif, sans-serif",
                         color: "var(--text-primary)",
                       }}
                       title={showOriginal ? "Show effect" : "Show original"}
                                            >
                       {showOriginal ? "👁️" : "🚫"}
                     </button>
                     
                     {/* Zoom Controls - Show on both mobile and desktop */}
                     <div
                       style={{
                         position: "absolute",
                         bottom: "8px",
                         left: "8px",
                         display: "flex",
                         gap: "1px",
                         background: previewZoom !== 100 ? "var(--bg-button-active)" : "var(--bg-window)",
                         border: "2px outset var(--border-window)",
                         padding: "1px",
                         borderRadius: "2px",
                         zIndex: 10,
                         opacity: previewZoom !== 100 ? 0.9 : 0.8,
                       }}
                       title="Double-tap to reset zoom"
                     >
                       <button
                         onClick={() => {
                           const newZoom = Math.max(50, previewZoom - 25);
                           console.log('Zoom out clicked, current:', previewZoom, 'new:', newZoom);
                           setPreviewZoom(newZoom);
                         }}
                         style={{
                           fontSize: "10px",
                           padding: "2px 4px",
                           minHeight: "20px",
                           minWidth: "24px",
                           fontWeight: "bold",
                           background: previewZoom <= 50 ? "var(--bg-content)" : "var(--bg-button)",
                           border: "2px outset var(--bg-button)",
                           color: previewZoom <= 50 ? "var(--text-secondary)" : "var(--text-primary)",
                           cursor: previewZoom <= 50 ? "not-allowed" : "pointer",
                           opacity: previewZoom <= 50 ? 0.5 : 1,
                           touchAction: "manipulation", // Prevent browser zoom
                         }}
                         title="Zoom Out"
                         disabled={previewZoom <= 50}
                       >
                         -
                       </button>
                       <span
                         style={{
                           minWidth: "40px",
                           textAlign: "center",
                           fontWeight: "bold",
                           fontSize: "9px",
                           color: previewZoom !== 100 ? "var(--text-titlebar)" : "var(--text-primary)",
                           display: "flex",
                           alignItems: "center",
                           padding: "0 4px",
                           background: previewZoom !== 100 ? "var(--bg-button-active)" : "transparent",
                         }}
                       >
                         {Math.round(previewZoom)}%
                       </span>
                       <button
                         onClick={() => {
                           const newZoom = Math.min(600, previewZoom + 25);
                           console.log('Zoom in clicked, current:', previewZoom, 'new:', newZoom);
                           setPreviewZoom(newZoom);
                         }}
                         style={{
                           fontSize: "10px",
                           padding: "2px 4px",
                           minHeight: "20px",
                           minWidth: "24px",
                           fontWeight: "bold",
                           background: previewZoom >= 600 ? "var(--bg-content)" : "var(--bg-button)",
                           border: "2px outset var(--bg-button)",
                           color: previewZoom >= 600 ? "var(--text-secondary)" : "var(--text-primary)",
                           cursor: previewZoom >= 600 ? "not-allowed" : "pointer",
                           opacity: previewZoom >= 600 ? 0.5 : 1,
                           touchAction: "manipulation", // Prevent browser zoom
                         }}
                         title="Zoom In"
                         disabled={previewZoom >= 600}
                       >
                         +
                       </button>
                       <button
                         onClick={() => {
                           setPreviewZoom(100);
                           setPreviewPanOffset({ x: 0, y: 0 });
                         }}
                         style={{
                           fontSize: "8px",
                           padding: "2px 4px",
                           minHeight: "20px",
                           minWidth: "28px",
                           background: "var(--bg-button)",
                           border: "2px outset var(--bg-button)",
                           color: "var(--text-primary)",
                           cursor: "pointer",
                           touchAction: "manipulation", // Prevent browser zoom
                         }}
                         title="Reset zoom"
                       >
                         Reset
                       </button>
                     </div>
                   </>
                 ) : (
                   <div
                     style={{
                       width: "100%",
                       height: "200px",
                       border: "2px inset var(--bg-button)",
                       display: "flex",
                       alignItems: "center",
                       justifyContent: "center",
                       background: "var(--bg-input)",
                       color: "var(--text-secondary)",
                       fontSize: "12px",
                       margin: "0 auto",
                       flexDirection: "column",
                       gap: "8px",
                       fontFamily: "MS Sans Serif, sans-serif",
                     }}
                   >
                     <div>{isProcessing ? "⏳" : "🎨"}</div>
                     <div>{isProcessing ? "Processing..." : "Loading Preview..."}</div>
                   </div>
                 )}
               </div>

            </div>
          )}





          {/* Parameters */}
          <div>
            {Object.entries(selectedEffectData.params).map(([key, param]) => (
              <div key={key} style={{ marginBottom: "8px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "3px",
                    fontSize: "11px",
                    fontFamily: "MS Sans Serif, sans-serif",
                  }}
                >
                  <span style={{ fontWeight: "bold", color: "var(--text-primary)" }}>{param.label}:</span>
                  <span
                    style={{
                      background: "var(--bg-input)",
                      border: "2px inset var(--bg-button)",
                      padding: "2px 6px",
                      minWidth: "35px",
                      textAlign: "center",
                      fontWeight: "bold",
                      color: "var(--text-primary)",
                    }}
                  >
                    {param.type === "color"
                      ? effectParams[key] || param.default
                      : effectParams[key] || param.default}
                  </span>
                </div>
                {param.type === "color" ? (
                  <input
                    type="color"
                    value={
                      (effectParams[key] as string) || (param.default as string)
                    }
                    onChange={(e) => handleParamChange(key, e.target.value)}
                    style={{
                      width: "100%",
                      height: "30px",
                      border: "2px inset var(--bg-button)",
                      cursor: "pointer",
                    }}
                  />
                ) : param.type === "select" ? (
                  <select
                    value={
                      (effectParams[key] as number) || (param.default as number)
                    }
                    onChange={(e) =>
                      handleParamChange(key, parseInt(e.target.value))
                    }
                    style={{
                      width: "100%",
                      height: "30px",
                      border: "2px inset var(--bg-button)",
                      background: "var(--bg-input)",
                      color: "var(--text-primary)",
                      fontSize: "11px",
                      padding: "2px 4px",
                      fontFamily: "MS Sans Serif, sans-serif",
                    }}
                  >
                    {param.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <>
                    <input
                      type="range"
                      min={param.min}
                      max={param.max}
                      value={
                        (effectParams[key] as number) ||
                        (param.default as number)
                      }
                      onChange={(e) =>
                        handleParamChange(key, parseInt(e.target.value))
                      }
                      className="win99-slider"
                      style={{ width: "100%" }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "10px",
                        color: "var(--text-secondary)",
                        marginTop: "2px",
                        fontFamily: "MS Sans Serif, sans-serif",
                      }}
                    >
                      <span>{param.min}</span>
                      <span>{param.max}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Preview Action Buttons */}
          <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
            <button
              onClick={handleApplyPreview}
              disabled={isProcessing}
              style={{
                flex: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                fontWeight: "bold",
                background: "var(--bg-button)",
                color: "var(--text-primary)",
                border: "2px outset var(--bg-button)",
                padding: "8px",
                opacity: isProcessing ? 0.5 : 1,
                fontSize: "11px",
                fontFamily: "MS Sans Serif, sans-serif",
                borderRadius: "0",
                cursor: "pointer",
              }}
            >
              <span>✓</span>
              <span>{isEditingLayer ? "Update" : "Apply"}</span>
            </button>
            <button
              onClick={() => {
                onCancelPreview();
                clearEffectSelection();
              }}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                background: "var(--bg-button)",
                color: "var(--text-primary)",
                border: "2px outset var(--bg-button)",
                padding: "8px",
                fontSize: "11px",
                fontFamily: "MS Sans Serif, sans-serif",
                borderRadius: "0",
                cursor: "pointer",
              }}
            >
              <span>✕</span>
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
