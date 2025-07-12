import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useIsMobile } from "./hooks/useIsMobile";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { ToolPanel } from "../components/ToolPanel";
import { EffectsPanel } from "../components/EffectsPanel";
import { HistoryPanel } from "../components/HistoryPanel";
import { LayerPanel } from "../components/LayerPanel";
import { Canvas } from "../components/Canvas";
import { Wallpaper } from "../components/Wallpaper";
import { ExportDialog } from "../components/ExportDialog";

// Enhanced History System with backward compatibility
interface HistoryItem {
  id: string;
  imageData: string;
  timestamp: number;
  effectName?: string;
  layerOrder?: number;
  
  // Enhanced tracking - new fields for robust history
  type?: 'base_image' | 'layer_effect' | 'layer_property' | 'layer_reorder' | 'layer_remove' | 'layer_add';
  description?: string;
  
  // Layer operation data
  layerData?: {
    id: string;
    imageData: string;
    name: string;
    visible: boolean;
    locked: boolean;
    opacity: number;
    blendMode: string;
    effectType?: string;
    effectParams?: Record<string, number | string>;
  };
  
  // For layer reordering
  reorderData?: {
    fromIndex: number;
    toIndex: number;
    layerId: string;
    layerName: string;
  };
  
  // For layer property changes
  propertyChanges?: {
    layerId: string;
    layerName: string;
    oldValues: Partial<Layer>;
    newValues: Partial<Layer>;
  };
  
  // For operations with parameters (crop, rotate, effects)
  operationParams?: Record<string, any>;
  
  // Complete state snapshot for complex operations
  stateSnapshot?: {
    baseImage: string;
    layers: Layer[];
  };
}

interface Layer {
  id: string;
  imageData: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: string;
  effectType?: string; // Store the original effect type for re-editing
  effectParams?: Record<string, number | string>; // Store the original parameters
}

