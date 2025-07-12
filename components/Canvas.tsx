import React, { useRef, useEffect, useState, useCallback } from "react";

interface CanvasProps {
  baseImage: string | null;
  compositeImage: string | null;
  previewData: string | null;
  isPreviewMode: boolean;
  currentTool: string;
  onImageChange: (imageData: string) => void;
  onToolComplete?: () => void;
  zoom: number;
  setZoom: (zoom: number) => void;
}

// Custom hook for Navigator dragging
const useNavigatorDrag = (
  containerRef: React.RefObject<HTMLDivElement>,
  navigatorElementRef: React.RefObject<HTMLDivElement>,
  initialPosition: { x: number; y: number },
  isMinimized: boolean
) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef(initialPosition);
  const animationFrameRef = useRef<number>();

  // Update position with throttling for performance
  const updatePosition = useCallback((newPosition: { x: number; y: number }) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      if (navigatorElementRef.current) {
        navigatorElementRef.current.style.left = `${8 + newPosition.x}px`;
        navigatorElementRef.current.style.top = `${8 + newPosition.y}px`;
        positionRef.current = newPosition;
      }
    });
  }, [navigatorElementRef]);

  // Constrain position within container bounds
  const constrainPosition = useCallback((pos: { x: number; y: number }) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return pos;

    // Use dimensions based on minimized state
    const navWidth = isMinimized ? 40 : 140; // Minimized vs expanded width
    const navHeight = isMinimized ? 24 : 140; // Minimized vs expanded height
    
    return {
      x: Math.max(24, Math.min(pos.x, containerRect.width - navWidth - 24)),
      y: Math.max(24, Math.min(pos.y, containerRect.height - navHeight - 24)),
    };
  }, [containerRef, isMinimized]);

  // Calculate new position from client coordinates
  const calculatePosition = useCallback((clientX: number, clientY: number) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return positionRef.current;

    const newX = clientX - containerRect.left - dragOffsetRef.current.x;
    const newY = clientY - containerRect.top - dragOffsetRef.current.y;
    
    return constrainPosition({ x: newX, y: newY });
  }, [containerRef, constrainPosition]);

  // Unified drag start handler
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    const rect = navigatorElementRef.current?.getBoundingClientRect();
    if (!rect) return;

    dragOffsetRef.current = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
    setIsDragging(true);
  }, [navigatorElementRef]);

  // Unified drag move handler
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;
    
    const newPosition = calculatePosition(clientX, clientY);
    updatePosition(newPosition);
  }, [isDragging, calculatePosition, updatePosition]);

  // Unified drag end handler
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    // Sync state with ref position
    setPosition(positionRef.current);
  }, []);

  // Mouse event handlers
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    handleDragStart(event.clientX, event.clientY);
  }, [handleDragStart]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    handleDragMove(event.clientX, event.clientY);
  }, [handleDragMove]);

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Touch event handlers
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const touch = event.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (event.touches.length === 1) {
      event.preventDefault();
      const touch = event.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
    }
  }, [handleDragMove]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Global event handlers for smooth dragging
  useEffect(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (isDragging) {
        handleDragMove(event.clientX, event.clientY);
      }
    };

    const handleGlobalTouchMove = (event: TouchEvent) => {
      if (isDragging && event.touches.length === 1) {
        event.preventDefault();
        const touch = event.touches[0];
        handleDragMove(touch.clientX, touch.clientY);
      }
    };

    const handleGlobalMouseUp = () => {
      handleDragEnd();
    };

    const handleGlobalTouchEnd = () => {
      handleDragEnd();
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Update position when container size changes
  useEffect(() => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect && position.x === 0 && position.y === 0) {
      // Calculate Navigator dimensions based on its structure
      // Expanded: ~140px width, ~140px height (header + content + controls + info)
      // Minimized: ~40px width, ~24px height (header only)
      // Use expanded dimensions for initial positioning to ensure it fits when expanded
      const navWidth = 140; // Expanded width
      const navHeight = 140; // Expanded height
      
      // Position in bottom right with generous spacing
      const maxX = Math.max(24, containerRect.width - navWidth - 24);
      const maxY = Math.max(24, containerRect.height - navHeight - 24);
      
      const newPosition = { x: maxX, y: maxY };
      setPosition(newPosition);
      positionRef.current = newPosition;
    }
  }, [containerRef, position.x, position.y, isMinimized]);

  // Adjust position when minimized state changes to prevent overflow
  useEffect(() => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (containerRect) {
      const navWidth = isMinimized ? 40 : 140;
      const navHeight = isMinimized ? 24 : 140;
      
      // Check if current position would cause overflow
      const maxX = Math.max(24, containerRect.width - navWidth - 24);
      const maxY = Math.max(24, containerRect.height - navHeight - 24);
      
      if (position.x > maxX || position.y > maxY) {
        const newPosition = { x: maxX, y: maxY };
        setPosition(newPosition);
        positionRef.current = newPosition;
      }
    }
  }, [isMinimized, containerRef, position.x, position.y]);

  return {
    position,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};

