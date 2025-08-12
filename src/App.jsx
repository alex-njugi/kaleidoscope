import { useState, useEffect } from "react";
import Kaleidoscope from "./components/Kaleidoscope";
import Controls from "./components/Controls";
import FloatingShapes from "./components/FloatingShapes";
import { useKaleidoStore } from "./store/useKaleidoStore";
import "./index.css";

export default function App() {
  // message rotation bits from the store
  const {
    messages,
    messageIndex,
    messageVisible,
    cycleMessages,
    messageInterval,
    nextMessage,
  } = useKaleidoStore();

  // -- mobile / drawer logic --
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

  // ESC to close on mobile
  useEffect(() => {
    const onKey = (e) => {
      if (isMobile && panelOpen && e.key === "Escape") setPanelOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobile, panelOpen]);

  // rotate messages automatically
  useEffect(() => {
    if (!cycleMessages || messages.length < 2) return;
    const id = setInterval(nextMessage, Math.max(1000, messageInterval));
    return () => clearInterval(id);
  }, [cycleMessages, messageInterval, messages.length, nextMessage]);

  const activeMessage = messages?.[messageIndex] ?? "";

  return (
    <div className={`app ${panelOpen ? "panel-open" : "panel-closed"}`}>
      <aside className="panel-wrap" aria-hidden={isMobile ? !panelOpen : false}>
        {(!isMobile || panelOpen) && <Controls onClose={() => setPanelOpen(false)} />}
      </aside>

      <div className="stage">
        {/* Hamburger shows whenever the panel is closed (desktop + mobile) */}
        {!panelOpen && (
          <button
            className="open-btn"
            aria-label="Open controls"
            onClick={() => setPanelOpen(true)}
          >
            ☰
          </button>
        )}

        {/* Scrim only on mobile when open (tap to close) */}
        {isMobile && panelOpen && (
          <div
            className="panel-scrim"
            onClick={() => setPanelOpen(false)}
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
