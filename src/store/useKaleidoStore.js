import { create } from "zustand";

/* helpers */
function rand(min, max){ return Math.random()*(max-min)+min; }
function randInt(min, max){ return Math.floor(rand(min, max)); }
function hex(n){ return n.toString(16).padStart(2,"0"); }
function randomPalette(size=5){
  const pals = [
    ["#ff4d6d","#ff9e00","#70e000","#38a3a5","#4361ee"],
    ["#ff6b6b","#ffd93d","#6bcb77","#4d96ff","#845ec2"],
    ["#ff4d6d", "#ff9e00", "#70e000", "#38a3a5", "#4361ee"],
    ["#12c2e9","#c471ed","#f64f59","#ffd166","#06d6a0"],
  ];
  if (Math.random() < 0.5) return pals[randInt(0,pals.length)];
  const arr=[]; const h = randInt(0,360);
  for(let i=0;i<size;i++){
    const s = rand(0.65,0.95), v = rand(0.75,1);
    const hh = (h + i* (360/size))%360;
    const c=v*s, x=c*(1-Math.abs((hh/60)%2-1)), m=v-c;
    const idx=Math.floor(hh/60);
    let [r,g,b]=[[c,x,0],[x,c,0],[0,c,x],[0,x,c],[x,0,c],[c,0,x]][idx] || [c,0,x];
    r=Math.round((r+m)*255); g=Math.round((g+m)*255); b=Math.round((b+m)*255);
    arr.push(`#${hex(r)}${hex(g)}${hex(b)}`);
  }
  return arr;
}

export const useKaleidoStore = create((set, get) => ({
  // core visuals
  palette: ["#f72585","#b5179e","#7209b7","#3a0ca3","#4cc9f0"],
  segments: 10,
  speed: 0.6,
  glow: 0.4,
  bg: "#0a0b10",

  // message
  message: "You're amazing ✨",
  messageVisible: true,
  showMessage: () => set({ messageVisible: true }),
  hideMessage: () => set({ messageVisible: false }),
  toggleMessage: () => set({ messageVisible: !get().messageVisible }),

  // style preset
  styleMode: "mandala", // "mandala" | "mosaic" | "rosette" | "stained" | "photo" | "floral"

  // textures
  textureType: "none", // "none" | "image" | "video" | "camera"
  textureUrl: null,

  // audio
  audioMode: "none",   // "none" | "mic" | "file"
  audioUrl: null,
  audioSensitivity: 1.0,

  // motion
  gyroEnabled: false,

  set: (patch) => set(patch),

  setTexture: (url, type) => set(() => ({ textureUrl: url || null, textureType: type || "none" })),
  clearTexture: () => {
    const { textureUrl } = get();
    if (textureUrl) URL.revokeObjectURL(textureUrl);
    set({ textureType: "none", textureUrl: null });
  },

  setAudio: (mode, url=null) => {
    const { audioUrl } = get();
    if (audioUrl && audioUrl !== url) URL.revokeObjectURL(audioUrl);
    set({ audioMode: mode, audioUrl: url });
  },
  stopAudio: () => {
    const { audioUrl } = get();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    set({ audioMode: "none", audioUrl: null });
  },

  randomize: () => {
    const segs = randInt(6, 16);
    const spd = parseFloat(rand(0.2, 1.2).toFixed(2));
    const glw = parseFloat(rand(0.2, 0.8).toFixed(2));
    const bg = `#${hex(randInt(5,20))}${hex(randInt(5,20))}${hex(randInt(8,26))}`;
    set({ palette: randomPalette(5), segments: segs, speed: spd, glow: glw, bg });
  },

  // no-op today-egg so callers don’t crash (you can wire real one later)
  checkEasterEggToday: () => {}
}));
