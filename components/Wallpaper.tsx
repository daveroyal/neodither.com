import React, { useState, useEffect } from "react";

interface WallpaperProps {
  onRestore: () => void;
}

export const Wallpaper: React.FC<WallpaperProps> = ({ onRestore }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleDonateClick = () => {
    window.open(
      "https://www.paypal.com/donate?hosted_button_id=C3JDWSB565U8G",
      "_blank"
    );
  };

  const handleWebsiteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open("https://davidroyal.dev", "_blank");
  };

  return (
    <div
      className="wallpaper-container"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "var(--bg-desktop)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        cursor: "pointer",
        fontFamily: '"MS Sans Serif", "Tahoma", sans-serif',
        color: "var(--text-titlebar)",
        animation: "wallpaper-entrance 0.6s ease-out",
        overflow: "hidden",
      }}
      onClick={onRestore}
    >
      {/* Windows 99 style support message */}
      <div
        style={{
          background: "var(--bg-window)",
          color: "var(--text-primary)",
          padding: "20px 30px",
          border: "2px outset var(--border-window)",
          borderRadius: "0px",
          fontSize: "16px",
          textAlign: "center",
          fontFamily: '"MS Sans Serif", "Tahoma", sans-serif',
          boxShadow: "2px 2px 4px rgba(0,0,0,0.3)",
          marginBottom: "60px",
          position: "relative",
          maxWidth: "450px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            marginBottom: "12px",
            fontSize: "12px",
            color: "var(--text-primary)",
          }}
        >
          System Message
        </div>
        <div
          style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "12px" }}
        >
          💰 Support Development
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <div
            style={{
              background: "var(--bg-window)",
              border: "2px outset var(--border-window)",
              padding: "8px 16px",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onClick={handleDonateClick}
            onMouseEnter={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.background = "var(--bg-button-hover)";
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.background = "var(--bg-window)";
            }}
            onMouseDown={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.border = "2px inset var(--border-window)";
              target.style.background = "var(--bg-button-active)";
            }}
            onMouseUp={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.border = "2px outset var(--border-window)";
              target.style.background = "var(--bg-button-hover)";
            }}
          >
            💳 Donate
          </div>

          <div
            style={{
              background: "var(--bg-window)",
              border: "2px outset var(--border-window)",
              padding: "8px 16px",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            onClick={handleWebsiteClick}
            onMouseEnter={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.background = "var(--bg-button-hover)";
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.background = "var(--bg-window)";
            }}
            onMouseDown={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.border = "2px inset var(--border-window)";
              target.style.background = "var(--bg-button-active)";
            }}
            onMouseUp={(e) => {
              const target = e.currentTarget as HTMLElement;
              target.style.border = "2px outset var(--border-window)";
              target.style.background = "var(--bg-button-hover)";
            }}
          >
            🌐 Website
          </div>
        </div>

        <div
          style={{
            marginTop: "10px",
            fontSize: "11px",
            color: "var(--text-secondary)",
          }}
        >
          PayPal • davidroyal.dev
        </div>
      </div>

      {/* Minimized App - Centered Bottom */}
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          height: "30px",
          background: "var(--bg-window)",
          border: "1px inset var(--border-window)",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: "8px",
          boxShadow: "2px 2px 4px rgba(0,0,0,0.3)",
          fontFamily: '"MS Sans Serif", "Tahoma", sans-serif',
          fontSize: "11px",
          cursor: "pointer",
          minWidth: "250px",
        }}
        onClick={(e) => {
          e.stopPropagation();
          onRestore();
        }}
        onMouseEnter={(e) => {
          const target = e.currentTarget as HTMLElement;
          target.style.background = "var(--bg-button-hover)";
        }}
        onMouseLeave={(e) => {
          const target = e.currentTarget as HTMLElement;
          target.style.background = "var(--bg-window)";
        }}
        onMouseDown={(e) => {
          const target = e.currentTarget as HTMLElement;
          target.style.border = "1px outset var(--border-window)";
          target.style.background = "var(--bg-button-active)";
        }}
        onMouseUp={(e) => {
          const target = e.currentTarget as HTMLElement;
          target.style.border = "1px inset var(--border-window)";
          target.style.background = "var(--bg-button-hover)";
        }}
      >
        {/* App Icon */}
        <span style={{ fontSize: "16px" }}>🎨</span>

        {/* App Name */}
        <span style={{ color: "var(--text-primary)", flex: 1 }}>
          Neo Dither
        </span>

        {/* Time */}
        <span style={{ color: "var(--text-secondary)", fontSize: "10px" }}>
          {currentTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Enhanced animations */}
      <style>
        {`
          @keyframes wallpaper-entrance {
            0% {
              opacity: 0;
              transform: scale(1.02);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>
  );
};
