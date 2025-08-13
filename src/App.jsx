import { useState, useEffect, useRef } from "react";
import Kaleidoscope from "./components/Kaleidoscope";
import Controls from "./components/Controls";
import FloatingShapes from "./components/FloatingShapes";
import { useKaleidoStore } from "./store/useKaleidoStore";
import "./index.css";

export default function App() {
  const {
    messages,
    messageIndex,
    messageVisible,
    cycleMessages,
    messageInterval,
    nextMessage,
    randomize,                // ← use Surprise Me from the store
  } = useKaleidoStore();

  // --- mobile / drawer state ---
  const getIsMobile = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 900px)").matches;

  const [isMobile, setIsMobile] = useState(getIsMobile());
  const [panelOpen, setPanelOpen] = useState(!getIsMobile()); // desktop open, mobile closed

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const onChange = (e) => {
      setIsMobile(e.matches);
      setPanelOpen(!e.matches ? true : false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // lock scroll behind mobile drawer
  useEffect(() => {
    if (isMobile && panelOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => (document.body.style.overflow = prev);
    }
  }, [isMobile, panelOpen]);

  // ESC to close drawer (mobile)
  useEffect(() => {
    const onKey = (e) => {
      if (isMobile && panelOpen && e.key === "Escape") setPanelOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobile, panelOpen]);

  // auto-rotate messages
  useEffect(() => {
    if (!cycleMessages || messages.length < 2) return;
    const id = setInterval(nextMessage, Math.max(1000, messageInterval));
    return () => clearInterval(id);
  }, [cycleMessages, messageInterval, messages.length, nextMessage]);

  const activeMessage = messages?.[messageIndex] ?? "";

  // --- Single-tap to Surprise Me (with double-tap guard) ---
  const lastTap = useRef(0);
  const tapTimer = useRef(null);

  const handleStageTap = () => {
    // ignore taps when the drawer is open on mobile
    if (isMobile && panelOpen) return;

    const now = Date.now();
    const delta = now - lastTap.current;
    lastTap.current = now;

    // double-tap? cancel single-tap action
    if (delta < 300) {
      if (tapTimer.current) clearTimeout(tapTimer.current);
      tapTimer.current = null;
      return;
    }

    // single-tap → randomize after a brief window (so we can detect double-tap)
    tapTimer.current = setTimeout(() => {
      randomize();
    }, 280);
  };

  return (
    <div className={`app ${panelOpen ? "panel-open" : "panel-closed"}`}>
      <aside className="panel-wrap" aria-hidden={isMobile ? !panelOpen : false}>
        {(!isMobile || panelOpen) && (
          <Controls onClose={() => setPanelOpen(false)} />
        )}
      </aside>

      {/* Make the whole stage tappable */}
      <div className="stage" onClick={handleStageTap}>
        {/* Hamburger (stop click bubbling so it doesn't trigger randomize) */}
        {!panelOpen && (
          <button
            className="open-btn"
            aria-label="Open controls"
            onClick={(e) => {
              e.stopPropagation();
              setPanelOpen(true);
            }}
          >
            ☰
          </button>
        )}

        {/* Scrim (mobile): close on tap, don't bubble to stage */}
        {isMobile && panelOpen && (
          <div
            className="panel-scrim"
            onClick={(e) => {
              e.stopPropagation();
              setPanelOpen(false);
            }}
            aria-hidden="true"
            role="presentation"
          />
        )}

        <Kaleidoscope />
        <FloatingShapes count={18} />

        <div className={`msg ${messageVisible ? "is-visible" : ""}`}>
          {activeMessage}
        </div>
      </div>
    </div>
  );
}
