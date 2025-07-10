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
        description: "Retro VHS distortion",
        params: {
          distortion: { min: 0, max: 100, default: 30, label: "Distortion" },
          noise: { min: 0, max: 100, default: 25, label: "Static Noise" },
          scanlines: { min: 0, max: 100, default: 40, label: "Scanlines" },
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
        },
      },
      {
        id: "snes",
        name: "Super Nintendo",
        icon: "🎯",
        description: "16-bit Nintendo smoothness",
        params: {
          softness: { min: 0, max: 60, default: 40, label: "Softness" },
          colorBoost: {
            min: 100,
            max: 150,
            default: 115,
            label: "Color Boost",
          },
          brightness: { min: 90, max: 130, default: 110, label: "Brightness" },
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
          intensity: { min: 0, max: 100, default: 50, label: "Intensity" },
          blockSize: { min: 1, max: 50, default: 10, label: "Block Size" },
          colorShift: { min: 0, max: 100, default: 30, label: "Color Shift" },
        },
      },
      {
        id: "cyberpunk",
        name: "Cyberpunk Neon",
        icon: "🤖",
        description: "Futuristic neon glow",
        params: {
          neonGlow: { min: 0, max: 100, default: 70, label: "Neon Glow" },
          contrast: { min: 0, max: 200, default: 120, label: "Contrast" },
          saturation: { min: 0, max: 200, default: 150, label: "Saturation" },
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
          scanlines: { min: 0, max: 60, default: 40, label: "Scanlines" },
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
          age: { min: 0, max: 100, default: 50, label: "Age" },
          warmth: { min: 0, max: 100, default: 40, label: "Warmth" },
          grain: { min: 0, max: 100, default: 30, label: "Grain" },
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
          intensity: { min: 0, max: 100, default: 40, label: "Intensity" },
          size: { min: 1, max: 10, default: 3, label: "Grain Size" },
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
          contrast: { min: 0, max: 200, default: 100, label: "Contrast" },
          brightness: { min: 0, max: 200, default: 100, label: "Brightness" },
        },
      },
      {
        id: "infrared",
        name: "Infrared",
        icon: "🌡️",
        description: "Infrared camera effect",
        params: {
          intensity: { min: 0, max: 100, default: 70, label: "Intensity" },
          colorShift: { min: 0, max: 100, default: 50, label: "Color Shift" },
        },
      },
      {
        id: "thermal",
        name: "Thermal",
        icon: "🔥",
        description: "Thermal imaging effect",
        params: {
          intensity: { min: 0, max: 100, default: 60, label: "Intensity" },
          colorMap: { min: 0, max: 5, default: 2, label: "Color Map" },
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
        padding: "6px",
        gap: "8px",
      }}
    >
      {/* Error Display */}
      {error && (
        <div
          className="win99-sunken"
          style={{
            padding: "6px",
            background: "var(--bg-input)",
            border: "1px solid var(--border-sunken)",
            fontSize: "10px",
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Search and Filter Section */}
      <div
        className="win99-sunken"
        style={{
          padding: "6px",
          background: "var(--bg-input)",
          border: "1px solid var(--border-window)",
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
                fontSize: "10px",
                border: "none",
                background: "transparent",
                outline: "none",
                color: "var(--text-primary)",
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{
                  position: "absolute",
                  right: "2px",
                  top: "2px",
                  background: "none",
                  border: "none",
                  fontSize: "8px",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  padding: "2px",
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
            gap: "2px",
            opacity: searchTerm ? 0.6 : 1,
          }}
        >
          {/* All Effects Button */}
          <button
            className={`win99-button ${
              selectedCategory === "all" ? "active" : ""
            }`}
            onClick={() => {
              setSelectedCategory("all");
              if (searchTerm) setSearchTerm(""); // Clear search when clicking category
            }}
            style={{
              flex: "1",
              minWidth: "60px",
              padding: "3px 2px",
              fontSize: "8px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "2px",
              background:
                selectedCategory === "all"
                  ? "var(--bg-button-pressed)"
                  : "var(--bg-button)",
              color:
                selectedCategory === "all"
                  ? "var(--text-titlebar)"
                  : "var(--text-primary)",
              border: `1px solid ${
                selectedCategory === "all"
                  ? "var(--border-raised)"
                  : "var(--border-window)"
              }`,
              opacity: isPreviewMode ? 0.7 : 1,
              cursor: searchTerm ? "pointer" : "default",
            }}
            disabled={isPreviewMode}
            title={searchTerm ? "Show all effects" : "All effects"}
          >
            <span style={{ fontSize: "10px" }}>✨</span>
            <span>All</span>
          </button>

          {Object.entries(EFFECT_CATEGORIES).map(([key, category]) => (
            <button
              key={key}
              className={`win99-button ${
                selectedCategory === key ? "active" : ""
              }`}
              onClick={() => {
                setSelectedCategory(key);
                if (searchTerm) setSearchTerm(""); // Clear search when clicking category
              }}
              style={{
                flex: "1",
                minWidth: "60px",
                padding: "3px 2px",
                fontSize: "8px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
                background:
                  selectedCategory === key
                    ? "var(--bg-button-pressed)"
                    : "var(--bg-button)",
                color:
                  selectedCategory === key
                    ? "var(--text-titlebar)"
                    : "var(--text-primary)",
                border: `1px solid ${
                  selectedCategory === key
                    ? "var(--border-raised)"
                    : "var(--border-window)"
                }`,
                opacity: isPreviewMode ? 0.7 : 1,
                cursor: searchTerm ? "pointer" : "default",
              }}
              disabled={isPreviewMode}
              title={searchTerm ? `Switch to ${category.name}` : category.name}
            >
              <span style={{ fontSize: "10px" }}>{category.icon}</span>
              <span>{category.name.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Layer Info */}
      {selectedLayer && !isPreviewMode && (
        <div
          className="win99-sunken"
          style={{
            padding: "6px",
            background: "var(--bg-input)",
            border: "1px solid var(--border-window)",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontWeight: "bold",
              color: "var(--text-primary)",
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>📍</span>
            <span>{selectedLayer.name}</span>
          </div>

          {selectedLayer.effectType ? (
            <button
              className="win99-button"
              onClick={handleEditSelectedLayer}
              style={{
                width: "100%",
                fontSize: "9px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                background: "var(--bg-button-hover)",
                fontWeight: "bold",
                padding: "4px",
              }}
            >
              <span>🔧</span>
              <span>Edit Effect</span>
            </button>
          ) : (
            <div
              style={{
                fontSize: "9px",
                color: "var(--text-secondary)",
                fontStyle: "italic",
                textAlign: "center",
                padding: "4px",
              }}
            >
              Cannot edit this layer
            </div>
          )}
        </div>
      )}

      {/* Effect Buttons Grid */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Search Results Counter */}
        {searchTerm && (
          <div
            style={{
              fontSize: "9px",
              color: "var(--text-secondary)",
              marginBottom: "4px",
              textAlign: "center",
              fontStyle: "italic",
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
                className={`win99-button ${
                  selectedEffect === effect.id ? "active" : ""
                }`}
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
                  padding: "6px 4px",
                  gap: "3px",
                  minHeight: "50px",
                  fontSize: "8px",
                  opacity: !currentImage || isPreviewMode ? 0.5 : 1,
                  cursor:
                    !currentImage || isPreviewMode ? "not-allowed" : "pointer",
                  background:
                    selectedEffect === effect.id
                      ? "var(--bg-button-active)"
                      : "var(--bg-button)",
                  border: `2px outset var(--border-window)`,
                  position: "relative",
                  boxShadow:
                    selectedEffect === effect.id
                      ? "inset 1px 1px var(--border-sunken), inset -1px -1px var(--border-raised)"
                      : "none",
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
          className="win99-sunken"
          style={{
            padding: "8px",
            background: "var(--bg-input)",
            border: "1px solid var(--border-window)",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: "bold",
              marginBottom: "8px",
              color: "var(--text-primary)",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}
          >
            <span>{selectedEffectData.icon}</span>
            <span>{selectedEffectData.name}</span>
            {isEditingLayer && (
              <span
                style={{
                  background: "var(--bg-button-hover)",
                  color: "var(--text-primary)",
                  padding: "1px 4px",
                  fontSize: "8px",
                  borderRadius: "2px",
                }}
              >
                EDIT
              </span>
            )}
          </div>

          {/* Mobile Preview Thumbnail */}
          {isMobile && (currentImage || processedImagePreview) && (
            <div
              style={{
                marginBottom: "12px",
                padding: "8px",
                background: "var(--bg-content)",
                border: "2px inset var(--border-window)",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: "bold",
                  marginBottom: "6px",
                  color: "var(--text-primary)",
                  textAlign: "center",
                }}
              >
                Preview
              </div>
                                            {/* Large Preview with Overlay Toggle */}
               <div style={{ textAlign: "center", position: "relative", display: "inline-block" }}>
                 {/* Large Preview Image */}
                 {processedImagePreview ? (
                   <>
                     <img
                       src={showOriginal ? currentImage! : processedImagePreview}
                       alt={showOriginal ? "Original" : "Preview"}
                       style={{
                         width: "100%",
                         height: "auto",
                         objectFit: "contain",
                         border: "2px inset var(--border-window)",
                         display: "block",
                         margin: "0 auto",
                       }}
                     />
                     
                     {/* Overlay Toggle Button */}
                     <button
                       className="win99-button"
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
                         background: "rgba(192, 192, 192, 0.9)",
                         border: "1px outset var(--border-window)",
                         opacity: isProcessing ? 0.7 : 1,
                         cursor: "pointer",
                         display: "flex",
                         alignItems: "center",
                         justifyContent: "center",
                         borderRadius: "0",
                         boxShadow: "1px 1px 2px rgba(0, 0, 0, 0.3)",
                       }}
                       title={showOriginal ? "Show effect" : "Show original"}
                                            >
                         {showOriginal ? "👁️" : "🚫"}
                       </button>
                   </>
                 ) : (
                   <div
                     style={{
                       width: "100%",
                       height: "200px",
                       border: "2px inset var(--border-window)",
                       display: "flex",
                       alignItems: "center",
                       justifyContent: "center",
                       background: "var(--bg-input)",
                       color: "var(--text-secondary)",
                       fontSize: "12px",
                       margin: "0 auto",
                       flexDirection: "column",
                       gap: "8px",
                     }}
                   >
                     <div>{isProcessing ? "⏳" : "🎨"}</div>
                     <div>{isProcessing ? "Processing..." : "Loading Preview..."}</div>
                   </div>
                 )}
               </div>

            </div>
          )}

          {/* Effect Toggle Button - Hidden on Mobile */}
          {!isMobile && processedImagePreview && (
            <div
              style={{
                display: "flex",
                gap: "4px",
                marginBottom: "8px",
                alignItems: "center",
              }}
            >
              <button
                className="win99-button"
                onClick={handleComparisonToggle}
                disabled={isProcessing}
                style={{
                  flex: 1,
                  fontSize: "9px",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "2px",
                  background: showOriginal
                    ? "var(--bg-button)"
                    : "var(--bg-button-active)",
                  fontWeight: "bold",
                  opacity: isProcessing ? 0.7 : 1,
                }}
              >
                {isProcessing ? (
                  <>
                    <span>⏳</span>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{showOriginal ? "✅" : "❌"}</span>
                    <span>{showOriginal ? "Show Effect" : "Hide Effect"}</span>
                  </>
                )}
              </button>
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
                    fontSize: "10px",
                  }}
                >
                  <span style={{ fontWeight: "bold" }}>{param.label}:</span>
                  <span
                    style={{
                      background: "var(--bg-content)",
                      border: "1px inset var(--border-window)",
                      padding: "2px 6px",
                      minWidth: "35px",
                      textAlign: "center",
                      fontWeight: "bold",
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
                      border: "1px inset var(--border-window)",
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
                      border: "1px inset var(--border-window)",
                      background: "var(--bg-content)",
                      color: "var(--text-primary)",
                      fontSize: "10px",
                      padding: "2px 4px",
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
                        fontSize: "9px",
                        color: "var(--text-secondary)",
                        marginTop: "2px",
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
              className="win99-button effects-apply-btn"
              onClick={handleApplyPreview}
              disabled={isProcessing}
              style={{
                flex: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                fontWeight: "bold",
                background: "var(--bg-button-active)",
                color: "var(--text-primary)",
                border: "2px outset var(--border-raised)",
                padding: "6px",
                opacity: isProcessing ? 0.5 : 1,
              }}
            >
              <span>✓</span>
              <span>{isEditingLayer ? "Update" : "Apply"}</span>
            </button>
            <button
              className="win99-button effects-cancel-btn"
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
                border: "2px outset var(--border-raised)",
                padding: "6px",
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
