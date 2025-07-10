import React, { useState, useEffect } from "react";

interface ToolPanelProps {
  currentTool: string;
  onToolChange: (tool: string) => void;
  onImageUpload: (imageData: string) => void;
  onSave: () => void;
  onExport: () => void;
  onImport: () => void;
  onTooltipChange: (tooltip: string) => void;
  currentImage: string | null;
  onHistoryClick?: () => void;
  showHistoryPopout?: boolean;
  historyLength?: number;
}

export const ToolPanel: React.FC<ToolPanelProps> = ({
  currentTool,
  onToolChange,
  onImageUpload,
  onSave,
  onExport,
  onImport,
  onTooltipChange,
  currentImage,
  onHistoryClick,
  showHistoryPopout,
  historyLength,
}) => {
  // Responsive mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        onImageUpload(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseEnter = (tooltip: string) => {
    // Disable tooltips on mobile
    if (!isMobile) {
      onTooltipChange(tooltip);
    }
  };

  const handleMouseLeave = () => {
    // Disable tooltips on mobile
    if (!isMobile) {
      onTooltipChange("");
    }
  };

  return (
    <div className="win98-toolbar">
      <input
        id="file-upload"
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: "none" }}
      />

      {/* File Operations Group */}
      <div className="win98-toolbar-group">
        <button
          className="win98-toolbar-btn win98-toolbar-btn-open"
          onClick={() => document.getElementById("file-upload")?.click()}
          onMouseEnter={() =>
            handleMouseEnter("Open Image - Load an image file to start editing")
          }
          onMouseLeave={handleMouseLeave}
        >
          <span className="win98-toolbar-icon">📂</span>
          <span className="win98-toolbar-text">Open</span>
        </button>
      </div>

      {/* Separator */}
      <div className="win98-toolbar-separator"></div>

      {/* Project Operations Group */}
      <div className="win98-toolbar-group">
        <button
          className="win98-toolbar-btn"
          onClick={onImport}
          onMouseEnter={() =>
            handleMouseEnter(
              "Import Project - Load project settings from JSON file"
            )
          }
          onMouseLeave={handleMouseLeave}
        >
          <span className="win98-toolbar-icon">📥</span>
          <span className="win98-toolbar-text">Import</span>
        </button>

        <button
          className="win98-toolbar-btn"
          onClick={onSave}
          disabled={!currentImage}
          onMouseEnter={() =>
            handleMouseEnter(
              "Export Project - Save project settings as JSON file"
            )
          }
          onMouseLeave={handleMouseLeave}
        >
          <span className="win98-toolbar-icon">💾</span>
          <span className="win98-toolbar-text">Export</span>
        </button>

        <button
          className="win98-toolbar-btn"
          onClick={onExport}
          disabled={!currentImage}
          onMouseEnter={() =>
            handleMouseEnter(
              "Save As - Download current composite image as PNG"
            )
          }
          onMouseLeave={handleMouseLeave}
        >
          <span className="win98-toolbar-icon">💿</span>
          <span className="win98-toolbar-text">Save As</span>
        </button>
      </div>

      {/* Separator */}
      <div className="win98-toolbar-separator"></div>

      {/* Tools Group */}
      <div className="win98-toolbar-group">
        <button
          className={`win98-toolbar-btn${
            currentTool === "crop" ? " active" : ""
          }`}
          onClick={() => onToolChange("crop")}
          disabled={!currentImage}
          onMouseEnter={() =>
            handleMouseEnter(
              "Crop Tool - Select and crop a rectangular area of the image"
            )
          }
          onMouseLeave={handleMouseLeave}
        >
          <span className="win98-toolbar-icon">✂️</span>
          <span className="win98-toolbar-text">Crop</span>
        </button>

        <button
          className={`win98-toolbar-btn${
            currentTool === "rotate" ? " active" : ""
          }`}
          onClick={() => onToolChange("rotate")}
          disabled={!currentImage}
          onMouseEnter={() =>
            handleMouseEnter(
              "Rotate Tool - Rotate the image 90 degrees clockwise"
            )
          }
          onMouseLeave={handleMouseLeave}
        >
          <span className="win98-toolbar-icon">🔄</span>
          <span className="win98-toolbar-text">Rotate</span>
        </button>
      </div>

      {/* Separator */}
      <div className="win98-toolbar-separator"></div>

      {/* History Group */}
      <div className="win98-toolbar-group">
        <button
          className={`win98-toolbar-btn${showHistoryPopout ? " active" : ""}`}
          onClick={onHistoryClick}
          onMouseEnter={() =>
            handleMouseEnter("History - View and manage edit history")
          }
          onMouseLeave={handleMouseLeave}
          style={{
            position: "relative",
          }}
        >
          <span className="win98-toolbar-icon">📜</span>
          <span className="win98-toolbar-text">History</span>
          {(() => {
            const shouldShowBadge =
              historyLength &&
              typeof historyLength === "number" &&
              currentImage &&
              historyLength > 1;

            console.log("Badge debug:", {
              historyLength,
              currentImage: !!currentImage,
              shouldShowBadge,
              badgeValue: historyLength ? historyLength - 1 : 0,
            });

            return shouldShowBadge && historyLength && historyLength - 1 > 0 ? (
              <span
                className="win98-toolbar-badge"
                style={{
                  position: "absolute",
                  top: "2px",
                  right: "2px",
                  background: "var(--bg-button-pressed)",
                  color: "var(--text-titlebar)",
                  fontSize: "8px",
                  fontWeight: "bold",
                  padding: "1px 3px",
                  borderRadius: "50%",
                  minWidth: "12px",
                  textAlign: "center",
                  lineHeight: "1",
                  zIndex: 1,
                }}
              >
                {historyLength - 1}
              </span>
            ) : null;
          })()}
        </button>
      </div>
    </div>
  );
};
