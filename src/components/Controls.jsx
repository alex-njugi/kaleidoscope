import { useRef, useState, useEffect } from "react";
import { useKaleidoStore } from "../store/useKaleidoStore";

export default function Controls({ onClose }) {
  const {
    palette, segments, speed, glow, bg, message, messageVisible,
    textureType, set, setTexture, clearTexture,
    audioMode, audioSensitivity, setAudio, stopAudio, randomize,
    gyroEnabled, styleMode
  } = useKaleidoStore();

  const panelRef = useRef(null);
  const imgInputRef = useRef(null);
  const vidInputRef = useRef(null);
  const audioFileRef = useRef(null);

  const [showScrollHint, setShowScrollHint] = useState(true);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const onScroll = () => {
      const y = el.scrollTop;
      const max = el.scrollHeight - el.clientHeight;

      // hide hint after a small scroll or when close to bottom
      if (y > 120 || y > max - 80) setShowScrollHint(false);
      else setShowScrollHint(true);

      // track if near bottom for toggle
      setAtBottom(y >= max - 24);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const handleScrollHintClick = () => {
    const el = panelRef.current;
    if (!el) return;
    if (atBottom) {
      el.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  };

  const updateColor = (idx, val) => {
    const next = [...palette]; next[idx] = val; set({ palette: next });
  };

  const saveImage = () => {
    const c = document.querySelector(".k-wrap canvas");
    const link = document.createElement("a");
    link.download = "kaleidoscope.png";
    link.href = c.toDataURL("image/png");
    link.click();
  };

  const handleImageFile = (file) => { if (!file) return; setTexture(URL.createObjectURL(file), "image"); };
  const handleVideoFile = (file) => { if (!file) return; setTexture(URL.createObjectURL(file), "video"); };
  const activatePetalMode = () => clearTexture();
  const toggleCameraMode = () => { textureType === "camera" ? clearTexture() : setTexture(null, "camera"); };
  const toggleMicMode = async () => { audioMode === "mic" ? stopAudio() : setAudio("mic", null); };
  const handleAudioFile = (file) => { if (!file) return; setAudio("file", URL.createObjectURL(file)); };
  const toggleGyro = async () => {
    const anyDO = window.DeviceOrientationEvent;
    if (anyDO && typeof anyDO.requestPermission === "function") {
      try { const res = await anyDO.requestPermission(); if (res !== "granted") return alert("Motion permission was denied."); }
      catch { return alert("Motion permission request failed."); }
    }
    useKaleidoStore.getState().set({ gyroEnabled: !gyroEnabled });
  };
  const toggleMessage = () => useKaleidoStore.getState().set({ messageVisible: !messageVisible });

  return (
    <div ref={panelRef} className="panel">
      {/* optional close button (mobile) */}
      {onClose && (
        <button className="close-btn" aria-label="Close controls" onClick={onClose}>✕</button>
      )}

      <h3>Kaleidoscope 😁</h3>

      <label>Choose Style</label>
      <select value={styleMode} onChange={(e)=>set({ styleMode: e.target.value })}>
        <option value="mandala">Mandala Bloom (soft glow)</option>
        <option value="mosaic">Electric Mosaic (cellular)</option>
        <option value="rosette">Blackhole Rosette (rings)</option>
        <option value="stained">Neon Cathedral (stained glass)</option>
        <option value="photo">Photo Kaleido (use texture)</option>
        <option value="floral">Floral Bloom (petals)</option>
      </select>

      <label>Segments: {segments}</label>
      <input type="range" min="3" max="16" value={segments} onChange={(e)=>set({segments: +e.target.value})} />

      <label>Rotation speed: {speed.toFixed(2)}</label>
      <input type="range" min="0" max="2" step="0.02" value={speed} onChange={(e)=>set({speed: +e.target.value})} />

      <label>Glow: {glow.toFixed(2)}</label>
      <input type="range" min="0" max="1" step="0.02" value={glow} onChange={(e)=>set({glow: +e.target.value})} />

      <label>Background</label>
      <input type="color" value={bg} onChange={(e)=>set({bg: e.target.value})} />

      <div className="row">
        {palette.map((c,i)=>(
          <input key={i} type="color" value={c} onChange={(e)=>updateColor(i, e.target.value)} />
        ))}
      </div>

      <label>Message</label>
      <input value={message} onChange={(e)=>set({message: e.target.value})} />
      <button onClick={toggleMessage}>{messageVisible ? "Hide" : "Show"} Message</button>

      <hr style={{borderColor:"#222"}} />

      <strong>Texture Source</strong>
      <div className="row" style={{gap:8, flexWrap:"wrap"}}>
        <button onClick={activatePetalMode}>Use Petal</button>

        <button onClick={()=>imgInputRef.current?.click()}>Use Image</button>
        <input ref={imgInputRef} type="file" accept="image/*" onChange={(e)=>handleImageFile(e.target.files?.[0])} style={{display:"none"}} />

        <button onClick={()=>vidInputRef.current?.click()}>Use Video</button>
        <input ref={vidInputRef} type="file" accept="video/*" onChange={(e)=>handleVideoFile(e.target.files?.[0])} style={{display:"none"}} />

        <button onClick={toggleCameraMode}>{textureType === "camera" ? "Stop Camera" : "Live Camera"}</button>
      </div>

      <em style={{color:"#8f93a6", fontSize:12}}>Tip: Camera requires HTTPS (or localhost).</em>

      <hr style={{borderColor:"#222"}} />

      <strong>Music-Reactive</strong>
      <div className="row" style={{gap:8, flexWrap:"wrap"}}>
        <button onClick={toggleMicMode}>{audioMode === "mic" ? "Stop Mic" : "Use Mic"}</button>

        <button onClick={()=>audioFileRef.current?.click()}>Use Audio File</button>
        <input ref={audioFileRef} type="file" accept="audio/*" onChange={(e)=>handleAudioFile(e.target.files?.[0])} style={{display:"none"}} />

        {audioMode !== "none" && <button onClick={stopAudio}>Stop Audio</button>}
      </div>

      <label>Sensitivity: {audioSensitivity.toFixed(2)}</label>
      <input type="range" min="0.2" max="2" step="0.05" value={audioSensitivity} onChange={(e)=>set({audioSensitivity: +e.target.value})} />

      <hr style={{borderColor:"#222"}} />

      <div className="row" style={{gap:8, flexWrap:"wrap"}}>
        <button onClick={randomize}>🎲 Surprise Me</button>
        <button onClick={toggleGyro}>{gyroEnabled ? "Disable Tilt" : "Enable Tilt"}</button>
        <button onClick={saveImage}>Save Image</button>
      </div>

      <em style={{color:"#8f93a6", fontSize:12}}>
        Tip: Tilt needs motion permission on iOS and works best on HTTPS.
      </em>

      {/* --- Mobile scroll hint button --- */}
      <button
        className={`scroll-hint ${showScrollHint ? "is-visible" : ""}`}
        type="button"
        onClick={handleScrollHintClick}
        aria-label={atBottom ? "Scroll to top" : "Scroll to bottom"}
      >
        <span className="chev">{atBottom ? "↑" : "↓"}</span>
      </button>
    </div>
  );
}