export const Canvas: React.FC<CanvasProps> = ({
  baseImage,
  compositeImage,
  previewData,
  isPreviewMode,
  currentTool,
  onImageChange,
  onToolComplete,
  zoom,
  setZoom,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Navigator state
  const [isNavigatorMinimized, setIsNavigatorMinimized] = useState(false);
  const navigatorElementRef = useRef<HTMLDivElement>(null);
  
  // Use the custom drag hook
  const {
    position: navigatorPosition,
    isDragging: isDraggingNavigator,
    handleMouseDown: handleNavigatorMouseDown,
    handleMouseMove: handleNavigatorMouseMove,
    handleMouseUp: handleNavigatorMouseUp,
    handleTouchStart: handleNavigatorTouchStart,
    handleTouchMove: handleNavigatorTouchMove,
    handleTouchEnd: handleNavigatorTouchEnd,
  } = useNavigatorDrag(containerRef, navigatorElementRef, { x: 0, y: 0 }, isNavigatorMinimized);

  // Tool-specific state
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [cropSelection, setCropSelection] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    active: boolean;
  } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [rotation, setRotation] = useState(0);

  // Enable crop selection when crop tool is active
  useEffect(() => {
    if (currentTool === "crop") {
      console.log("Crop tool activated");
      setCropSelection({
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
        active: false,
      });
    } else {
      if (cropSelection) {
        console.log("Crop tool deactivated, clearing selection");
      }
      setCropSelection(null);
    }
  }, [currentTool]);

  // Rotate tool is handled in handleMouseDown when user clicks

  // Get the current image to display (priority: preview > composite > base)
  const currentImage =
    isPreviewMode && previewData ? previewData : compositeImage || baseImage;

  // Convert zoom percentage to decimal for calculations
  const zoomLevel = zoom / 100;

  // Update canvas size based on container
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        
        // Get viewport dimensions for mobile optimization
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const isMobile = viewportWidth <= 768;
        
        // Calculate available space more aggressively on mobile
        let maxWidth, maxHeight;
        
        if (isMobile) {
          // On mobile, use viewport dimensions with minimal padding
          // Account for UI elements (toolbar, status bar, etc.)
          const uiHeight = 140; // Approximate height of toolbar + status bar + safe area
          const uiWidth = 16; // Minimal horizontal padding
          
          maxWidth = viewportWidth - uiWidth;
          maxHeight = viewportHeight - uiHeight;
          
          // Ensure minimum usable size
          maxWidth = Math.max(maxWidth, 300);
          maxHeight = Math.max(maxHeight, 200);
        } else {
          // Desktop: use container dimensions with minimal padding
          maxWidth = rect.width - 40;
          maxHeight = rect.height - 40;
        }
        
        setCanvasSize({ width: maxWidth, height: maxHeight });
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  // Draw image on canvas
  useEffect(() => {
    if (!currentImage || !canvasRef.current) {
      setImageLoaded(false);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsLoading(true);
    const img = new Image();

    img.onload = () => {
      // Calculate display size maintaining aspect ratio, prioritizing maximum size
      const aspectRatio = img.width / img.height;
      const containerAspectRatio = canvasSize.width / canvasSize.height;
      
      let displayWidth, displayHeight;
      
      // Always use the maximum possible size while maintaining aspect ratio
      if (aspectRatio > containerAspectRatio) {
        // Image is wider than container - fit to width
        displayWidth = canvasSize.width;
        displayHeight = displayWidth / aspectRatio;
      } else {
        // Image is taller than container - fit to height
        displayHeight = canvasSize.height;
        displayWidth = displayHeight * aspectRatio;
      }

      // On mobile, be more aggressive about using available space
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        // Ensure we use at least 90% of available space on mobile
        const minSizeRatio = 0.9;
        const currentSizeRatio = Math.min(displayWidth / canvasSize.width, displayHeight / canvasSize.height);
        
        if (currentSizeRatio < minSizeRatio) {
          if (aspectRatio > containerAspectRatio) {
            displayWidth = canvasSize.width * minSizeRatio;
            displayHeight = displayWidth / aspectRatio;
          } else {
            displayHeight = canvasSize.height * minSizeRatio;
            displayWidth = displayHeight * aspectRatio;
          }
        }
      } else {
        // Desktop: ensure minimum size for small containers
        const minSize = Math.min(canvasSize.width, canvasSize.height) * 0.8;
        if (displayWidth < minSize || displayHeight < minSize) {
          if (displayWidth < displayHeight) {
            displayWidth = minSize;
            displayHeight = displayWidth / aspectRatio;
          } else {
            displayHeight = minSize;
            displayWidth = displayHeight * aspectRatio;
          }
        }
      }

      canvas.width = displayWidth;
      canvas.height = displayHeight;

      // Clear and draw image with transformations
      ctx.save();

      // Apply zoom and pan
      ctx.scale(zoomLevel, zoomLevel);
      ctx.translate(panOffset.x / zoomLevel, panOffset.y / zoomLevel);

      // Apply rotation
      if (rotation !== 0) {
        ctx.translate(displayWidth / 2, displayHeight / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-displayWidth / 2, -displayHeight / 2);
      }

      ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
      ctx.restore();

      // Draw tool overlays
      drawToolOverlays(ctx, displayWidth, displayHeight);

      setImageLoaded(true);
      setIsLoading(false);
    };

    img.onerror = () => {
      setIsLoading(false);
      setImageLoaded(false);
    };

    img.src = currentImage;
  }, [
    currentImage,
    canvasSize,
    zoomLevel,
    panOffset,
    rotation,
    cropSelection,
    currentTool,
  ]);

  const drawToolOverlays = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Draw crop selection
    if (currentTool === "crop" && cropSelection && cropSelection.active) {
      const { startX, startY, endX, endY } = cropSelection;

      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = "#ff0000";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        Math.min(startX, endX),
        Math.min(startY, endY),
        Math.abs(endX - startX),
        Math.abs(endY - startY)
      );

      // Draw semi-transparent overlay outside selection
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#000000";

      const selLeft = Math.min(startX, endX);
      const selTop = Math.min(startY, endY);
      const selWidth = Math.abs(endX - startX);
      const selHeight = Math.abs(endY - startY);

      // Top
      ctx.fillRect(0, 0, width, selTop);
      // Bottom
      ctx.fillRect(0, selTop + selHeight, width, height - (selTop + selHeight));
      // Left
      ctx.fillRect(0, selTop, selLeft, selHeight);
      // Right
      ctx.fillRect(
        selLeft + selWidth,
        selTop,
        width - (selLeft + selWidth),
        selHeight
      );

      ctx.restore();
    }

    // Show tool hint
    if (currentTool === "crop" && !cropSelection?.active) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, width, 30);
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Click and drag to select crop area", width / 2, 20);
      ctx.restore();
    }

    if (currentTool === "rotate") {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, width, 30);
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Click anywhere to rotate 90° clockwise", width / 2, 20);
      ctx.restore();
    }
  };

  const getCanvasCoordinates = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(event);
    console.log("Mouse down at:", coords, "Current tool:", currentTool);

    if (currentTool === "crop" && cropSelection) {
      console.log("Starting crop selection");
      setIsDrawing(true);
      setCropSelection({
        startX: coords.x,
        startY: coords.y,
        endX: coords.x,
        endY: coords.y,
        active: true,
      });
    } else if (currentTool === "rotate" && currentImage) {
      console.log("Rotate clicked");
      // Rotate on click when rotate tool is selected
      handleRotate();
    } else if (currentImage) {
      setIsDrawing(true);
      // Store initial mouse position for panning
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const coords = getCanvasCoordinates(event);

    if (currentTool === "crop" && cropSelection) {
      setCropSelection({
        ...cropSelection,
        endX: coords.x,
        endY: coords.y,
      });
    } else if (currentImage) {
      // Update pan offset based on mouse movement
      const deltaX = event.movementX;
      const deltaY = event.movementY;
      setPanOffset((prev) => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY,
      }));
    }
  };

  const handleMouseUp = () => {
    console.log("Mouse up, isDrawing:", isDrawing, "currentTool:", currentTool);

    if (
      currentTool === "crop" &&
      cropSelection &&
      isDrawing &&
      cropSelection.active
    ) {
      console.log("Crop selection complete, applying crop");
      // Apply crop
      applyCrop();
    }

    setIsDrawing(false);
  };

  const applyCrop = useCallback(async () => {
    if (
      !cropSelection ||
      !currentImage ||
      !canvasRef.current ||
      !cropSelection.active
    )
      return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      setIsLoading(true);

      const img = new Image();
      img.onload = () => {
        // Calculate crop area relative to canvas display size, then scale to original image
        const displayWidth = canvas.width;
        const displayHeight = canvas.height;

        // Get actual crop coordinates
        const cropLeft = Math.min(cropSelection.startX, cropSelection.endX);
        const cropTop = Math.min(cropSelection.startY, cropSelection.endY);
        const cropWidth = Math.abs(cropSelection.endX - cropSelection.startX);
        const cropHeight = Math.abs(cropSelection.endY - cropSelection.startY);

        // Ensure we have a valid crop area
        if (cropWidth < 10 || cropHeight < 10) {
          alert("Crop area too small. Please select a larger area.");
          setIsLoading(false);
          return;
        }

        // Scale coordinates to original image size
        const scaleX = img.width / displayWidth;
        const scaleY = img.height / displayHeight;

        const sourceCropX = cropLeft * scaleX;
        const sourceCropY = cropTop * scaleY;
        const sourceCropWidth = cropWidth * scaleX;
        const sourceCropHeight = cropHeight * scaleY;

        // Create new canvas for cropped image
        const cropCanvas = document.createElement("canvas");
        const cropCtx = cropCanvas.getContext("2d");
        if (!cropCtx) {
          setIsLoading(false);
          return;
        }

        cropCanvas.width = sourceCropWidth;
        cropCanvas.height = sourceCropHeight;

        // Draw cropped portion
        cropCtx.drawImage(
          img,
          sourceCropX,
          sourceCropY,
          sourceCropWidth,
          sourceCropHeight,
          0,
          0,
          sourceCropWidth,
          sourceCropHeight
        );

        // Convert to data URL and update image
        const croppedImageData = cropCanvas.toDataURL("image/png", 1.0);
        onImageChange(croppedImageData);

        // Clear crop selection and reset tool
        setCropSelection(null);
        setIsLoading(false);

        // Notify that the tool operation is complete
        if (onToolComplete) {
          onToolComplete();
        }

        // Notify success
        console.log("Crop applied successfully");
      };

      img.onerror = () => {
        console.error("Failed to load image for cropping");
        setIsLoading(false);
      };

      img.src = currentImage;
    } catch (error) {
      console.error("Error cropping image:", error);
      setIsLoading(false);
    }
  }, [cropSelection, currentImage, onImageChange, onToolComplete]);

  const handleRotate = useCallback(() => {
    if (!currentImage) {
      console.log("No image to rotate");
      return;
    }

    setIsLoading(true);
    console.log("Starting rotation...");

    // Apply rotation to actual image data
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsLoading(false);
      return;
    }

    const img = new Image();
    img.onload = () => {
      // For 90-degree rotation, swap width and height
      canvas.width = img.height;
      canvas.height = img.width;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Move to center, rotate, then draw
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2); // 90 degrees clockwise
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      const rotatedImageData = canvas.toDataURL("image/png", 1.0);
      onImageChange(rotatedImageData);

      setRotation(0); // Reset rotation state since it's now applied to image
      setIsLoading(false);

      console.log("Rotation applied successfully");
    };

    img.onerror = () => {
      console.error("Failed to load image for rotation");
      setIsLoading(false);
    };

    img.src = currentImage;
  }, [currentImage, onImageChange, onToolComplete]);

  const handleZoom = useCallback(
    (direction: "in" | "out") => {
      const newZoom = direction === "in" ? zoom * 1.2 : zoom / 1.2;
      setZoom(Math.max(10, Math.min(500, newZoom))); // Limit zoom between 10% and 500%
    },
    [zoom, setZoom]
  );

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      
      // Determine zoom direction based on wheel delta
      const direction = event.deltaY < 0 ? "in" : "out";
      
      // Apply zoom
      handleZoom(direction);
    },
    [handleZoom]
  );

  const resetView = useCallback(() => {
    setZoom(100);
    setPanOffset({ x: 0, y: 0 });
    setCropSelection(null);
  }, [setZoom]);

  const getCursorStyle = () => {
    switch (currentTool) {
      case "select":
        return "default";
      case "move":
        return "grab";
      case "crop":
        return "crosshair";
      case "rotate":
        return "pointer";
      case "zoom":
        return "zoom-in";
      case "fit":
        return "pointer";
      case "actual":
        return "pointer";
      case "brush":
        return "crosshair";
      case "eraser":
        return "crosshair";
      case "text":
        return "text";
      case "fill":
        return "pointer";
      default:
        return "default";
    }
  };

  // Navigator drag handlers are now handled by useNavigatorDrag hook

  // Global event handlers are now handled by useNavigatorDrag hook

  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(zoom);

  const getTouchCoordinates = (event: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const touch = event.touches[0];
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (event.touches.length === 2) {
      // Pinch start – store initial distance & zoom
      const [t1, t2] = Array.from(event.touches);
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      initialPinchDistanceRef.current = Math.hypot(dx, dy);
      initialZoomRef.current = zoom;
      return;
    }

    const coords = getTouchCoordinates(event);

    if (currentTool === "crop" && cropSelection) {
      setIsDrawing(true);
      setCropSelection({
        startX: coords.x,
        startY: coords.y,
        endX: coords.x,
        endY: coords.y,
        active: true,
      });
    } else if (currentTool === "rotate" && currentImage) {
      handleRotate();
    } else if (currentImage) {
      setIsDrawing(true);
      lastTouchRef.current = coords;
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (event.touches.length === 2 && initialPinchDistanceRef.current) {
      // Handle pinch-to-zoom
      const [t1, t2] = Array.from(event.touches);
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      const currentDistance = Math.hypot(dx, dy);
      const ratio = currentDistance / initialPinchDistanceRef.current;
      const newZoom = initialZoomRef.current * ratio * 100; // maintain percentage scale
      setZoom(Math.max(25, Math.min(500, newZoom)));
      return;
    }

    if (!isDrawing || event.touches.length !== 1) return;

    const coords = getTouchCoordinates(event);

    if (currentTool === "crop" && cropSelection) {
      setCropSelection({ ...cropSelection, endX: coords.x, endY: coords.y });
    } else if (currentImage && lastTouchRef.current) {
      const deltaX = coords.x - lastTouchRef.current.x;
      const deltaY = coords.y - lastTouchRef.current.y;
      setPanOffset((prev) => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      lastTouchRef.current = coords;
    }
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (
      currentTool === "crop" &&
      cropSelection &&
      isDrawing &&
      cropSelection.active &&
      event.touches.length === 0
    ) {
      applyCrop();
    }

    if (event.touches.length < 2) {
      initialPinchDistanceRef.current = null;
    }

    if (event.touches.length === 0) {
      lastTouchRef.current = null;
      setIsDrawing(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="win99-canvas-container"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: "var(--bg-content)",
        padding: "2px",
        overflow: "hidden",
      }}
    >
      {/* Canvas Tools Bar */}

      {/* Combined Navigator and Zoom Controls */}
      {currentImage && imageLoaded && (
        <div
          ref={navigatorElementRef}
          style={{
            position: "absolute",
            top: `${8 + navigatorPosition.y}px`,
            left: `${8 + navigatorPosition.x}px`,
            bottom: "auto",
            right: "auto",
            transform: "none",
            zIndex: 20,
            cursor: isDraggingNavigator ? "grabbing" : "grab",
            userSelect: "none",
            minWidth: "140px",
            maxWidth: "200px",
          }}
          onMouseDown={handleNavigatorMouseDown}
          onMouseMove={handleNavigatorMouseMove}
          onMouseUp={handleNavigatorMouseUp}
          onMouseLeave={handleNavigatorMouseUp}
          onTouchStart={handleNavigatorTouchStart}
          onTouchMove={handleNavigatorTouchMove}
          onTouchEnd={handleNavigatorTouchEnd}
        >
          <div
            className="win99-window"
            style={{
              background: "var(--bg-window)",
              border: "2px outset var(--border-window)",
              padding: "6px",
              minWidth: isNavigatorMinimized ? "40px" : "140px",
              transition: isDraggingNavigator ? "none" : "all 0.2s ease",
              position: "relative",
              opacity: isDraggingNavigator ? 0.8 : 1,
              boxShadow: isDraggingNavigator ? "0 4px 12px rgba(0,0,0,0.3)" : "none",
            }}
          >
            {/* Navigator Header with Minimize Button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: isNavigatorMinimized ? "0" : "4px",
                fontSize: "9px",
                fontWeight: "bold",
                color: "var(--text-primary)",
                borderBottom: isNavigatorMinimized ? "none" : "1px solid var(--border-sunken)",
                paddingBottom: isNavigatorMinimized ? "0" : "2px",
              }}
            >
              <span>
                Navigator
              </span>
              <button
                className="win99-button"
                onClick={() => setIsNavigatorMinimized(!isNavigatorMinimized)}
                style={{
                  fontSize: "8px",
                  padding: "1px 3px",
                  minHeight: "16px",
                  minWidth: "20px",
                  marginLeft: "4px",
                }}
                title={isNavigatorMinimized ? "Expand Navigator" : "Minimize Navigator"}
              >
                {isNavigatorMinimized ? "➕" : "−"}
              </button>
            </div>

            {/* Navigator Content */}
            {!isNavigatorMinimized && (
              <>
                <div
                  style={{
                    width: "120px",
                    height: "60px",
                    border: "1px inset var(--border-window)",
                    background: "var(--bg-input)",
                    position: "relative",
                    overflow: "hidden",
                    marginBottom: "6px",
                  }}
                >
                  <img
                    src={currentImage}
                    alt="Navigator"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      opacity: 0.8,
                    }}
                  />
                  {zoomLevel > 1 && (
                    <div
                      style={{
                        position: "absolute",
                        border: "1px solid var(--border-raised)",
                        background: "rgba(255, 255, 255, 0.2)",
                        left: `${Math.max(
                          0,
                          Math.min(
                            100 - 100 / zoomLevel,
                            -(panOffset.x / (canvasSize.width * zoomLevel)) * 100
                          )
                        )}%`,
                        top: `${Math.max(
                          0,
                          Math.min(
                            100 - 100 / zoomLevel,
                            -(panOffset.y / (canvasSize.height * zoomLevel)) * 100
                          )
                        )}%`,
                        width: `${100 / zoomLevel}%`,
                        height: `${100 / zoomLevel}%`,
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </div>

                {/* Zoom Controls Section */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "4px",
                    fontSize: "10px",
                  }}
                >
                  <button
                    className="win99-button"
                    onClick={() => setZoom(Math.max(25, zoom - 25))}
                    style={{
                      fontSize: "10px",
                      padding: "2px 4px",
                      minHeight: "20px",
                      minWidth: "24px",
                      fontWeight: "bold",
                    }}
                    title="Zoom Out"
                  >
                    -
                  </button>
                  <span
                    style={{
                      minWidth: "40px",
                      textAlign: "center",
                      fontWeight: "bold",
                      fontSize: "9px",
                    }}
                  >
                    {Math.round(zoom)}%
                  </span>
                  <button
                    className="win99-button"
                    onClick={() => setZoom(Math.min(500, zoom + 25))}
                    style={{
                      fontSize: "10px",
                      padding: "2px 4px",
                      minHeight: "20px",
                      minWidth: "24px",
                      fontWeight: "bold",
                    }}
                    title="Zoom In"
                  >
                    +
                  </button>
                  <button
                    className="win99-button"
                    onClick={() => {
                      setZoom(100);
                      setPanOffset({ x: 0, y: 0 });
                    }}
                    style={{
                      fontSize: "8px",
                      padding: "2px 4px",
                      minHeight: "20px",
                      minWidth: "28px",
                    }}
                    title="Reset zoom and center image"
                  >
                    Reset
                  </button>
                </div>

                {/* Canvas Info Section */}
                <div
                  style={{
                    fontSize: "8px",
                    textAlign: "center",
                    color: "var(--text-secondary)",
                    borderTop: "1px solid var(--border-sunken)",
                    paddingTop: "4px",
                    marginTop: "4px",
                  }}
                >
                  <div>
                    {canvasSize.width} × {canvasSize.height}
                    {imageLoaded && (
                      <span style={{ marginLeft: "4px", color: "var(--text-primary)" }}>✓</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Debug info */}
      {currentImage && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            background: "var(--bg-window)",
            border: "1px solid var(--border-sunken)",
            padding: "4px",
            fontSize: "8px",
            color: "var(--text-primary)",
            zIndex: 15,
          }}
        >
          <div>Zoom: {Math.round(zoom)}%</div>
          <div>
            Pan: {Math.round(panOffset.x)}, {Math.round(panOffset.y)}
          </div>
          {rotation !== 0 && <div>Rotation: {rotation}°</div>}
        </div>
      )}

      {/* Tool Controls */}
      {currentImage && (currentTool === "crop" || currentTool === "rotate") && (
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            left: "8px",
            display: "flex",
            gap: "2px",
            background: "var(--bg-window)",
            border: "2px outset var(--border-window)",
            padding: "2px",
            borderRadius: "2px",
            zIndex: 20,
          }}
        >
          {currentTool === "crop" && (
            <>
              {cropSelection && cropSelection.active && (
                <div
                  className="win99-button"
                  onClick={applyCrop}
                  style={{ fontSize: "10px", padding: "2px 6px" }}
                  title="Apply Crop"
                >
                  ✂️ Crop
                </div>
              )}
              <div
                className="win99-button"
                onClick={() => {
                  setCropSelection(null);
                  onToolComplete?.();
                }}
                style={{
                  fontSize: "10px",
                  padding: "2px 6px",
                  background: "var(--bg-button-hover)",
                  borderColor: "var(--border-window)",
                }}
                title="Cancel Crop"
              >
                ❌ Cancel Crop
              </div>
            </>
          )}

          {currentTool === "rotate" && (
            <>
              <div
                className="win99-button"
                onClick={handleRotate}
                style={{ fontSize: "10px", padding: "2px 6px" }}
                title="Rotate 90° Clockwise"
              >
                🔄 Rotate
              </div>
              <div
                className="win99-button"
                onClick={() => {
                  onToolComplete?.();
                }}
                style={{
                  fontSize: "10px",
                  padding: "2px 6px",
                  background: "var(--bg-button-hover)",
                  borderColor: "var(--border-window)",
                }}
                title="Finish Rotation"
              >
                ✅ Done
              </div>
            </>
          )}
        </div>
      )}

      {currentImage ? (
        <div style={{ position: "relative" }}>
          {/* Preview Mode Banner */}
          {isPreviewMode && (
            <div
              style={{
                position: "absolute",
                top: "-30px",
                left: "0",
                right: "0",
                background: "linear-gradient(90deg, var(--bg-button-pressed) 0%, var(--bg-button-active) 100%)",
                color: "var(--text-primary)",
                padding: "4px 8px",
                fontSize: "11px",
                fontWeight: "bold",
                textAlign: "center",
                border: "2px outset var(--border-raised)",
                zIndex: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
              }}
            >
              <span>👁️</span>
              <span>LIVE PREVIEW: {previewData ? "Preview" : "Composite"}</span>
              <span>👁️</span>
            </div>
          )}

          <canvas
            ref={canvasRef}
            className="win99-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsDrawing(false)}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              cursor: getCursorStyle(),
              maxWidth: "100%",
              maxHeight: "100%",
              opacity: 1, // Removed isCompositing prop
              transition: "opacity 0.3s ease",
              border: isPreviewMode ? "3px solid var(--border-raised)" : "1px solid var(--border-sunken)",
              boxShadow: isPreviewMode
                ? "0 0 10px rgba(255, 255, 0, 0.5)"
                : "inset -1px -1px var(--border-sunken), inset 1px 1px var(--border-raised)",
              touchAction: "none", // Prevent browser gestures
            }}
          />
        </div>
      ) : (
        /* No Image State - Upload Area */
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
            minHeight: "300px",
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
            <div style={{ fontSize: "48px" }}>🖼️</div>
            <div>No Image</div>
            <div style={{ fontSize: "11px" }}>
              Upload an image to start editing
            </div>
          </div>

          <div
            className="win99-button"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = (e: Event) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const result = e.target?.result as string;
                    if (result) {
                      onImageChange(result);
                    }
                  };
                  reader.readAsDataURL(file);
                }
              };
              input.click();
            }}
            style={{
              padding: "8px 16px",
              fontSize: "11px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            📁 Upload Image
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "var(--bg-window)",
            border: "2px outset var(--border-window)",
            padding: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "11px",
            zIndex: 10,
          }}
        >
          <div className="win99-loading"></div>
          Processing...
        </div>
      )}
    </div>
  );
};