function App() {
  const [baseImage, setBaseImage] = useState<string | null>(null); // Original uploaded image
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [currentTool, setCurrentTool] = useState<string>("upload");
  const [activeWindow, setActiveWindow] = useState<string>("main");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [compositeImage, setCompositeImage] = useState<string | null>(null);
  const [isCompositing, setIsCompositing] = useState(false);
  const [zoom, setZoom] = useState<number>(100);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false); // Default to light mode
  // Mobile detection and view management
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<"canvas" | "effects" | "layers" | "history">("canvas");

  // Preview mode state
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewEffectName, setPreviewEffectName] = useState<string>("");
  const [isEditingLayer, setIsEditingLayer] = useState(false);
  const [showHistoryPopout, setShowHistoryPopout] = useState(false);
  const [currentTooltip, setCurrentTooltip] = useState<string>("");
  const [isWindowMinimized, setIsWindowMinimized] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationType, setAnimationType] = useState<
    "minimize" | "restore" | "close" | null
  >(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isHistorySelecting, setIsHistorySelecting] = useState(false);

  // Enhanced History Management System
  const addHistoryItem = useCallback((historyItem: Partial<HistoryItem>) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      imageData: historyItem.imageData || baseImage || '',
      timestamp: Date.now(),
      type: historyItem.type || 'base_image',
      description: historyItem.description || 'Unknown operation',
      ...historyItem,
    };
    
    setHistory(prev => {
      // If we're not at the latest state, truncate history to create a new branch
      const truncatedHistory = currentHistoryIndex < prev.length - 1 
        ? prev.slice(0, currentHistoryIndex + 1)
        : prev;
      
      const newHistory = [...truncatedHistory, newItem];
      setCurrentHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
    return newItem;
  }, [baseImage, currentHistoryIndex]);

  const trackLayerReorder = useCallback((fromIndex: number, toIndex: number, layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    
    addHistoryItem({
      type: 'layer_reorder',
      description: `Moved "${layer.name}" from position ${fromIndex + 1} to ${toIndex + 1}`,
      reorderData: {
        fromIndex,
        toIndex,
        layerId,
        layerName: layer.name,
      },
      stateSnapshot: {
        baseImage: baseImage!,
        layers: [...layers],
      },
    });
  }, [layers, baseImage, addHistoryItem]);

  const trackLayerPropertyChange = useCallback((layerId: string, oldValues: Partial<Layer>, newValues: Partial<Layer>) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    
    const changes = Object.keys(newValues).map(key => {
      const k = key as keyof Layer;
      return `${key}: ${oldValues[k]} → ${newValues[k]}`;
    }).join(', ');
    
    addHistoryItem({
      type: 'layer_property',
      description: `Changed ${layer.name} properties: ${changes}`,
      propertyChanges: {
        layerId,
        layerName: layer.name,
        oldValues,
        newValues,
      },
      stateSnapshot: {
        baseImage: baseImage!,
        layers: [...layers],
      },
    });
  }, [layers, baseImage, addHistoryItem]);

  const trackLayerRemove = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    
    addHistoryItem({
      type: 'layer_remove',
      description: `Removed layer "${layer.name}"`,
      layerData: { ...layer },
      stateSnapshot: {
        baseImage: baseImage!,
        layers: [...layers],
      },
    });
  }, [layers, baseImage, addHistoryItem]);

  const trackLayerAdd = useCallback((layer: Layer) => {
    addHistoryItem({
      type: 'layer_add',
      description: `Added layer "${layer.name}"`,
      layerData: { ...layer },
      stateSnapshot: {
        baseImage: baseImage!,
        layers: [...layers],
      },
    });
  }, [layers, baseImage, addHistoryItem]);

  // Enhanced undo/redo functionality
  const canUndo = useMemo(() => currentHistoryIndex > 0, [currentHistoryIndex]);
  const canRedo = useMemo(() => currentHistoryIndex < history.length - 1, [currentHistoryIndex, history.length]);

  const performUndo = useCallback(() => {
    if (!canUndo) return;
    
    const previousIndex = currentHistoryIndex - 1;
    const targetItem = history[previousIndex];
    
    if (targetItem.stateSnapshot) {
      // Restore from complete state snapshot
      setBaseImage(targetItem.stateSnapshot.baseImage);
      setLayers(targetItem.stateSnapshot.layers);
    }
    
    setCurrentHistoryIndex(previousIndex);
  }, [canUndo, currentHistoryIndex, history]);

  const performRedo = useCallback(() => {
    if (!canRedo) return;
    
    const nextIndex = currentHistoryIndex + 1;
    const targetItem = history[nextIndex];
    
    if (targetItem.stateSnapshot) {
      // Restore from complete state snapshot
      setBaseImage(targetItem.stateSnapshot.baseImage);
      setLayers(targetItem.stateSnapshot.layers);
    }
    
    setCurrentHistoryIndex(nextIndex);
  }, [canRedo, currentHistoryIndex, history]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        performUndo();
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        performRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performUndo, performRedo]);

  // Update time every minute
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Apply theme to document body
  React.useEffect(() => {
    document.body.className = isDarkMode ? "dark-theme" : "light-theme";
  }, [isDarkMode]);

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Global keyboard shortcut handler
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Tool shortcuts (single keys)
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        switch (event.key.toLowerCase()) {
          case "v":
            event.preventDefault();
            setCurrentTool("select");
            break;
          case "h":
            event.preventDefault();
            setCurrentTool("move");
            break;
          case "c":
            event.preventDefault();
            setCurrentTool("crop");
            break;
          case "r":
            event.preventDefault();
            setCurrentTool("rotate");
            break;
          case "z":
            event.preventDefault();
            setCurrentTool("zoom");
            break;
          case "f":
            event.preventDefault();
            setCurrentTool("fit");
            break;
          case "1":
            event.preventDefault();
            setCurrentTool("actual");
            break;
          case "b":
            event.preventDefault();
            setCurrentTool("brush");
            break;
          case "e":
            event.preventDefault();
            setCurrentTool("eraser");
            break;
          case "t":
            event.preventDefault();
            setCurrentTool("text");
            break;
          case "g":
            event.preventDefault();
            setCurrentTool("fill");
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Composite layers when they change
  useEffect(() => {
    if (baseImage && !isPreviewMode) {
      compositeImageLayers();
    }
  }, [baseImage, layers, isPreviewMode]);

  const compositeImageLayers = async () => {
    if (!baseImage) return;

    const visibleLayers = layers.filter((layer) => layer.visible);
    if (visibleLayers.length === 0) {
      setCompositeImage(baseImage);
      return;
    }

    setIsCompositing(true);
    try {
      // Create composite canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Load base image first
      const baseImg = await loadImage(baseImage);
      canvas.width = baseImg.width;
      canvas.height = baseImg.height;

      // Draw base image
      ctx.drawImage(baseImg, 0, 0);

      // Composite each visible layer in reverse order (bottom to top rendering)
      // Layers at index 0 should render last (on top)
      for (let i = visibleLayers.length - 1; i >= 0; i--) {
        const layer = visibleLayers[i];
        const layerImg = await loadImage(layer.imageData);

        // Set layer opacity and blend mode
        ctx.globalAlpha = layer.opacity / 100;
        ctx.globalCompositeOperation =
          layer.blendMode as GlobalCompositeOperation;
        ctx.drawImage(layerImg, 0, 0);
      }

      // Export composite
      const compositeData = canvas.toDataURL("image/png", 1.0);
      setCompositeImage(compositeData);
    } catch (error) {
      console.error("Error compositing layers:", error);
      setCompositeImage(baseImage);
    } finally {
      setIsCompositing(false);
    }
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Layer selection handler
  const handleLayerSelect = useCallback(
    (layerId: string | null) => {
      setSelectedLayerId(layerId);

      // If we're currently in preview mode and switching layers, cancel preview
      if (isPreviewMode) {
        handleCancelPreview();
      }
    },
    [isPreviewMode]
  );

  // Start editing a selected layer
  const handleEditLayer = useCallback(
    (layerId: string) => {
      const layer = layers.find((l) => l.id === layerId);
      if (layer && layer.effectType) {
        setSelectedLayerId(layerId);
        setIsEditingLayer(true);
        setPreviewEffectName(layer.name);
        setIsPreviewMode(true);
        // The EffectsPanel will handle loading the layer's parameters
      }
    },
    [layers]
  );

  // Preview mode handlers
  const handleStartPreview = useCallback((effectName: string) => {
    setIsPreviewMode(true);
    setPreviewEffectName(effectName);
    setIsEditingLayer(false);
  }, []);

  const handleUpdatePreview = useCallback(
    (previewData: string, effectParams?: Record<string, number | string>) => {
      setPreviewImage(previewData);
      // Store the current effect parameters for when we apply the preview
      if (effectParams) {
        setCurrentEffectParams(effectParams);
      }
    },
    []
  );

  const [currentEffectParams, setCurrentEffectParams] = useState<
    Record<string, number | string>
  >({});

  const handleApplyPreview = useCallback(() => {
    if (previewImage && previewEffectName && baseImage) {
      if (isEditingLayer && selectedLayerId) {
        // Update existing layer
        setLayers((prev) =>
          prev.map((layer) =>
            layer.id === selectedLayerId
              ? {
                  ...layer,
                  imageData: previewImage,
                  effectParams: currentEffectParams,
                }
              : layer
          )
        );

        // Update corresponding history item
        setHistory((prev) =>
          prev.map((item) =>
            item.effectName === previewEffectName
              ? { ...item, imageData: previewImage, timestamp: Date.now() }
              : item
          )
        );
      } else {
        // Create new layer from the effect
        const newLayer: Layer = {
          id: Date.now().toString(),
          imageData: previewImage,
          name: previewEffectName,
          visible: true,
          locked: false,
          opacity: 100,
          blendMode: "normal",
          effectType: getEffectTypeFromName(previewEffectName),
          effectParams: currentEffectParams,
        };

        setLayers((prev) => [newLayer, ...prev]); // Add to beginning so it appears on top
        setSelectedLayerId(newLayer.id); // Auto-select the new layer

        // Add to history with proper tracking
        addHistoryItem({
          type: 'layer_effect',
          imageData: previewImage,
          effectName: previewEffectName,
          description: `Applied ${previewEffectName} effect`,
          layerData: { ...newLayer },
          operationParams: currentEffectParams,
          stateSnapshot: {
            baseImage: baseImage!,
            layers: [newLayer, ...layers],
          },
        });
      }
    }

    setIsPreviewMode(false);
    setPreviewImage(null);
    setPreviewEffectName("");
    setIsEditingLayer(false);
    setCurrentEffectParams({});
  }, [
    previewImage,
    previewEffectName,
    baseImage,
    isEditingLayer,
    selectedLayerId,
    currentEffectParams,
  ]);

  const handleCancelPreview = useCallback(() => {
    setIsPreviewMode(false);
    setPreviewImage(null);
    setPreviewEffectName("");
    setIsEditingLayer(false);
    setCurrentEffectParams({});
  }, []);

  // Helper function to get effect type from effect name
  const getEffectTypeFromName = (effectName: string): string => {
    if (effectName.includes("VHS")) return "vhs";
    if (effectName.includes("Glitch")) return "glitch";
    if (effectName.includes("Lo-Fi")) return "lofi";
    if (effectName.includes("Cyberpunk")) return "cyberpunk";
    if (effectName.includes("90s")) return "aol90s";
    if (effectName.includes("Film Grain")) return "filmgrain";
    if (effectName.includes("Sepia")) return "sepia";
    if (effectName.includes("Vintage")) return "vintage";
    if (effectName.includes("Neon")) return "neon";
    if (effectName.includes("Color Pop")) return "colorpop";
    if (effectName.includes("Insert Color")) return "color";
    if (effectName.includes("Black") || effectName.includes("White"))
      return "blackwhite";
    if (effectName.includes("Blur")) return "blur";
    if (effectName.includes("Sharpen")) return "sharpen";
    if (effectName.includes("Infrared")) return "infrared";
    if (effectName.includes("Thermal")) return "thermal";
    if (effectName.includes("Polaroid")) return "polaroid";
    if (effectName.includes("Cross")) return "crossprocess";
    if (effectName.includes("Emboss")) return "emboss";
    if (effectName.includes("Edge")) return "edgedetect";
    return "unknown";
  };

  // Handle direct image changes (like crop, rotate) - these modify the base image
  const handleImageChange = useCallback(
    (imageData: string, effectName: string) => {
      if (effectName === "Original") {
        // This is a new upload
        setBaseImage(imageData);
        setLayers([]);
        setSelectedLayerId(null);
        const firstHistoryItem: HistoryItem = {
          id: "original",
          type: 'base_image',
          imageData,
          timestamp: Date.now(),
          effectName: "Original",
          description: "Original image uploaded",
        };
        setHistory([firstHistoryItem]);
        setCurrentHistoryIndex(0);
      } else {
        // This is a base image modification (crop, rotate, etc.)
        setBaseImage(imageData);
        
        addHistoryItem({
          type: 'base_image',
          imageData,
          effectName,
          description: `${effectName} applied to base image`,
          stateSnapshot: {
            baseImage: imageData,
            layers: [...layers],
          },
        });
      }
    },
    [layers, addHistoryItem]
  );

  const handleHistoryItemSelect = useCallback(
    (item: HistoryItem) => {
      setIsHistorySelecting(true);
      
      const itemIndex = history.findIndex((h) => h.id === item.id);

      if (itemIndex === 0) {
        // Selected original - clear all layers and reset to original
        setLayers([]);
        setSelectedLayerId(null);
        setBaseImage(item.imageData);
      } else {
        // Rebuild the state up to the selected history point
        const historyUpToPoint = history.slice(0, itemIndex + 1);

        // Check if we have state snapshots for instant restoration
        if (item.stateSnapshot) {
          setBaseImage(item.stateSnapshot.baseImage);
          setLayers(item.stateSnapshot.layers);
          setSelectedLayerId(null);
        } else {
          // Fallback to reconstruction for older history items
          // Find the last base image modification in the history up to this point
          const baseImageHistory = historyUpToPoint.filter(
            (h) =>
              h.effectName === "Original" || 
              ["Cropped", "Rotated"].includes(h.effectName || "")
          );
          const lastBaseImage = baseImageHistory[baseImageHistory.length - 1];

          if (lastBaseImage && lastBaseImage.imageData) {
            setBaseImage(lastBaseImage.imageData);
          }

          // Rebuild layers from effects applied after the last base image modification
          const lastBaseImageIndex = historyUpToPoint.findIndex(
            (h) => h.id === lastBaseImage?.id
          );
          const effectsHistory = historyUpToPoint.slice(lastBaseImageIndex + 1);

          // Create layers from the effects in history
          const layerEffects = effectsHistory.filter(
            (h) => (h.type === 'layer_effect' || (h.effectName && !["Cropped", "Rotated", "Original"].includes(h.effectName)))
          );
          
          // Build layers array in correct order (newer effects on top)
          const newLayers: Layer[] = layerEffects.map((h, index) => ({
            id: h.layerData?.id || h.id,
            imageData: h.layerData?.imageData || h.imageData,
            name: h.layerData?.name || h.effectName || "Effect",
            visible: h.layerData?.visible ?? true,
            locked: h.layerData?.locked ?? false,
            opacity: h.layerData?.opacity ?? 100,
            blendMode: h.layerData?.blendMode || "normal",
            effectType: h.layerData?.effectType || getEffectTypeFromName(h.effectName || ""),
            effectParams: h.layerData?.effectParams || h.operationParams || {},
          })).reverse(); // Reverse to get newest on top

          setLayers(newLayers);
          setSelectedLayerId(null);
        }
      }

      // Set the current history index to the selected item
      setCurrentHistoryIndex(itemIndex);

      // On mobile, navigate back to canvas after selecting a history item
      if (isMobile && mobileView === "history") {
        setMobileView("canvas");
      }

      // Clear the loading state after a short delay
      setTimeout(() => {
        setIsHistorySelecting(false);
      }, 500);
    },
    [history, isMobile, mobileView]
  );



  const handleClearHistory = useCallback(() => {
    if (history.length > 1) {
      const original = history[0];
      setHistory([original]);
      setLayers([]);
      setSelectedLayerId(null);
      setBaseImage(original?.imageData || null);
    }
  }, [history]);

  // Layer management handlers
  const handleLayerUpdate = useCallback(
    (layerId: string, updates: Partial<Layer>) => {
      const currentLayer = layers.find(l => l.id === layerId);
      if (!currentLayer) return;
      
      // Extract old values for tracking
      const oldValues: Partial<Layer> = {};
      Object.keys(updates).forEach(key => {
        const k = key as keyof Layer;
        (oldValues as any)[k] = currentLayer[k];
      });
      
      // Track the property change
      trackLayerPropertyChange(layerId, oldValues, updates);
      
      setLayers((prev) =>
        prev.map((layer) =>
          layer.id === layerId ? { ...layer, ...updates } : layer
        )
      );
    },
    [layers, trackLayerPropertyChange]
  );

  const handleLayerRemove = useCallback(
    (layerId: string) => {
      const layer = layers.find((l) => l.id === layerId);

      if (layer) {
        // Track the removal
        trackLayerRemove(layerId);
        
        // Remove layer
        setLayers((prev) => prev.filter((l) => l.id !== layerId));

        // Clear selection if we're removing the selected layer
        if (selectedLayerId === layerId) {
          setSelectedLayerId(null);
        }

        // Remove corresponding history item
        setHistory((prev) =>
          prev.filter((item) => item.effectName !== layer.name)
        );
      }
    },
    [layers, selectedLayerId, trackLayerRemove]
  );

  const handleLayerReorder = useCallback(
    (dragIndex: number, dropIndex: number) => {
      const draggedLayer = layers[dragIndex];
      if (!draggedLayer) return;
      
      // Track the reorder operation
      trackLayerReorder(dragIndex, dropIndex, draggedLayer.id);
      
      setLayers((prev) => {
        const newLayers = [...prev];
        newLayers.splice(dragIndex, 1);
        newLayers.splice(dropIndex, 0, draggedLayer);
        return newLayers;
      });
    },
    [layers, trackLayerReorder]
  );

  const handleClearLayers = useCallback(() => {
    setLayers([]);
    setSelectedLayerId(null);

    // Keep only history items that are base image modifications
    setHistory((prev) =>
      prev.filter(
        (item) =>
          item.effectName === "Original" ||
          ["Cropped", "Rotated"].includes(item.effectName || "")
      )
    );
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleExport = useCallback(
    (exportedImageData: string, filename: string) => {
      const a = document.createElement("a");
      a.href = exportedImageData;
      a.download = filename;
      a.click();
    },
    []
  );

  const compositeImageData = useMemo(() => {
    // In preview mode, show the preview image
    if (isPreviewMode && previewImage) {
      return previewImage;
    }

    return compositeImage || baseImage;
  }, [compositeImage, baseImage, isPreviewMode, previewImage]);

  const selectedLayer = useMemo(() => {
    return selectedLayerId
      ? layers.find((l) => l.id === selectedLayerId) || null
      : null;
  }, [selectedLayerId, layers]);

  const toggleHistoryPopout = useCallback(() => {
    setShowHistoryPopout((prev) => !prev);
  }, []);

  const handleToolComplete = useCallback(() => {
    // Reset tool to default state after operation is complete
    setCurrentTool("upload");
  }, []);

  const effects = useMemo(() => {
    return Math.max(0, history.length - 1);
  }, [history]);

  // Window control handlers
  const handleMinimize = useCallback(() => {
    setIsAnimating(true);
    setAnimationType("minimize");
    // Enhanced minimize animation - slides down to taskbar
    setTimeout(() => {
      setIsWindowMinimized(true);
      setIsAnimating(false);
      setAnimationType(null);
    }, 400);
  }, []);

  const handleMaximize = useCallback(() => {
    // Only restore if the window is currently minimized
    if (isWindowMinimized) {
      setIsWindowMinimized(false);
      setIsAnimating(true);
      setAnimationType("restore");
      setTimeout(() => {
        setIsAnimating(false);
        setAnimationType(null);
      }, 400);
    }
  }, [isWindowMinimized]);

  const handleClose = useCallback(() => {
    setIsAnimating(true);
    setAnimationType("close");
    // Brief animation before redirect to donation page
    setTimeout(() => {
      window.open(
        "https://www.paypal.com/donate?hosted_button_id=C3JDWSB565U8G",
        "_blank"
      );
    }, 200);
  }, []);

  const handleRestore = useCallback(() => {
    setIsWindowMinimized(false);
    setIsAnimating(true);
    setAnimationType("restore");
    setTimeout(() => {
      setIsAnimating(false);
      setAnimationType(null);
    }, 400);
  }, []);

  return (
    <div className="win99-desktop">
      {/* Main Application Window */}
      <div
        className={`win99-app ${isAnimating ? "win99-animating" : ""}`}
        style={{
          animation:
            animationType === "minimize"
              ? "minimize-window 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards"
              : animationType === "restore"
              ? "restore-window 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards"
              : "none",
          transform:
            animationType === "close"
              ? "scale(0.8) rotateX(15deg)"
              : "scale(1) translateY(0)",
          opacity: animationType === "close" ? 0.8 : 1,
          transition:
            animationType === "close"
              ? "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
              : "none",
          transformOrigin: "center bottom",
          display: isWindowMinimized ? "none" : "flex",
          filter:
            isAnimating && animationType === "close" ? "blur(0.5px)" : "none",
        }}
      >
        {/* Title Bar */}
        <div className="win99-titlebar">
          <div className="win99-titlebar-text">
            <span>🎨</span>
            <span>Neo Dither</span>
          </div>
          <div className="win99-titlebar-buttons">
            <div
              className="win99-titlebar-button"
              onClick={handleMinimize}
              style={{ cursor: "pointer" }}
              title="Minimize"
            >
              _
            </div>
            <div
              className="win99-titlebar-button"
              onClick={handleMaximize}
              style={{
                cursor: isWindowMinimized ? "pointer" : "not-allowed",
                opacity: isWindowMinimized ? 1 : 0.5,
              }}
              title={isWindowMinimized ? "Restore" : "Maximize (disabled)"}
            >
              □
            </div>
            <div
              className="win99-titlebar-button"
              onClick={handleClose}
              style={{ cursor: "pointer" }}
              title="Close - Support Development (PayPal)"
            >
              ✕
            </div>
          </div>
        </div>

        {/* Application Content */}
        <div className="win99-app-content">
          {/* Top Toolbar - spans above all three panels */}
          <div className="win99-toolbar">
            <div className="win99-toolbar-content">
              <ToolPanel
                currentTool={currentTool}
                onToolChange={setCurrentTool}
                currentImage={compositeImageData}
                onImageUpload={(imageData) => {
                  handleImageChange(imageData, "Original");
                }}
                onTooltipChange={setCurrentTooltip}
                onSave={() => {
                  // Export: download project settings as JSON
                  const projectData = {
                    baseImage,
                    layers,
                    history,
                    timestamp: Date.now(),
                    version: "1.0",
                  };
                  const blob = new Blob(
                    [JSON.stringify(projectData, null, 2)],
                    { type: "application/json" }
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "glitch-project.json";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                onExport={() => {
                  // Open export dialog
                  if (compositeImageData) {
                    setShowExportDialog(true);
                  }
                }}
                onImport={() => {
                  // Import: load project settings from JSON file
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".json";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        try {
                          const projectData = JSON.parse(
                            ev.target?.result as string
                          );
                          if (projectData.baseImage) {
                            setBaseImage(projectData.baseImage);
                          }
                          if (projectData.layers) {
                            setLayers(projectData.layers);
                          }
                          if (projectData.history) {
                            setHistory(projectData.history);
                          }
                          setSelectedLayerId(null);
                          setCurrentTool("upload");
                        } catch (error) {
                          console.error("Error importing project:", error);
                          alert(
                            "Error importing project file. Please check the file format."
                          );
                        }
                      };
                      reader.readAsText(file);
                    }
                  };
                  input.click();
                }}
                onHistoryClick={toggleHistoryPopout}
                showHistoryPopout={showHistoryPopout}
                historyLength={history.length}
              />
            </div>
          </div>

          {/* Main Content Area - three panels below toolbar */}
          <div className="win99-main-content">
            {/* Left Sidebar - Effects (hidden on mobile) */}
            {!isMobile && (
            <div className="win99-effects-sidebar">
              <div className="win99-window">
                <div className="win99-titlebar">
                  <div className="win99-titlebar-text">
                    <span>✨</span>
                    <span>Effects Studio</span>
                    {selectedLayer && (
                      <span
                        style={{
                          background: "#4080ff",
                          color: "#ffffff",
                          padding: "1px 4px",
                          fontSize: "9px",
                          fontWeight: "bold",
                          borderRadius: "2px",
                          marginLeft: "4px",
                        }}
                      >
                        {selectedLayer.name}
                      </span>
                    )}
                  </div>
                  <div className="win99-titlebar-buttons">
                    <div
                      className="win99-titlebar-button"
                      style={{ cursor: "default", opacity: 0.3 }}
                      title="Minimize"
                    >
                      -
                    </div>
                    <div
                      className="win99-titlebar-button"
                      style={{ cursor: "default", opacity: 0.3 }}
                      title="Maximize"
                    >
                      □
                    </div>
                    <div
                      className="win99-titlebar-button"
                      style={{ cursor: "default", opacity: 0.3 }}
                      title="Close"
                    >
                      ×
                    </div>
                  </div>
                </div>
                <div className="win99-content win99-scrollbar">
                  <EffectsPanel
                    currentImage={
                      isEditingLayer ? baseImage : compositeImage || baseImage
                    }
                    selectedLayer={selectedLayer}
                    isEditingLayer={isEditingLayer}
                    onImageChange={handleImageChange}
                    isPreviewMode={isPreviewMode}
                    onStartPreview={handleStartPreview}
                    onUpdatePreview={handleUpdatePreview}
                    onApplyPreview={handleApplyPreview}
                    onCancelPreview={handleCancelPreview}
                    onEditLayer={handleEditLayer}
                  />
                </div>
              </div>
            </div>
            )}

            {/* Main Canvas Area */}
            <div className="win99-canvas-panel">
              <div className="win99-titlebar">
                <span>
                  📄 Canvas - {baseImage ? "Image Loaded" : "No Image"}
                </span>
                <div style={{ display: "flex", gap: "2px" }}>
                  <button className="win99-titlebar-button">-</button>
                  <button className="win99-titlebar-button">□</button>
                  <button className="win99-titlebar-button">×</button>
                </div>
              </div>
              <div className="win99-content">
                <div className="win99-canvas-area">
                  <Canvas
                    baseImage={baseImage}
                    compositeImage={compositeImage}
                    previewData={previewImage}
                    isPreviewMode={isPreviewMode}
                    currentTool={currentTool}
                    onImageChange={handleImageChange}
                    onToolComplete={handleToolComplete}
                    zoom={zoom}
                    setZoom={setZoom}
                  />
                </div>
              </div>
            </div>

            {/* Right Sidebar - Layers */}
            {!isMobile && (
            <div className="win99-layers-sidebar">
              <div className="win99-window">
                <div className="win99-titlebar">
                  <div className="win99-titlebar-text">
                    <span>🎭</span>
                    <span>Layers</span>
                    <span
                      style={{
                        background: "#e0e0e0",
                        color: "#000000",
                        padding: "1px 4px",
                        fontSize: "9px",
                        fontWeight: "bold",
                        borderRadius: "2px",
                        marginLeft: "4px",
                      }}
                    >
                      {layers.length}
                    </span>
                    {selectedLayer && (
                      <span
                        style={{
                          background: "#4080ff",
                          color: "#ffffff",
                          padding: "1px 4px",
                          fontSize: "9px",
                          fontWeight: "bold",
                          borderRadius: "2px",
                          marginLeft: "4px",
                        }}
                      >
                        #{layers.findIndex((l) => l.id === selectedLayerId) + 1}
                      </span>
                    )}
                  </div>
                </div>
                <div className="win99-content win99-scrollbar">
                  <LayerPanel
                    layers={layers}
                    selectedLayerId={selectedLayerId}
                    onLayerSelect={handleLayerSelect}
                    onLayerUpdate={handleLayerUpdate}
                    onLayerRemove={handleLayerRemove}
                    onLayerReorder={handleLayerReorder}
                    onClearLayers={handleClearLayers}
                    onEditLayer={handleEditLayer}
                  />
                </div>
              </div>
            </div>
            )}
          </div>
        </div>

        {/* Mobile Overlay Panels */}
        {isMobile && mobileView !== "canvas" && (
          <div
            className="win99-mobile-overlay"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: "64px", // leave space for nav
              zIndex: 1050,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Overlay title bar */}
            <div className="win99-titlebar">
              <div 
                className="win99-titlebar-text" 
                style={{ cursor: "pointer" }} 
                onClick={() => {
                  if (isPreviewMode) {
                    handleCancelPreview();
                  } else {
                    setMobileView("canvas");
                  }
                }}
              >
                {isPreviewMode ? "✕ Cancel" : "⬅️ Back"}
              </div>
            </div>
            <div className="win99-content win99-scrollbar" style={{ flex: 1 }}>
              {mobileView === "effects" && (
                <EffectsPanel
                  currentImage={isEditingLayer ? baseImage : compositeImage || baseImage}
                  selectedLayer={selectedLayer}
                  isEditingLayer={isEditingLayer}
                  onImageChange={handleImageChange}
                  isPreviewMode={isPreviewMode}
                  onStartPreview={handleStartPreview}
                  onUpdatePreview={handleUpdatePreview}
                  onApplyPreview={handleApplyPreview}
                  onCancelPreview={handleCancelPreview}
                  onEditLayer={handleEditLayer}
                  onNavigateToCanvas={isMobile ? () => setMobileView("canvas") : undefined}
                />
              )}

              {mobileView === "layers" && (
                <LayerPanel
                  layers={layers}
                  selectedLayerId={selectedLayerId}
                  onLayerSelect={handleLayerSelect}
                  onLayerUpdate={handleLayerUpdate}
                  onLayerRemove={handleLayerRemove}
                  onLayerReorder={handleLayerReorder}
                  onClearLayers={handleClearLayers}
                  onEditLayer={handleEditLayer}
                />
              )}

              {mobileView === "history" && (
                <HistoryPanel
                  history={history}
                  onHistoryItemSelect={handleHistoryItemSelect}
                  onClearHistory={handleClearHistory}
                  isSelecting={isHistorySelecting}
                  currentHistoryIndex={currentHistoryIndex}
                />
              )}
            </div>
          </div>
        )}

        {/* History Popout */}
        {!isMobile && showHistoryPopout && (
          <div
            className="win99-window"
            style={{
              position: "fixed",
              top: "120px",
              left: "340px",
              width: "320px",
              height: "450px",
              zIndex: 1000,
            }}
          >
            <div className="win99-titlebar">
              <div className="win99-titlebar-text">
                <span>📜</span>
                <span>History</span>
                <span
                  style={{
                    background: "#4080ff",
                    color: "#ffffff",
                    padding: "1px 4px",
                    fontSize: "8px",
                    fontWeight: "bold",
                    borderRadius: "2px",
                    marginLeft: "4px",
                  }}
                >
                  {history.length} states
                </span>
              </div>
              <div className="win99-titlebar-buttons">
                <div
                  className="win99-titlebar-button"
                  onClick={toggleHistoryPopout}
                  style={{ cursor: "pointer" }}
                >
                  ✕
                </div>
              </div>
            </div>
            <div
              className="win99-content win99-scrollbar"
              style={{ height: "calc(100% - 24px)" }}
            >
              <HistoryPanel
                history={history}
                onHistoryItemSelect={handleHistoryItemSelect}
                onClearHistory={handleClearHistory}
                isSelecting={isHistorySelecting}
                currentHistoryIndex={currentHistoryIndex}
              />
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="win99-statusbar">
          <div className="win99-statusbar-section">
            ⚡ {effects} effects • 🎭 {layers.length} layers • 📜{" "}
            {history.length} states •{" "}
            {compositeImageData ? "🖼️ Image Loaded" : "❌ No Image"} • 🔧 Tool:{" "}
            {currentTool}
          </div>
          <div className="win99-statusbar-section win99-statusbar-tooltip">
            {currentTooltip ? `💡 ${currentTooltip}` : ""}
          </div>
          <div className="win99-statusbar-section">
            <span
              style={{
                cursor: "pointer",
                textDecoration: "underline",
                marginRight: "12px",
              }}
              onClick={toggleTheme}
              title={`Switch to ${isDarkMode ? "Light" : "Dark"} Mode`}
            >
              {isDarkMode ? "🌙" : "☀️"} {isDarkMode ? "Dark" : "Light"}
            </span>
            <span
              style={{
                cursor: "pointer",
                textDecoration: "underline",
                marginRight: "12px",
              }}
              onClick={() => window.open("https://davidroyal.dev", "_blank")}
              title="Visit davidroyal.dev"
            >
              🌐 davidroyal.dev
            </span>
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>

      {/* Wallpaper - shown when window is minimized */}
      {isWindowMinimized && <Wallpaper onRestore={handleRestore} />}

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        imageData={compositeImageData || ""}
        onExport={handleExport}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        active={mobileView}
        onChange={(view) => setMobileView(view)}
        onExport={() => {
          if (compositeImageData) setShowExportDialog(true);
        }}
        hasImage={!!compositeImageData}
        historyCount={history.length}
      />
    </div>
  );
}

export default App;
