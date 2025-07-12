import React from "react";
import { useIsMobile } from "../src/hooks/useIsMobile";

interface MobileBottomNavProps {
  active: "canvas" | "effects" | "layers" | "history" | "export";
  onChange: (view: "canvas" | "effects" | "layers" | "history") => void;
  onExport: () => void;
  hasImage?: boolean;
  historyCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  active,
  onChange,
  onExport,
  hasImage = false,
  historyCount = 0,
}) => {
  const isMobile = useIsMobile();
  if (!isMobile) return null;

  const btnClass = (key: string) =>
    `win98-toolbar-btn${active === key ? " active" : ""}`;

  return (
    <div className="mobile-bottom-nav">
      <button
        className={btnClass("canvas")}
        onClick={() => onChange("canvas")}
        title="Editor"
      >
        <span className="win98-toolbar-icon">🖼️</span>
        <span className="win98-toolbar-text">Edit</span>
      </button>
      <button
        className={btnClass("effects")}
        onClick={() => onChange("effects")}
        title="Effects"
      >
        <span className="win98-toolbar-icon">✨</span>
        <span className="win98-toolbar-text">Effects</span>
      </button>
      <button
        className={btnClass("layers")}
        onClick={() => onChange("layers")}
        title="Layers"
      >
        <span className="win98-toolbar-icon">🗂️</span>
        <span className="win98-toolbar-text">Layers</span>
      </button>
      <button
        className={btnClass("history")}
        onClick={() => onChange("history")}
        title="History"
      >
        <span className="win98-toolbar-icon" style={{ position: "relative" }}>
          📜
          {historyCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                background: "#4080ff",
                color: "#ffffff",
                fontSize: "8px",
                fontWeight: "bold",
                padding: "1px 4px",
                borderRadius: "8px",
                minWidth: "12px",
                textAlign: "center",
                lineHeight: "1",
                border: "1px solid #ffffff",
              }}
            >
              {historyCount}
            </span>
          )}
        </span>
        <span className="win98-toolbar-text">History</span>
      </button>
      <button
        className={`${btnClass("export")}${!hasImage ? " disabled" : ""}`}
        onClick={hasImage ? onExport : undefined}
        disabled={!hasImage}
        title={hasImage ? "Save As" : "No image to save"}
        style={{
          opacity: hasImage ? 1 : 0.5,
          cursor: hasImage ? "pointer" : "not-allowed",
          filter: hasImage ? "none" : "grayscale(1)",
        }}
      >
        <span className="win98-toolbar-icon">💿</span>
        <span className="win98-toolbar-text">Save As</span>
      </button>
    </div>
  );
}; 