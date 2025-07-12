import React from "react";

interface HistoryItem {
  id: string;
  imageData: string;
  timestamp: number;
  effectName?: string;
}

interface HistoryPanelProps {
  history: HistoryItem[];
  onHistoryItemSelect: (item: HistoryItem) => void;
  onClearHistory: () => void;
  isSelecting?: boolean;
  currentHistoryIndex?: number;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onHistoryItemSelect,
  onClearHistory,
  isSelecting = false,
  currentHistoryIndex = -1,
}) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const getEffectIcon = (effectName?: string) => {
    if (!effectName) return "📷";
    if (effectName.includes("VHS")) return "📺";
    if (effectName.includes("Glitch")) return "⚡";
    if (effectName.includes("Lo-Fi")) return "🎵";
    if (effectName.includes("Cyberpunk")) return "🤖";
    if (effectName.includes("90s")) return "💿";
    if (effectName.includes("Cropped")) return "✂️";
    if (effectName.includes("Rotated")) return "🔄";
    return "📷";
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "6px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        {history.length > 1 && (
          <div
            className="win99-button"
            onClick={onClearHistory}
            title="Clear history"
            style={{
              fontSize: "9px",
              padding: "2px 6px",
              minHeight: "18px",
              display: "flex",
              alignItems: "center",
              gap: "2px",
            }}
          >
            <span>🗑️</span>
            <span>Clear</span>
          </div>
        )}
      </div>

      {/* History List */}
      {history.length === 0 ? (
        <div
          className="win99-sunken"
          style={{
            padding: "20px",
            textAlign: "center",
            fontSize: "11px",
            color: "#666",
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>📜</div>
          <div style={{ fontWeight: "bold" }}>No history</div>
        </div>
      ) : (
        <>
          {isSelecting && (
            <div
              style={{
                padding: "8px",
                textAlign: "center",
                fontSize: "10px",
                color: "#4080ff",
                fontWeight: "bold",
                background: "#f0f8ff",
                border: "1px solid #4080ff",
                marginBottom: "8px",
              }}
            >
              ⏳ Loading selected state...
            </div>
          )}
        <div
          className="win99-sunken win99-scrollbar"
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            background: "var(--bg-input)",
          }}
        >
          {history.map((item, index) => (
            <div
              key={item.id}
              onClick={() => onHistoryItemSelect(item)}
              style={{
                padding: "6px",
                borderBottom:
                  index < history.length - 1
                    ? "1px solid var(--border-sunken)"
                    : "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background:
                  index === currentHistoryIndex ? "#f0f8ff" : "transparent",
                transition: "background-color 0.2s ease",
              }}
              className="win99-history-item"
              onMouseEnter={(e) => {
                if (index !== currentHistoryIndex) {
                  e.currentTarget.style.backgroundColor = "#f0f0f0";
                }
              }}
              onMouseLeave={(e) => {
                if (index !== currentHistoryIndex) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
              onTouchStart={(e) => {
                if (index !== currentHistoryIndex) {
                  e.currentTarget.style.backgroundColor = "#e0e0e0";
                }
              }}
              onTouchEnd={(e) => {
                if (index !== currentHistoryIndex) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              {/* Icon */}
              <div style={{ fontSize: "16px" }}>
                {getEffectIcon(item.effectName)}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: "bold",
                    color: "#000080",
                    marginBottom: "1px",
                  }}
                >
                  {item.effectName || "Original"}
                </div>
                <div
                  style={{
                    fontSize: "8px",
                    color: "#666",
                  }}
                >
                  {formatTime(item.timestamp)}
                </div>
              </div>

              {/* Current indicator */}
              {index === currentHistoryIndex && (
                <div
                  style={{
                    fontSize: "8px",
                    background: "#4080ff",
                    color: "#ffffff",
                    padding: "1px 4px",
                    borderRadius: "2px",
                    fontWeight: "bold",
                  }}
                >
                  CURRENT
                </div>
              )}


            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
};
