import { useState, useEffect } from "react";

/**
 * useIsMobile
 * Simple responsive hook that returns `true` when the viewport width is
 * less than or equal to the provided breakpoint (default 768 px).
 * Re-computes on window resize.
 */
export const useIsMobile = (breakpoint: number = 768): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}; 