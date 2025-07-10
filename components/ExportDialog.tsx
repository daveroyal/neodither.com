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
    targetFileSizeKB: 500,
    maintainAspectRatio: true,
    useTargetFileSize: false,
    useAIEnhancement: false,
    upscalingMethod: "bicubic",
  });
  const [previewData, setPreviewData] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      };
      img.src = imageData;
    }
  }, [imageData, isOpen]);

  // Generate preview when settings change
  useEffect(() => {
    if (isOpen && originalDimensions.width > 0) {
      generatePreview();
    }
  }, [settings, originalDimensions, isOpen]);

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
          let quality = settings.quality / 100;

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
              quality = 1.0;
              break;
          }

          // If target file size is enabled and format supports compression
          if (
            settings.useTargetFileSize &&
            (settings.format === "jpeg" || settings.format === "webp")
          ) {
            quality = await findOptimalQuality(
              canvas,
              mimeType,
              settings.targetFileSizeKB
            );
          }

          const resultData = canvas.toDataURL(mimeType, quality);
          setPreviewData(resultData);

          // Calculate file size (rough estimate)
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
    let minQuality = 0.1;
    let maxQuality = 1.0;
    let bestQuality = settings.quality / 100;

    // Binary search for optimal quality
    for (let i = 0; i < 8; i++) {
      const testQuality = (minQuality + maxQuality) / 2;
      const testData = canvas.toDataURL(mimeType, testQuality);
      const base64Length = testData.length - `data:${mimeType};base64,`.length;
      const sizeKB = (base64Length * 3) / 4 / 1024;

      if (sizeKB <= targetKB) {
        bestQuality = testQuality;
        minQuality = testQuality;
      } else {
        maxQuality = testQuality;
      }
    }

    return bestQuality;
  };

  const handleDimensionChange = (
    dimension: "width" | "height",
    value: number
  ) => {
    if (settings.maintainAspectRatio && originalDimensions.width > 0) {
      const aspectRatio = originalDimensions.width / originalDimensions.height;

      if (dimension === "width") {
        setSettings((prev) => ({
          ...prev,
          width: value,
          height: Math.round(value / aspectRatio),
        }));
      } else {
        setSettings((prev) => ({
          ...prev,
          width: Math.round(value * aspectRatio),
          height: value,
        }));
      }
    } else {
      setSettings((prev) => ({
        ...prev,
        [dimension]: value,
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
      }}
      onClick={onClose}
    >
      <div
        className="win99-window"
        style={{
          width: isMobile ? "95vw" : "720px",
          maxWidth: isMobile ? "95vw" : "720px",
          maxHeight: isMobile ? "90vh" : "85vh",
          minHeight: isMobile ? "80vh" : "400px",
          display: "flex",
          flexDirection: "column",
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
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? "8px" : "12px",
            overflow: isMobile ? "auto" : "hidden",
            minHeight: 0,
          }}
        >
          {/* Left Panel - Format & Quality */}
          <div
            style={{
              width: isMobile ? "100%" : "200px",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            {/* Format Selection */}
            <div
              className="win99-panel"
              style={{
                marginBottom:
                  settings.format === "jpeg" || settings.format === "webp"
                    ? "6px"
                    : "8px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "6px",
                  fontSize: "11px",
                }}
              >
                Format
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "3px" }}
              >
                {(["png", "jpeg", "webp"] as const).map((format) => (
                  <label
                    key={format}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
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
                      style={{ fontSize: "10px", textTransform: "uppercase" }}
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
                  marginBottom: "8px",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "6px",
                    fontSize: "11px",
                  }}
                >
                  Compression
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    marginBottom: "6px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={settings.useTargetFileSize}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        useTargetFileSize: e.target.checked,
                      }))
                    }
                  />
                  <span style={{ fontSize: "10px" }}>Target file size</span>
                </label>

                {settings.useTargetFileSize ? (
                  <div>
                    <div style={{ fontSize: "10px", marginBottom: "4px" }}>
                      Target: {settings.targetFileSizeKB} KB
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="5000"
                      value={settings.targetFileSizeKB}
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
                      <span>50 KB</span>
                      <span>5 MB</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: "10px", marginBottom: "4px" }}>
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

            {/* AI Enhancement Controls */}
            {(settings.width > originalDimensions.width || settings.height > originalDimensions.height) && (
              <div
                className="win99-panel"
                style={{
                  marginBottom: "8px",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "6px",
                    fontSize: "11px",
                  }}
                >
                  AI Enhancement
                  <span style={{ fontSize: "9px", fontWeight: "normal", marginLeft: "4px", opacity: 0.7 }}>
                    (when enlarging)
                  </span>
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    marginBottom: "6px",
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
                  <span style={{ fontSize: "10px" }}>Enable AI upscaling</span>
                </label>
                <div style={{ fontSize: "9px", opacity: 0.7, marginTop: "2px" }}>
                  Uses advanced algorithms to improve image quality when enlarging
                </div>

                {settings.useAIEnhancement && (
                  <div>
                    <div style={{ fontSize: "10px", marginBottom: "4px" }}>
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
                        fontSize: "9px",
                        padding: "2px 4px",
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

            {/* Preset Sizes */}
            <div
              className="win99-panel"
              style={{
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                marginTop: "auto",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "6px",
                  fontSize: "11px",
                }}
              >
                Presets
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: "2px",
                  flex: 1,
                  overflowY: "auto",
                  minHeight: 0,
                }}
              >
                {presetSizes.map((preset) => (
                  <div
                    key={preset.name}
                    className="win99-button"
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        width: preset.width,
                        height: preset.height,
                      }))
                    }
                    style={{
                      fontSize: "9px",
                      padding: "4px 6px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      minHeight: "24px",
                      maxHeight: "24px",
                    }}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      {preset.name}
                    </span>
                    <span
                      style={{
                        fontSize: "8px",
                        color: "var(--text-secondary)",
                        flexShrink: 0,
                        marginLeft: "4px",
                      }}
                    >
                      {preset.width}×{preset.height}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Panel - Output Size */}
          <div
            style={{
              width: isMobile ? "100%" : "200px",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <div className="win99-panel" style={{ flex: 1 }}>
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "6px",
                  fontSize: "11px",
                }}
              >
                Output Size
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span style={{ fontSize: "10px", minWidth: "20px" }}>W:</span>
                  <input
                    type="number"
                    value={settings.width}
                    onChange={(e) =>
                      handleDimensionChange(
                        "width",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="win99-input"
                    style={{ width: "70px", fontSize: "10px" }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span style={{ fontSize: "10px", minWidth: "20px" }}>H:</span>
                  <input
                    type="number"
                    value={settings.height}
                    onChange={(e) =>
                      handleDimensionChange(
                        "height",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="win99-input"
                    style={{ width: "70px", fontSize: "10px" }}
                  />
                </div>
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
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
                <span style={{ fontSize: "10px" }}>Maintain aspect ratio</span>
              </label>

              <div
                className="win99-button"
                onClick={resetToOriginal}
                style={{
                  fontSize: "10px",
                  padding: "4px 8px",
                  marginBottom: "8px",
                }}
              >
                Reset to Original
              </div>

              <div style={{ fontSize: "9px", color: "var(--text-secondary)" }}>
                <div>
                  Original: {originalDimensions.width}×
                  {originalDimensions.height}
                </div>
                <div>
                  Current: {settings.width}×{settings.height}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div
            style={{
              width: isMobile ? "100%" : "240px",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <div
              className="win99-panel"
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "6px",
                  fontSize: "11px",
                }}
              >
                Preview
              </div>
              <div
                className="win99-sunken"
                style={{
                  flex: 1,
                  minHeight: "120px",
                  maxHeight: "200px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "8px",
                  overflow: "hidden",
                }}
              >
                {isProcessing ? (
                  <div
                    style={{ fontSize: "10px", color: "var(--text-secondary)" }}
                  >
                    Processing...
                  </div>
                ) : previewData ? (
                  <img
                    src={previewData}
                    alt="Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <div
                    style={{ fontSize: "10px", color: "var(--text-secondary)" }}
                  >
                    No preview
                  </div>
                )}
              </div>

              <div
                style={{
                  fontSize: "9px",
                  color: "var(--text-secondary)",
                  marginTop: "auto",
                  paddingTop: "4px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "1px",
                  }}
                >
                  <span>File Size:</span>
                  <span style={{ fontWeight: "bold" }}>~{fileSize} KB</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "1px",
                  }}
                >
                  <span>Dimensions:</span>
                  <span>
                    {settings.width}×{settings.height}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "1px",
                  }}
                >
                  <span>Format:</span>
                  <span>{settings.format.toUpperCase()}</span>
                </div>
                {settings.useTargetFileSize && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "1px",
                      color:
                        fileSize <= settings.targetFileSizeKB
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                    }}
                  >
                    <span>Target:</span>
                    <span>{settings.targetFileSizeKB} KB</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            padding: "8px",
            borderTop: "1px solid var(--border-sunken)",
            display: "flex",
            justifyContent: isMobile ? "stretch" : "flex-end",
            gap: "8px",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          <div 
            className="win99-button" 
            onClick={onClose}
            style={{
              padding: isMobile ? "12px" : "8px",
              fontSize: isMobile ? "14px" : "11px",
              minHeight: isMobile ? "44px" : "auto",
            }}
          >
            Cancel
          </div>
          <div
            className="win99-button"
            onClick={previewData ? handleExport : undefined}
            style={{
              background: previewData
                ? "var(--bg-button-hover)"
                : "var(--bg-window)",
              fontWeight: "bold",
              opacity: previewData ? 1 : 0.5,
              cursor: previewData ? "pointer" : "not-allowed",
              padding: isMobile ? "12px" : "8px",
              fontSize: isMobile ? "14px" : "11px",
              minHeight: isMobile ? "44px" : "auto",
            }}
          >
            💿 Export
          </div>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
};
