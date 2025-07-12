import React, { useState, useEffect, useRef } from "react";
import { upscaleImage, isUpscaling } from "../src/utils/effects";
import { useIsMobile } from "../src/hooks/useIsMobile";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageData: string;
  onExport: (exportedImageData: string, filename: string) => void;
}

interface ExportSettings {
  format: "png" | "jpeg" | "webp";
  quality: number;
  width: number;
  height: number;
  targetFileSizeKB: number;
  maintainAspectRatio: boolean;
  useTargetFileSize: boolean;
  useAIEnhancement: boolean;
  upscalingMethod: "bilinear" | "bicubic" | "lanczos" | "ai";
}

interface ZoomPanState {
  zoom: number;
  panX: number;
  panY: number;
  isDragging: boolean;
  lastMouseX: number;
  lastMouseY: number;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  imageData,
  onExport,
}) => {
  const [originalDimensions, setOriginalDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [settings, setSettings] = useState<ExportSettings>({
    format: "png",
    quality: 92,
    width: 0,
    height: 0,
    targetFileSizeKB: 50,
    maintainAspectRatio: true,
    useTargetFileSize: false,
    useAIEnhancement: false,
    upscalingMethod: "bicubic",
  });
  const [previewData, setPreviewData] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [baselineFileSize, setBaselineFileSize] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [zoomPan, setZoomPan] = useState<ZoomPanState>({
    zoom: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
  });
  const [lastTouchDistance, setLastTouchDistance] = useState<number>(0);
  const [widthInput, setWidthInput] = useState<string>("");
  const [heightInput, setHeightInput] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Load original image dimensions
  useEffect(() => {
    if (imageData && isOpen) {
      const img = new Image();
      img.onload = () => {
        const newDimensions = { width: img.width, height: img.height };
        setOriginalDimensions(newDimensions);
        setSettings((prev) => ({
          ...prev,
          width: newDimensions.width,
          height: newDimensions.height,
        }));
        setWidthInput(newDimensions.width.toString());
        setHeightInput(newDimensions.height.toString());
      };
      img.src = imageData;
    }
  }, [imageData, isOpen]);

  // Reset zoom/pan when dialog opens
  useEffect(() => {
    if (isOpen) {
      setZoomPan({
        zoom: 1,
        panX: 0,
        panY: 0,
        isDragging: false,
        lastMouseX: 0,
        lastMouseY: 0,
      });
    }
  }, [isOpen]);

  // Generate preview when settings change
  useEffect(() => {
    if (isOpen && originalDimensions.width > 0) {
      generatePreview();
    }
  }, [settings, originalDimensions, isOpen]);

  // Adjust target file size when baseline file size changes
  useEffect(() => {
    if (baselineFileSize > 0 && settings.targetFileSizeKB > baselineFileSize) {
      setSettings(prev => ({
        ...prev,
        targetFileSizeKB: Math.max(Math.min(baselineFileSize, prev.targetFileSizeKB), 1)
      }));
    }
  }, [baselineFileSize]);

  const generatePreview = async () => {
    if (!imageData || !canvasRef.current) return;

    setIsProcessing(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.onload = async () => {
        // Check if we need upscaling
        const needsUpscaling = isUpscaling(
          originalDimensions.width,
          originalDimensions.height,
          settings.width,
          settings.height
        );

        let processedImageData = imageData;

        // Apply enhanced upscaling if needed and enabled
        if (needsUpscaling && settings.useAIEnhancement) {
          setIsAIProcessing(true);
          try {
            processedImageData = await upscaleImage(
              imageData,
              settings.width,
              settings.height,
              settings.upscalingMethod
            );
          } catch (error) {
            console.error("Error during AI upscaling:", error);
            // Fall back to regular resizing
          } finally {
            setIsAIProcessing(false);
          }
        }

        // Set canvas size
        canvas.width = settings.width;
        canvas.height = settings.height;

        // Draw the processed image
        const processedImg = new Image();
        processedImg.onload = async () => {
          ctx.drawImage(processedImg, 0, 0, settings.width, settings.height);

          // Get image data based on format
          let mimeType = "image/png";
          let baselineQuality = settings.quality / 100;

          switch (settings.format) {
            case "jpeg":
              mimeType = "image/jpeg";
              break;
            case "webp":
              mimeType = "image/webp";
              break;
            case "png":
            default:
              mimeType = "image/png";
              baselineQuality = 1.0;
              break;
          }

          // First, calculate baseline file size without target compression
          const baselineData = canvas.toDataURL(mimeType, baselineQuality);
          const baselineBase64Length = baselineData.length - `data:${mimeType};base64,`.length;
          const baselineSizeBytes = (baselineBase64Length * 3) / 4;
          const baselineSizeKB = Math.round(baselineSizeBytes / 1024);
          setBaselineFileSize(baselineSizeKB);

          let finalQuality = baselineQuality;
          let resultData = baselineData;

          // If target file size is enabled and format supports compression
          if (
            settings.useTargetFileSize &&
            (settings.format === "jpeg" || settings.format === "webp")
          ) {
            finalQuality = await findOptimalQuality(
              canvas,
              mimeType,
              settings.targetFileSizeKB
            );
            resultData = canvas.toDataURL(mimeType, finalQuality);
          }

          setPreviewData(resultData);

          // Calculate final file size (rough estimate)
          const base64Length =
            resultData.length - `data:${mimeType};base64,`.length;
          const sizeInBytes = (base64Length * 3) / 4;
          setFileSize(Math.round(sizeInBytes / 1024));

          setIsProcessing(false);
        };

        processedImg.src = processedImageData;
      };

      img.src = imageData;
    } catch (error) {
      console.error("Error generating preview:", error);
      setIsProcessing(false);
    }
  };

  const findOptimalQuality = async (
    canvas: HTMLCanvasElement,
    mimeType: string,
    targetKB: number
  ): Promise<number> => {
    let minQuality = 0.01; // Go as low as 1% quality for extreme compression
    let maxQuality = 1.0;
    let bestQuality = 0.01;
    let bestSize = Infinity;
    let closestQuality = 0.01;

    // More iterations for better precision, especially for very small targets
    for (let i = 0; i < 20; i++) {
      const testQuality = (minQuality + maxQuality) / 2;
      const testData = canvas.toDataURL(mimeType, testQuality);
      const base64Length = testData.length - `data:${mimeType};base64,`.length;
      const sizeKB = (base64Length * 3) / 4 / 1024;

      // Track the quality that gets us closest to target (not just under)
      const sizeDiff = Math.abs(sizeKB - targetKB);
      if (sizeDiff < bestSize) {
        bestSize = sizeDiff;
        closestQuality = testQuality;
      }

      if (sizeKB <= targetKB) {
        bestQuality = testQuality;
        minQuality = testQuality;
      } else {
        maxQuality = testQuality;
      }
    }

    // If we can't get under the target, use the quality that gets closest
    if (bestQuality === 0.01 && bestSize > targetKB * 0.1) {
      return closestQuality;
    }

    // For very small targets, try even more aggressive compression
    if (targetKB <= 10) {
      // Test extremely low qualities for tiny file sizes
      const extremeQualities = [0.005, 0.01, 0.02, 0.03, 0.05];
      let bestExtremeQuality = bestQuality;
      
      for (const quality of extremeQualities) {
        const testData = canvas.toDataURL(mimeType, quality);
        const base64Length = testData.length - `data:${mimeType};base64,`.length;
        const sizeKB = (base64Length * 3) / 4 / 1024;
        
        if (sizeKB <= targetKB) {
          bestExtremeQuality = quality;
        } else {
          break; // Stop when we exceed target
        }
      }
      
      return bestExtremeQuality;
    }

    return bestQuality;
  };

  const handleDimensionChange = (
    dimension: "width" | "height",
    value: string
  ) => {
    if (dimension === "width") {
      setWidthInput(value);
    } else {
      setHeightInput(value);
    }

    const numValue = value === "" ? 0 : parseInt(value) || 0;
    
    if (settings.maintainAspectRatio && originalDimensions.width > 0) {
      const aspectRatio = originalDimensions.width / originalDimensions.height;

      if (dimension === "width") {
        const newHeight = numValue === 0 ? 0 : Math.round(numValue / aspectRatio);
        setSettings((prev) => ({
          ...prev,
          width: numValue,
          height: newHeight,
        }));
        setHeightInput(newHeight.toString());
      } else {
        const newWidth = numValue === 0 ? 0 : Math.round(numValue * aspectRatio);
        setSettings((prev) => ({
          ...prev,
          width: newWidth,
          height: numValue,
        }));
        setWidthInput(newWidth.toString());
      }
    } else {
      setSettings((prev) => ({
        ...prev,
        [dimension]: numValue,
      }));
    }
  };

  const handleExport = () => {
    if (previewData) {
      const filename = `glitch-image.${settings.format}`;
      onExport(previewData, filename);
      onClose();
    }
  };

  const resetToOriginal = () => {
    setSettings((prev) => ({
      ...prev,
      width: originalDimensions.width,
      height: originalDimensions.height,
    }));
    setWidthInput(originalDimensions.width.toString());
    setHeightInput(originalDimensions.height.toString());
  };

  // Zoom and pan handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const container = previewContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, zoomPan.zoom * zoomDelta));
    
    setZoomPan(prev => ({
      ...prev,
      zoom: newZoom,
      panX: centerX - (centerX - prev.panX) * (newZoom / prev.zoom),
      panY: centerY - (centerY - prev.panY) * (newZoom / prev.zoom),
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setZoomPan(prev => ({
      ...prev,
      isDragging: true,
      lastMouseX: e.clientX,
      lastMouseY: e.clientY,
    }));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!zoomPan.isDragging) return;
    
    const deltaX = e.clientX - zoomPan.lastMouseX;
    const deltaY = e.clientY - zoomPan.lastMouseY;
    
    setZoomPan(prev => ({
      ...prev,
      panX: prev.panX + deltaX,
      panY: prev.panY + deltaY,
      lastMouseX: e.clientX,
      lastMouseY: e.clientY,
    }));
  };

  const handleMouseUp = () => {
    setZoomPan(prev => ({
      ...prev,
      isDragging: false,
    }));
  };

  // Helper function to get distance between two touch points
  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1) {
      // Single touch - start panning
      const touch = e.touches[0];
      setZoomPan(prev => ({
        ...prev,
        isDragging: true,
        lastMouseX: touch.clientX,
        lastMouseY: touch.clientY,
      }));
    } else if (e.touches.length === 2) {
      // Two touches - start pinch-to-zoom
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      setLastTouchDistance(distance);
      setZoomPan(prev => ({
        ...prev,
        isDragging: false, // Stop panning when pinching
      }));
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 1 && zoomPan.isDragging) {
      // Single touch - handle panning
      const touch = e.touches[0];
      const deltaX = touch.clientX - zoomPan.lastMouseX;
      const deltaY = touch.clientY - zoomPan.lastMouseY;
      
      setZoomPan(prev => ({
        ...prev,
        panX: prev.panX + deltaX,
        panY: prev.panY + deltaY,
        lastMouseX: touch.clientX,
        lastMouseY: touch.clientY,
      }));
    } else if (e.touches.length === 2 && lastTouchDistance > 0) {
      // Two touches - handle pinch-to-zoom
      const container = previewContainerRef.current;
      if (!container) return;

      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / lastTouchDistance;
      
      // Calculate center point between the two touches
      const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      
      // Convert to relative coordinates within the container
      const rect = container.getBoundingClientRect();
      const relativeX = centerX - rect.left;
      const relativeY = centerY - rect.top;
      
      setZoomPan(prev => {
        const newZoom = Math.max(0.1, Math.min(5, prev.zoom * scale));
        return {
          ...prev,
          zoom: newZoom,
          panX: relativeX - (relativeX - prev.panX) * (newZoom / prev.zoom),
          panY: relativeY - (relativeY - prev.panY) * (newZoom / prev.zoom),
        };
      });
      
      setLastTouchDistance(currentDistance);
    }
  };

  const handleTouchEnd = () => {
    setZoomPan(prev => ({
      ...prev,
      isDragging: false,
    }));
    setLastTouchDistance(0);
  };

  const resetZoomPan = () => {
    setZoomPan(prev => ({
      ...prev,
      zoom: 1,
      panX: 0,
      panY: 0,
    }));
  };

  const zoomIn = () => {
    setZoomPan(prev => ({
      ...prev,
      zoom: Math.min(5, prev.zoom * 1.25),
    }));
  };

  const zoomOut = () => {
    setZoomPan(prev => ({
      ...prev,
      zoom: Math.max(0.1, prev.zoom / 1.25),
    }));
  };

  const presetSizes = [
    { name: "Instagram Square", width: 1080, height: 1080 },
    { name: "Instagram Story", width: 1080, height: 1920 },
    { name: "Twitter Post", width: 1200, height: 675 },
    { name: "Facebook Cover", width: 1200, height: 630 },
    { name: "HD (720p)", width: 1280, height: 720 },
    { name: "Full HD (1080p)", width: 1920, height: 1080 },
  ];

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "10px",
      }}
      onClick={onClose}
    >
      <div
        className="win99-window"
        style={{
          width: "100%",
          maxWidth: isMobile ? "100%" : "900px",
          height: isMobile ? "100%" : "auto",
          maxHeight: isMobile ? "100%" : "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="win99-titlebar">
          <div className="win99-titlebar-text">
            <span>💾</span>
            <span>Export Image</span>
          </div>
          <div className="win99-titlebar-buttons">
            <div className="win99-titlebar-button" onClick={onClose}>
              ✕
            </div>
          </div>
        </div>

        <div
          className="win99-content"
          style={{
            flex: 1,
            padding: isMobile ? "8px" : "12px",
            overflow: "hidden",
            display: isMobile ? "flex" : "grid",
            flexDirection: isMobile ? "column" : undefined,
            gridTemplateColumns: isMobile ? undefined : "220px 1fr",
            gridTemplateRows: isMobile ? undefined : "1fr auto",
            gap: isMobile ? "8px" : "12px",
            minHeight: 0,
          }}
        >
          {/* Settings Panel */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "column",
              gap: isMobile ? "8px" : "8px",
              gridColumn: isMobile ? undefined : "1",
              gridRow: isMobile ? undefined : "1",
              overflow: isMobile ? "auto" : "hidden",
              flex: isMobile ? "0 0 auto" : undefined,
              maxHeight: isMobile ? "40vh" : undefined,
            }}
          >
            {/* Format Selection */}
            <div
              className="win99-panel"
              style={{
                padding: isMobile ? "8px" : "10px",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "8px",
                  fontSize: isMobile ? "12px" : "11px",
                }}
              >
                Format
              </div>
              <div
                style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: "6px" }}
              >
                {(["png", "jpeg", "webp"] as const).map((format) => (
                  <label
                    key={format}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      whiteSpace: "nowrap",
                      flex: isMobile ? "1" : "0 0 auto",
                    }}
                  >
                    <input
                      type="radio"
                      checked={settings.format === format}
                      onChange={() =>
                        setSettings((prev) => ({ ...prev, format }))
                      }
                    />
                    <span
                      style={{ fontSize: isMobile ? "11px" : "10px", textTransform: "uppercase" }}
                    >
                      {format}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Quality/File Size Controls */}
            {(settings.format === "jpeg" || settings.format === "webp") && (
              <div
                className="win99-panel"
                style={{
                  padding: isMobile ? "8px" : "10px",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "8px",
                    fontSize: isMobile ? "12px" : "11px",
                  }}
                >
                  Quality
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "8px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={settings.useTargetFileSize}
                    disabled={baselineFileSize === 0}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        useTargetFileSize: e.target.checked,
                      }))
                    }
                  />
                  <span style={{ 
                    fontSize: isMobile ? "11px" : "10px",
                    opacity: baselineFileSize === 0 ? 0.5 : 1 
                  }}>
                    Target file size{baselineFileSize === 0 ? " (processing...)" : ""}
                  </span>
                </label>

                {settings.useTargetFileSize ? (
                  <div>
                    <div style={{ fontSize: isMobile ? "11px" : "10px", marginBottom: "6px" }}>
                      Target: {settings.targetFileSizeKB} KB
                    </div>
                    <input
                      type="range"
                      min="1"
                      max={baselineFileSize > 0 ? baselineFileSize : 200}
                      value={Math.min(settings.targetFileSizeKB, baselineFileSize > 0 ? baselineFileSize : 200)}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          targetFileSizeKB: parseInt(e.target.value),
                        }))
                      }
                      className="win99-slider"
                      style={{ width: "100%", marginBottom: "4px" }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "9px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <span>1 KB</span>
                      <span>{baselineFileSize > 0 ? baselineFileSize : 200} KB</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: isMobile ? "11px" : "10px", marginBottom: "6px" }}>
                      Quality: {settings.quality}%
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={settings.quality}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          quality: parseInt(e.target.value),
                        }))
                      }
                      className="win99-slider"
                      style={{ width: "100%" }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Dimensions */}
            <div
              className="win99-panel"
              style={{
                padding: isMobile ? "8px" : "10px",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "8px",
                  fontSize: isMobile ? "12px" : "11px",
                }}
              >
                Dimensions
              </div>
              <div
                style={{
                  display: "flex",
                  gap: isMobile ? "12px" : "8px",
                  alignItems: "center",
                  marginBottom: "8px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: isMobile ? "11px" : "10px", minWidth: "16px" }}>W:</span>
                  <input
                    type="number"
                    value={widthInput}
                    onChange={(e) => handleDimensionChange("width", e.target.value)}
                    className="win99-input"
                    style={{ width: isMobile ? "80px" : "70px", fontSize: isMobile ? "11px" : "10px" }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: isMobile ? "11px" : "10px", minWidth: "16px" }}>H:</span>
                  <input
                    type="number"
                    value={heightInput}
                    onChange={(e) => handleDimensionChange("height", e.target.value)}
                    className="win99-input"
                    style={{ width: isMobile ? "80px" : "70px", fontSize: isMobile ? "11px" : "10px" }}
                  />
                </div>
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "8px",
                }}
              >
                <input
                  type="checkbox"
                  checked={settings.maintainAspectRatio}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      maintainAspectRatio: e.target.checked,
                    }))
                  }
                />
                <span style={{ fontSize: isMobile ? "11px" : "10px" }}>Maintain aspect ratio</span>
              </label>

              <div
                className="win99-button"
                onClick={resetToOriginal}
                style={{
                  fontSize: isMobile ? "11px" : "10px",
                  padding: isMobile ? "6px 12px" : "4px 8px",
                  width: "100%",
                  textAlign: "center",
                  marginBottom: "8px",
                }}
              >
                Reset to Original
              </div>

              <div style={{ fontSize: "9px", color: "var(--text-secondary)" }}>
                <div>Original: {originalDimensions.width}×{originalDimensions.height}</div>
                <div>Current: {settings.width}×{settings.height}</div>
              </div>
            </div>

            {/* Presets - Always visible on desktop, mobile only when needed */}
            {(!isMobile || (isMobile && settings.width > 0 && settings.height > 0)) && (
              <div
                className="win99-panel"
                style={{
                  padding: isMobile ? "8px" : "10px",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "8px",
                    fontSize: isMobile ? "12px" : "11px",
                  }}
                >
                  Presets
                </div>
                                 <div
                   style={{
                     display: "grid",
                     gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr",
                     gap: "4px",
                     maxHeight: isMobile ? "none" : "200px",
                     overflowY: isMobile ? "visible" : "auto",
                   }}
                 >
                  {presetSizes.map((preset) => (
                    <div
                      key={preset.name}
                      className="win99-button"
                      onClick={() => {
                        setSettings((prev) => ({
                          ...prev,
                          width: preset.width,
                          height: preset.height,
                        }));
                        setWidthInput(preset.width.toString());
                        setHeightInput(preset.height.toString());
                      }}
                      style={{
                        fontSize: isMobile ? "10px" : "9px",
                        padding: isMobile ? "8px 6px" : "6px 4px",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        minHeight: isMobile ? "50px" : "32px",
                      }}
                    >
                      <div style={{ fontWeight: "bold", marginBottom: "2px" }}>
                        {preset.name}
                      </div>
                      <div style={{ fontSize: "8px", opacity: 0.7 }}>
                        {preset.width}×{preset.height}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Enhancement - conditionally shown */}
            {(settings.width > originalDimensions.width || settings.height > originalDimensions.height) && (
              <div
                className="win99-panel"
                style={{
                  padding: isMobile ? "8px" : "10px",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "8px",
                    fontSize: isMobile ? "12px" : "11px",
                  }}
                >
                  AI Enhancement
                  <span style={{ fontSize: "9px", fontWeight: "normal", marginLeft: "4px", opacity: 0.7 }}>
                    (for upscaling)
                  </span>
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "8px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={settings.useAIEnhancement}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        useAIEnhancement: e.target.checked,
                      }))
                    }
                  />
                  <span style={{ fontSize: isMobile ? "11px" : "10px" }}>Enable AI upscaling</span>
                </label>

                {settings.useAIEnhancement && (
                  <div>
                    <div style={{ fontSize: isMobile ? "11px" : "10px", marginBottom: "6px" }}>
                      Method: {settings.upscalingMethod}
                      {isAIProcessing && (
                        <span style={{ color: "var(--accent-color)", marginLeft: "4px" }}>
                          ⚡ Processing...
                        </span>
                      )}
                    </div>
                    <select
                      value={settings.upscalingMethod}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          upscalingMethod: e.target.value as "bilinear" | "bicubic" | "lanczos" | "ai",
                        }))
                      }
                      style={{
                        width: "100%",
                        fontSize: isMobile ? "11px" : "10px",
                        padding: "4px 6px",
                        border: "1px inset var(--border-window)",
                        background: "var(--bg-content)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="bilinear">Bilinear (Fast)</option>
                      <option value="bicubic">Bicubic (Better)</option>
                      <option value="lanczos">Lanczos (Best)</option>
                      <option value="ai">AI Upscaling (Premium)</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div
            style={{
              gridColumn: isMobile ? undefined : "2",
              gridRow: isMobile ? undefined : "1",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              flex: isMobile ? "1 1 auto" : undefined,
              minHeight: isMobile ? "200px" : "300px",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                marginBottom: isMobile ? "4px" : "8px",
                fontSize: isMobile ? "12px" : "11px",
                padding: "0 4px",
              }}
            >
              Preview
            </div>
            
            <div
              ref={previewContainerRef}
              className="win99-sunken"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                cursor: zoomPan.isDragging ? "grabbing" : "grab",
                position: "relative",
                touchAction: "none",
                marginBottom: isMobile ? "6px" : "8px",
                minHeight: isMobile ? "150px" : "200px",
              }}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              {isProcessing ? (
                <div
                  style={{ fontSize: isMobile ? "11px" : "10px", color: "var(--text-secondary)" }}
                >
                  Processing...
                  {settings.useTargetFileSize && settings.targetFileSizeKB <= 10 && (
                    <div style={{ fontSize: "9px", marginTop: "4px", opacity: 0.8 }}>
                      Applying extreme compression
                    </div>
                  )}
                </div>
              ) : previewData ? (
                <img
                  src={previewData}
                  alt="Preview"
                  style={{
                    transform: `translate(${zoomPan.panX}px, ${zoomPan.panY}px) scale(${zoomPan.zoom})`,
                    transition: zoomPan.isDragging ? "none" : "transform 0.1s ease-out",
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                />
              ) : (
                <div
                  style={{ fontSize: isMobile ? "11px" : "10px", color: "var(--text-secondary)" }}
                >
                  No preview
                </div>
              )}
            </div>

            {/* Zoom Controls */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: isMobile ? "4px" : "6px",
                marginBottom: isMobile ? "4px" : "8px",
              }}
            >
              <div
                className="win99-button"
                onClick={zoomOut}
                style={{
                  padding: isMobile ? "8px 12px" : "6px 10px",
                  fontSize: isMobile ? "12px" : "10px",
                  minWidth: isMobile ? "32px" : "28px",
                }}
              >
                −
              </div>
              <div
                className="win99-button"
                onClick={resetZoomPan}
                style={{
                  padding: isMobile ? "8px 12px" : "6px 10px",
                  fontSize: isMobile ? "11px" : "9px",
                  minWidth: isMobile ? "60px" : "50px",
                }}
              >
                {Math.round(zoomPan.zoom * 100)}%
              </div>
              <div
                className="win99-button"
                onClick={zoomIn}
                style={{
                  padding: isMobile ? "8px 12px" : "6px 10px",
                  fontSize: isMobile ? "12px" : "10px",
                  minWidth: isMobile ? "32px" : "28px",
                }}
              >
                +
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div
            style={{
              gridColumn: isMobile ? undefined : "1 / -1",
              gridRow: isMobile ? undefined : "2",
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: "8px",
              alignItems: isMobile ? "stretch" : "center",
              justifyContent: "space-between",
              padding: isMobile ? "8px" : "10px",
              background: "var(--bg-content)",
              border: "1px inset var(--border-window)",
              fontSize: isMobile ? "11px" : "10px",
              flex: isMobile ? "0 0 auto" : undefined,
            }}
          >
            <div style={{ display: "flex", gap: isMobile ? "8px" : "12px", flexWrap: "wrap" }}>
              <div>
                <strong>Format:</strong> {settings.format.toUpperCase()}
              </div>
              <div>
                <strong>Size:</strong> {settings.width}×{settings.height}
              </div>
              <div>
                <strong>File Size:</strong> ~{fileSize} KB
              </div>
              {settings.useTargetFileSize && (
                <div
                  style={{
                    color: fileSize <= settings.targetFileSizeKB ? "var(--text-primary)" : 
                           fileSize > settings.targetFileSizeKB * 2 ? "red" : "orange",
                  }}
                >
                  <strong>Target:</strong> {settings.targetFileSizeKB} KB
                  {settings.targetFileSizeKB <= 10 && (
                    <span style={{ fontSize: "9px", marginLeft: "4px", opacity: 0.8 }}>
                      (extreme compression)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Export Buttons */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexShrink: 0,
                justifyContent: isMobile ? "center" : "flex-end",
              }}
            >
              <div 
                className="win99-button" 
                onClick={onClose}
                style={{
                  padding: isMobile ? "12px 20px" : "8px 16px",
                  fontSize: isMobile ? "12px" : "11px",
                  minWidth: isMobile ? "100px" : "80px",
                }}
              >
                Cancel
              </div>
              <div
                className="win99-button"
                onClick={previewData ? handleExport : undefined}
                style={{
                  background: previewData ? "var(--bg-button-hover)" : "var(--bg-window)",
                  fontWeight: "bold",
                  opacity: previewData ? 1 : 0.5,
                  cursor: previewData ? "pointer" : "not-allowed",
                  padding: isMobile ? "12px 20px" : "8px 16px",
                  fontSize: isMobile ? "12px" : "11px",
                  minWidth: isMobile ? "100px" : "80px",
                }}
              >
                💿 Export
              </div>
            </div>
          </div>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
};

