import React, { useState, useRef, useEffect } from "react";

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

interface LayerPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onLayerSelect: (layerId: string | null) => void;
  onLayerUpdate: (layerId: string, updates: Partial<Layer>) => void;
  onLayerRemove: (layerId: string) => void;
  onLayerReorder: (dragIndex: number, dropIndex: number) => void;
  onClearLayers: () => void;
  onEditLayer: (layerId: string) => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  selectedLayerId,
  onLayerSelect,
  onLayerUpdate,
  onLayerRemove,
  onLayerReorder,
  onClearLayers,
  onEditLayer,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  const [renamingLayerId, setRenamingLayerId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    layerId: string;
    x: number;
    y: number;
  } | null>(null);
  const [selectedLayers, setSelectedLayers] = useState<Set<string>>(new Set());
  const renamingInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingLayerId && renamingInputRef.current) {
      renamingInputRef.current.focus();
      renamingInputRef.current.select();
    }
  }, [renamingLayerId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedLayerId) return;

      const selectedLayer = layers.find((l) => l.id === selectedLayerId);
      if (!selectedLayer) return;

      const selectedIndex = layers.findIndex((l) => l.id === selectedLayerId);

      switch (e.key) {
        case "Delete":
        case "Backspace":
          if (!selectedLayer.locked && !renamingLayerId) {
            e.preventDefault();
            onLayerRemove(selectedLayerId);
          }
          break;
        case "v":
        case "V":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleVisibilityToggle(selectedLayerId, selectedLayer.visible);
          }
          break;
        case "l":
        case "L":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleLockToggle(selectedLayerId, selectedLayer.locked);
          }
          break;
        case "ArrowUp":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleMoveLayer(selectedIndex, "up");
          } else if (selectedIndex > 0) {
            e.preventDefault();
            onLayerSelect(layers[selectedIndex - 1].id);
          }
          break;
        case "ArrowDown":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleMoveLayer(selectedIndex, "down");
          } else if (selectedIndex < layers.length - 1) {
            e.preventDefault();
            onLayerSelect(layers[selectedIndex + 1].id);
          }
          break;
        case "F2":
          e.preventDefault();
          setRenamingLayerId(selectedLayerId);
          break;
        case "Escape":
          if (renamingLayerId) {
            e.preventDefault();
            setRenamingLayerId(null);
          }
          if (contextMenu) {
            e.preventDefault();
            setContextMenu(null);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedLayerId, layers, renamingLayerId, contextMenu]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu]);

  const handleVisibilityToggle = (layerId: string, visible: boolean) => {
    onLayerUpdate(layerId, { visible: !visible });
  };

  const handleLockToggle = (layerId: string, locked: boolean) => {
    onLayerUpdate(layerId, { locked: !locked });
  };

  const handleOpacityChange = (layerId: string, opacity: number) => {
    onLayerUpdate(layerId, { opacity });
  };

  const handleBlendModeChange = (layerId: string, blendMode: string) => {
    onLayerUpdate(layerId, { blendMode });
  };

  const handleMoveLayer = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index > 0) {
      onLayerReorder(index, index - 1);
    } else if (direction === "down" && index < layers.length - 1) {
      onLayerReorder(index, index + 1);
    }
  };

  const handleLayerClick = (layerId: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Multi-select with Ctrl/Cmd
      const newSelected = new Set(selectedLayers);
      if (newSelected.has(layerId)) {
        newSelected.delete(layerId);
      } else {
        newSelected.add(layerId);
      }
      setSelectedLayers(newSelected);
    } else if (event.shiftKey && selectedLayerId) {
      // Range select with Shift
      const currentIndex = layers.findIndex((l) => l.id === selectedLayerId);
      const clickedIndex = layers.findIndex((l) => l.id === layerId);
      const start = Math.min(currentIndex, clickedIndex);
      const end = Math.max(currentIndex, clickedIndex);
      const newSelected = new Set<string>();
      for (let i = start; i <= end; i++) {
        newSelected.add(layers[i].id);
      }
      setSelectedLayers(newSelected);
    } else {
      // Single select
      setSelectedLayers(new Set());
      if (selectedLayerId === layerId) {
        onLayerSelect(null);
      } else {
        onLayerSelect(layerId);
      }
    }
  };

  const handleEditClick = (layerId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onEditLayer(layerId);
  };

  const handleContextMenu = (layerId: string, event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      layerId,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleDuplicateLayer = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (layer) {
      const newLayer = {
        ...layer,
        id: `${layer.id}_copy_${Date.now()}`,
        name: `${layer.name} Copy`,
      };
      // Note: This would need to be implemented in the parent component
      console.log("Duplicate layer:", newLayer);
    }
    setContextMenu(null);
  };

  const toggleLayerExpanded = (layerId: string) => {
    const newExpanded = new Set(expandedLayers);
    if (newExpanded.has(layerId)) {
      newExpanded.delete(layerId);
    } else {
      newExpanded.add(layerId);
    }
    setExpandedLayers(newExpanded);
  };

  const handleLayerRename = (layerId: string, newName: string) => {
    if (
      newName.trim() &&
      newName !== layers.find((l) => l.id === layerId)?.name
    ) {
      onLayerUpdate(layerId, { name: newName.trim() });
    }
    setRenamingLayerId(null);
  };

  const handleQuickOpacity = (layerId: string, opacity: number) => {
    onLayerUpdate(layerId, { opacity });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", "");
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onLayerReorder(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getLayerIcon = (layerName: string) => {
    if (layerName.includes("VHS")) return "📺";
    if (layerName.includes("Glitch")) return "⚡";
    if (layerName.includes("Lo-Fi")) return "🎵";
    if (layerName.includes("Cyberpunk")) return "🤖";
    if (layerName.includes("90s")) return "💿";
    return "📄";
  };

  const blendModes = [
    { value: "normal", label: "Normal" },
    { value: "multiply", label: "Multiply" },
    { value: "screen", label: "Screen" },
    { value: "overlay", label: "Overlay" },
    { value: "soft-light", label: "Soft Light" },
    { value: "hard-light", label: "Hard Light" },
    { value: "color-dodge", label: "Color Dodge" },
    { value: "color-burn", label: "Color Burn" },
    { value: "darken", label: "Darken" },
    { value: "lighten", label: "Lighten" },
    { value: "difference", label: "Difference" },
    { value: "exclusion", label: "Exclusion" },
  ];

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "4px",
      }}
    >
      {/* Enhanced Control Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
          gap: "4px",
        }}
      >
        {/* Layer Count & Selection Info */}
        <div
          style={{
            fontSize: "9px",
            color: "var(--text-secondary)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {selectedLayers.size > 0 && (
            <span style={{ color: "var(--text-primary)" }}>
              {selectedLayers.size} selected
            </span>
          )}
          {selectedLayerId && (
            <span style={{ color: "var(--text-primary)" }}>
              {selectedLayers.size > 0 ? "• " : ""}#{layers.findIndex((l) => l.id === selectedLayerId) + 1} active
            </span>
          )}
        </div>

        {/* Control Buttons */}
        <div style={{ display: "flex", gap: "2px" }}>
          {/* Expand All */}
          {layers.length > 0 && (
            <div
              className="win99-button"
              onClick={() => {
                if (expandedLayers.size === layers.length) {
                  setExpandedLayers(new Set());
                } else {
                  setExpandedLayers(new Set(layers.map((l) => l.id)));
                }
              }}
              title={
                expandedLayers.size === layers.length
                  ? "Collapse all layers"
                  : "Expand all layers"
              }
              style={{
                fontSize: "8px",
                padding: "2px 4px",
                minHeight: "18px",
                display: "flex",
                alignItems: "center",
                gap: "1px",
              }}
            >
              <span>{expandedLayers.size === layers.length ? "🔼" : "🔽"}</span>
              <span>
                {expandedLayers.size === layers.length ? "Collapse" : "Expand"}
              </span>
            </div>
          )}

          {/* Clear All */}
          {layers.length > 0 && (
            <div
              className="win99-button"
              onClick={onClearLayers}
              title="Clear all layers (cannot be undone)"
              style={{
                fontSize: "8px",
                padding: "2px 4px",
                minHeight: "18px",
                display: "flex",
                alignItems: "center",
                gap: "1px",
                background: "var(--bg-button-hover)",
              }}
            >
              <span>🗑️</span>
              <span>Clear</span>
            </div>
          )}
        </div>
      </div>

      {/* Layers List */}
      <div
        className="win99-sunken win99-scrollbar"
        style={{
          flex: 1,
          overflowY: "auto",
          background: "var(--bg-content)",
        }}
      >
        {layers.length === 0 ? (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              border: "2px dashed var(--border-sunken)",
              background: "var(--bg-content)",
              color: "var(--text-secondary)",
              fontSize: "14px",
              fontWeight: "bold",
              gap: "16px",
              position: "relative",
              minHeight: "200px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div style={{ fontSize: "48px" }}>🎭</div>
              <div>No Layers</div>
              <div style={{ fontSize: "11px" }}>
                Create or import layers to start editing
              </div>
            </div>
          </div>
        ) : (
          layers.map((layer, index) => {
            const isSelected = selectedLayerId === layer.id;
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;
            const isExpanded = expandedLayers.has(layer.id);

            return (
              <div
                key={layer.id}
                draggable={!layer.locked}
                onDragStart={(e) => {
                  // Prevent drag if the event started from a form control
                  const target = e.target as HTMLElement;
                  if (
                    target.tagName === "INPUT" ||
                    target.tagName === "SELECT" ||
                    target.closest("input") ||
                    target.closest("select") ||
                    target.classList.contains("no-drag")
                  ) {
                    e.preventDefault();
                    return;
                  }
                  handleDragStart(e, index);
                }}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={(e) => handleLayerClick(layer.id, e)}
                onContextMenu={(e) => handleContextMenu(layer.id, e)}
                style={{
                  padding: "4px",
                  borderBottom:
                    index < layers.length - 1
                      ? "1px solid var(--border-sunken)"
                      : "none",
                  background: isSelected
                    ? "var(--bg-button-pressed)"
                    : selectedLayers.has(layer.id)
                    ? "var(--bg-button-hover)"
                    : layer.visible
                    ? "var(--bg-input)"
                    : "var(--bg-content)",
                  color: isSelected
                    ? "var(--text-titlebar)"
                    : "var(--text-primary)",
                  cursor: layer.locked ? "not-allowed" : "pointer",
                  position: "relative",
                  opacity: isDragging ? 0.5 : 1,
                  border: isDragOver
                    ? "2px dashed var(--border-raised)"
                    : "none",
                  transform: isDragging ? "rotate(1deg)" : "none",
                  transition: "all 0.15s ease",
                }}
                className="win99-layer-item"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setRenamingLayerId(layer.id);
                }}
              >
                {/* Layer Header - Compact Design */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    minHeight: "32px",
                  }}
                >
                  {/* Drag Handle */}
                  <div
                    style={{
                      width: "8px",
                      height: "20px",
                      background: isSelected
                        ? "var(--text-titlebar)"
                        : "var(--bg-window)",
                      marginRight: "4px",
                      cursor: layer.locked ? "not-allowed" : "grab",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      opacity: layer.locked ? 0.3 : 1,
                    }}
                    title="Drag to reorder"
                  >
                    <div
                      style={{
                        width: "4px",
                        height: "2px",
                        background: "currentColor",
                        marginBottom: "1px",
                      }}
                    />
                    <div
                      style={{
                        width: "4px",
                        height: "2px",
                        background: "currentColor",
                        marginBottom: "1px",
                      }}
                    />
                    <div
                      style={{
                        width: "4px",
                        height: "2px",
                        background: "currentColor",
                      }}
                    />
                  </div>

                  {/* Primary Controls */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    {/* Visibility Toggle */}
                    <button
                      className="win99-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVisibilityToggle(layer.id, layer.visible);
                      }}
                      style={{
                        width: "24px",
                        height: "24px",
                        background: layer.visible
                          ? "var(--bg-button-hover)"
                          : "var(--bg-button)",
                        border: "2px outset var(--border-raised)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "12px",
                        borderRadius: "2px",
                        transition: "all 0.1s ease",
                        color: layer.visible
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                      }}
                      title={`${
                        layer.visible ? "Hide" : "Show"
                      } layer (Ctrl+V)`}
                      onMouseDown={(e) => {
                        e.currentTarget.style.border =
                          "2px inset var(--border-sunken)";
                        e.currentTarget.style.transform = "translateY(1px)";
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.border =
                          "2px outset var(--border-raised)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.border =
                          "2px outset var(--border-raised)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {layer.visible ? "👁️" : "👁️‍🗨️"}
                    </button>

                    {/* Lock Toggle */}
                    <button
                      className="win99-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLockToggle(layer.id, layer.locked);
                      }}
                      style={{
                        width: "24px",
                        height: "24px",
                        background: layer.locked
                          ? "var(--bg-button-active)"
                          : "var(--bg-button)",
                        border: "2px outset var(--border-raised)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "12px",
                        borderRadius: "2px",
                        transition: "all 0.1s ease",
                        color: layer.locked
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                      }}
                      title={`${
                        layer.locked ? "Unlock" : "Lock"
                      } layer (Ctrl+L)`}
                      onMouseDown={(e) => {
                        e.currentTarget.style.border =
                          "2px inset var(--border-sunken)";
                        e.currentTarget.style.transform = "translateY(1px)";
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.border =
                          "2px outset var(--border-raised)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.border =
                          "2px outset var(--border-raised)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {layer.locked ? "🔒" : "🔓"}
                    </button>

                    {/* Layer Info & Name */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {renamingLayerId === layer.id ? (
                        <input
                          ref={renamingInputRef}
                          type="text"
                          defaultValue={layer.name}
                          onBlur={(e) =>
                            handleLayerRename(layer.id, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleLayerRename(
                                layer.id,
                                e.currentTarget.value
                              );
                            } else if (e.key === "Escape") {
                              setRenamingLayerId(null);
                            }
                          }}
                          style={{
                            width: "100%",
                            fontSize: "11px",
                            padding: "2px 4px",
                            border: "1px solid var(--border-raised)",
                            background: "var(--bg-input)",
                            color: "var(--text-primary)",
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onDragStart={(e) => e.preventDefault()}
                        />
                      ) : (
                        <div
                          style={{
                            fontSize: "11px",
                            fontWeight: "bold",
                            color: isSelected
                              ? "var(--text-titlebar)"
                              : layer.visible
                              ? "var(--text-primary)"
                              : "var(--text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            overflow: "hidden",
                          }}
                        >
                          <span style={{ fontSize: "14px" }}>
                            {getLayerIcon(layer.name)}
                          </span>
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {layer.name}
                          </span>
                          {layer.effectType && (
                            <span
                              style={{
                                fontSize: "8px",
                                background: isSelected
                                  ? "var(--text-titlebar)"
                                  : "var(--bg-content)",
                                color: isSelected
                                  ? "var(--text-primary)"
                                  : "var(--text-secondary)",
                                padding: "1px 3px",
                                borderRadius: "2px",
                                flexShrink: 0,
                              }}
                            >
                              FX
                            </span>
                          )}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: "9px",
                          color: isSelected
                            ? "var(--text-secondary)"
                            : "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          marginTop: "1px",
                        }}
                      >
                        <span>#{index + 1}</span>
                        <span>•</span>
                        <span>{layer.opacity}%</span>
                        {layer.locked && (
                          <>
                            <span>•</span>
                            <span style={{ color: "var(--text-secondary)" }}>
                              LOCKED
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Quick Opacity Controls - Improved */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        alignItems: "center",
                      }}
                      className="no-drag"
                    >
                      {[100, 75, 50, 25].map((opacity) => (
                        <button
                          key={opacity}
                          className="win99-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!layer.locked) {
                              handleQuickOpacity(layer.id, opacity);
                            }
                          }}
                          disabled={layer.locked}
                          style={{
                            width: "16px",
                            height: "6px",
                            background:
                              layer.opacity === opacity
                                ? isSelected
                                  ? "var(--bg-button-active)"
                                  : "var(--bg-button-hover)"
                                : isSelected
                                ? "var(--bg-button)"
                                : "var(--bg-content)",
                            cursor: layer.locked ? "not-allowed" : "pointer",
                            opacity: layer.locked ? 0.3 : 1,
                            border: "1px outset var(--border-raised)",
                            borderRadius: "1px",
                            transition: "all 0.1s ease",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onMouseDown={(e) => {
                            if (!layer.locked) {
                              e.currentTarget.style.border =
                                "1px inset var(--border-sunken)";
                              e.currentTarget.style.transform =
                                "translateY(1px)";
                            }
                          }}
                          onMouseUp={(e) => {
                            if (!layer.locked) {
                              e.currentTarget.style.border =
                                "1px outset var(--border-raised)";
                              e.currentTarget.style.transform = "translateY(0)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!layer.locked) {
                              e.currentTarget.style.border =
                                "1px outset var(--border-raised)";
                              e.currentTarget.style.transform = "translateY(0)";
                            }
                          }}
                          title={`Set opacity to ${opacity}%`}
                        />
                      ))}
                    </div>

                    {/* Expand/Collapse Toggle */}
                    <button
                      className="win99-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerExpanded(layer.id);
                      }}
                      style={{
                        width: "18px",
                        height: "18px",
                        background: isSelected
                          ? "var(--bg-button-hover)"
                          : "var(--bg-button)",
                        border: "2px outset var(--border-raised)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        fontSize: "9px",
                        color: isSelected
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                        borderRadius: "2px",
                        transition: "all 0.1s ease",
                      }}
                      title={isExpanded ? "Collapse details" : "Expand details"}
                      onMouseDown={(e) => {
                        e.currentTarget.style.border =
                          "2px inset var(--border-sunken)";
                        e.currentTarget.style.transform = "translateY(1px)";
                      }}
                      onMouseUp={(e) => {
                        e.currentTarget.style.border =
                          "2px outset var(--border-raised)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.border =
                          "2px outset var(--border-raised)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {isExpanded ? "▼" : "▶"}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div
                    style={{
                      borderTop:
                        "1px solid " + (isSelected ? "#ffffff" : "#e0e0e0"),
                      paddingTop: "8px",
                      marginTop: "4px",
                    }}
                    className="no-drag"
                  >
                    {/* Layer Preview - Responsive */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: "6px",
                      }}
                    >
                      <img
                        src={layer.imageData}
                        alt={`${layer.name} preview`}
                        style={{
                          width: "100%",
                          maxWidth: "80px",
                          height: "50px",
                          objectFit: "cover",
                          border: isSelected
                            ? "2px solid var(--text-titlebar)"
                            : "1px solid var(--border-window)",
                          borderRadius: "2px",
                          opacity: layer.visible ? 1 : 0.5,
                          cursor: "pointer",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Could implement preview zoom
                        }}
                        title="Click to view full size"
                      />
                    </div>

                    {/* Layer Actions - Improved Grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: "3px",
                        marginBottom: "6px",
                      }}
                    >
                      {/* Edit Button */}
                      {layer.effectType && !layer.locked && (
                        <button
                          className="win99-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditLayer(layer.id);
                          }}
                          style={{
                            padding: "4px 6px",
                            fontSize: "9px",
                            background: "var(--bg-button-hover)",
                            color: "var(--text-primary)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "2px",
                            gridColumn: "1 / -1",
                            border: "2px outset var(--border-raised)",
                            fontWeight: "bold",
                            transition: "all 0.1s ease",
                            minHeight: "24px",
                          }}
                          onMouseDown={(e) => {
                            e.currentTarget.style.border =
                              "2px inset var(--border-sunken)";
                            e.currentTarget.style.transform = "translateY(1px)";
                          }}
                          onMouseUp={(e) => {
                            e.currentTarget.style.border =
                              "2px outset var(--border-raised)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.border =
                              "2px outset var(--border-raised)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                          title="Edit effect parameters"
                        >
                          <span style={{ fontSize: "10px" }}>🔧</span>
                          <span>Edit FX</span>
                        </button>
                      )}

                      {/* Move Up Button */}
                      <button
                        className="win99-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveLayer(index, "up");
                        }}
                        disabled={index === 0 || layer.locked}
                        style={{
                          padding: "4px 2px",
                          fontSize: "8px",
                          background:
                            index === 0 || layer.locked
                              ? "var(--bg-button)"
                              : "var(--bg-button-hover)",
                          color: "var(--text-primary)",
                          cursor:
                            index === 0 || layer.locked
                              ? "not-allowed"
                              : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "1px",
                          border: "2px outset var(--border-raised)",
                          opacity: index === 0 || layer.locked ? 0.5 : 1,
                          transition: "all 0.1s ease",
                          minHeight: "24px",
                        }}
                        onMouseDown={(e) => {
                          if (!(index === 0 || layer.locked)) {
                            e.currentTarget.style.border =
                              "2px inset var(--border-sunken)";
                            e.currentTarget.style.transform = "translateY(1px)";
                          }
                        }}
                        onMouseUp={(e) => {
                          if (!(index === 0 || layer.locked)) {
                            e.currentTarget.style.border =
                              "2px outset var(--border-raised)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!(index === 0 || layer.locked)) {
                            e.currentTarget.style.border =
                              "2px outset var(--border-raised)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }
                        }}
                        title={
                          layer.locked
                            ? "Layer is locked"
                            : index === 0
                            ? "Already at top"
                            : "Move layer up (Ctrl+↑)"
                        }
                      >
                        <span style={{ fontSize: "10px" }}>⬆️</span>
                        <span>Up</span>
                      </button>

                      {/* Move Down Button */}
                      <button
                        className="win99-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveLayer(index, "down");
                        }}
                        disabled={index === layers.length - 1 || layer.locked}
                        style={{
                          padding: "4px 2px",
                          fontSize: "8px",
                          background:
                            index === layers.length - 1 || layer.locked
                              ? "var(--bg-button)"
                              : "var(--bg-button-hover)",
                          color: "var(--text-primary)",
                          cursor:
                            index === layers.length - 1 || layer.locked
                              ? "not-allowed"
                              : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "1px",
                          border: "2px outset var(--border-raised)",
                          opacity:
                            index === layers.length - 1 || layer.locked
                              ? 0.5
                              : 1,
                          transition: "all 0.1s ease",
                          minHeight: "24px",
                        }}
                        onMouseDown={(e) => {
                          if (!(index === layers.length - 1 || layer.locked)) {
                            e.currentTarget.style.border =
                              "2px inset var(--border-sunken)";
                            e.currentTarget.style.transform = "translateY(1px)";
                          }
                        }}
                        onMouseUp={(e) => {
                          if (!(index === layers.length - 1 || layer.locked)) {
                            e.currentTarget.style.border =
                              "2px outset var(--border-raised)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!(index === layers.length - 1 || layer.locked)) {
                            e.currentTarget.style.border =
                              "2px outset var(--border-raised)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }
                        }}
                        title={
                          layer.locked
                            ? "Layer is locked"
                            : index === layers.length - 1
                            ? "Already at bottom"
                            : "Move layer down (Ctrl+↓)"
                        }
                      >
                        <span style={{ fontSize: "10px" }}>⬇️</span>
                        <span>Down</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        className="win99-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!layer.locked) {
                            onLayerRemove(layer.id);
                          }
                        }}
                        disabled={layer.locked}
                        style={{
                          padding: "4px 2px",
                          fontSize: "8px",
                          background: layer.locked
                            ? "var(--bg-button)"
                            : "#ffcccc",
                          color: "var(--text-primary)",
                          cursor: layer.locked ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "1px",
                          border: "2px outset var(--border-raised)",
                          opacity: layer.locked ? 0.5 : 1,
                          transition: "all 0.1s ease",
                          minHeight: "24px",
                        }}
                        onMouseDown={(e) => {
                          if (!layer.locked) {
                            e.currentTarget.style.border =
                              "2px inset var(--border-sunken)";
                            e.currentTarget.style.transform = "translateY(1px)";
                          }
                        }}
                        onMouseUp={(e) => {
                          if (!layer.locked) {
                            e.currentTarget.style.border =
                              "2px outset var(--border-raised)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!layer.locked) {
                            e.currentTarget.style.border =
                              "2px outset var(--border-raised)";
                            e.currentTarget.style.transform = "translateY(0)";
                          }
                        }}
                        title={
                          layer.locked
                            ? "Layer is locked"
                            : "Delete layer (Del)"
                        }
                      >
                        <span style={{ fontSize: "10px" }}>🗑️</span>
                        <span>Del</span>
                      </button>
                    </div>

                    {/* Blend Mode Control */}
                    <div style={{ marginBottom: "6px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "2px",
                          fontSize: "9px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "bold",
                            color: isSelected ? "#ffffff" : "#000000",
                          }}
                        >
                          Blend:
                        </span>
                        <span
                          style={{
                            fontSize: "8px",
                            color: isSelected ? "#e0e0ff" : "#666",
                          }}
                        >
                          {blendModes.find((b) => b.value === layer.blendMode)
                            ?.label || layer.blendMode}
                        </span>
                      </div>
                      <select
                        value={layer.blendMode}
                        onChange={(e) =>
                          !layer.locked &&
                          handleBlendModeChange(layer.id, e.target.value)
                        }
                        disabled={layer.locked}
                        style={{
                          width: "100%",
                          fontSize: "9px",
                          padding: "2px",
                          background: "var(--bg-input)",
                          border: "1px inset var(--border-window)",
                          opacity: layer.locked ? 0.5 : 1,
                          color: "#000000",
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onDragStart={(e) => e.preventDefault()}
                      >
                        {blendModes.map((mode) => (
                          <option key={mode.value} value={mode.value}>
                            {mode.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Opacity Control - Compact */}
                    <div style={{ marginBottom: "6px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "2px",
                          fontSize: "9px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "bold",
                            color: isSelected ? "#ffffff" : "#000000",
                          }}
                        >
                          Opacity:
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={layer.opacity}
                          onChange={(e) =>
                            !layer.locked &&
                            handleOpacityChange(
                              layer.id,
                              Math.max(
                                0,
                                Math.min(100, parseInt(e.target.value) || 0)
                              )
                            )
                          }
                          disabled={layer.locked}
                          style={{
                            width: "35px",
                            fontSize: "8px",
                            padding: "1px 2px",
                            border: "1px inset var(--border-window)",
                            background: "var(--bg-input)",
                            color: "#000000",
                            textAlign: "center",
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onDragStart={(e) => e.preventDefault()}
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={layer.opacity}
                        onChange={(e) =>
                          !layer.locked &&
                          handleOpacityChange(
                            layer.id,
                            parseInt(e.target.value)
                          )
                        }
                        className="win99-slider"
                        style={{
                          width: "100%",
                          opacity: layer.locked ? 0.5 : 1,
                        }}
                        disabled={layer.locked}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onDragStart={(e) => e.preventDefault()}
                      />
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "7px",
                          color: isSelected ? "#e0e0ff" : "#666",
                          marginTop: "1px",
                        }}
                      >
                        <span>0%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Layer Info - Compact */}
                    <div
                      style={{
                        padding: "3px",
                        background: isSelected
                          ? "rgba(255, 255, 255, 0.1)"
                          : "rgba(0, 0, 0, 0.05)",
                        border:
                          "1px solid " +
                          (isSelected
                            ? "var(--text-titlebar)"
                            : "var(--border-sunken)"),
                        borderRadius: "2px",
                        fontSize: "8px",
                      }}
                    >
                      <div
                        style={{
                          color: isSelected ? "#ffffff" : "#000000",
                          marginBottom: "1px",
                          fontWeight: "bold",
                        }}
                      >
                        Info
                      </div>
                      <div
                        style={{
                          color: isSelected ? "#e0e0ff" : "#666",
                          lineHeight: "1.2",
                        }}
                      >
                        <div>
                          #{index + 1}/{layers.length} • {layer.opacity}%
                        </div>
                        <div>
                          {layer.visible ? "Visible" : "Hidden"}
                          {layer.locked && " • Locked"}
                        </div>
                        <div>
                          {
                            blendModes.find((b) => b.value === layer.blendMode)
                              ?.label
                          }
                        </div>
                        {layer.effectType && <div>FX: {layer.effectType}</div>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: "fixed",
            left: contextMenu.x,
            top: contextMenu.y,
            background: "var(--bg-window)",
            border: "2px outset var(--border-window)",
            borderRadius: "0",
            boxShadow: "2px 2px 4px rgba(0, 0, 0, 0.3)",
            zIndex: 1000,
            minWidth: "120px",
            fontSize: "11px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            onClick={() => {
              const layer = layers.find((l) => l.id === contextMenu.layerId);
              if (layer) {
                handleVisibilityToggle(contextMenu.layerId, layer.visible);
              }
              setContextMenu(null);
            }}
            style={{
              padding: "4px 8px",
              cursor: "pointer",
              borderBottom: "1px solid #808080",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#0000ff";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#000000";
            }}
          >
            👁️ Toggle Visibility
          </div>
          <div
            onClick={() => {
              const layer = layers.find((l) => l.id === contextMenu.layerId);
              if (layer) {
                handleLockToggle(contextMenu.layerId, layer.locked);
              }
              setContextMenu(null);
            }}
            style={{
              padding: "4px 8px",
              cursor: "pointer",
              borderBottom: "1px solid #808080",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#0000ff";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#000000";
            }}
          >
            🔒 Toggle Lock
          </div>
          <div
            onClick={() => {
              setRenamingLayerId(contextMenu.layerId);
              setContextMenu(null);
            }}
            style={{
              padding: "4px 8px",
              cursor: "pointer",
              borderBottom: "1px solid #808080",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#0000ff";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#000000";
            }}
          >
            ✏️ Rename
          </div>
          <div
            onClick={() => handleDuplicateLayer(contextMenu.layerId)}
            style={{
              padding: "4px 8px",
              cursor: "pointer",
              borderBottom: "1px solid #808080",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#0000ff";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#000000";
            }}
          >
            📋 Duplicate
          </div>
          <div
            onClick={() => {
              const layer = layers.find((l) => l.id === contextMenu.layerId);
              if (layer && !layer.locked) {
                onLayerRemove(contextMenu.layerId);
              }
              setContextMenu(null);
            }}
            style={{
              padding: "4px 8px",
              cursor: "pointer",
              color: "#cc0000",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#cc0000";
              e.currentTarget.style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#cc0000";
            }}
          >
            🗑️ Delete
          </div>
        </div>
      )}

      {/* Compact Help */}
      {layers.length > 0 && (
        <div
          style={{
            marginTop: "6px",
            padding: "3px",
            background: "rgba(0, 0, 0, 0.05)",
            border: "1px solid var(--border-sunken)",
            borderRadius: "2px",
            fontSize: "7px",
            color: "#666",
            lineHeight: "1.3",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "1px" }}>
            💡 Quick tips:
          </div>
          <div>Double-click: rename • Right-click: menu</div>
          <div>Ctrl+V: show/hide • Ctrl+L: lock</div>
          <div>Del: delete • ↑↓: navigate</div>
        </div>
      )}
    </div>
  );
};
