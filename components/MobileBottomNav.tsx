import React from "react";
import { useIsMobile } from "../src/hooks/useIsMobile";

interface MobileBottomNavProps {
  active: "canvas" | "effects" | "layers" | "history" | "export";
  onChange: (view: "canvas" | "effects" | "layers" | "history") => void;
  onExport: () => void;
  hasImage?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  active,
  onChange,
  onExport,
  hasImage = false,
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
        <span className="win98-toolbar-icon">📜</span>
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