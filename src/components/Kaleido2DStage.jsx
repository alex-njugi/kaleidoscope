import { useEffect, useRef } from "react";
import { useKaleidoStore } from "../store/useKaleidoStore";

/* helpers */
function fillGradient(ctx, r, colors){
  const g = ctx.createRadialGradient(0,0,0, 0,0,r);
  const n = colors.length; colors.forEach((c,i)=>g.addColorStop(n===1?1:i/(n-1), c));
  ctx.fillStyle = g;
}
function shapePetal(ctx,h=120,w=60){ctx.beginPath();ctx.moveTo(0,-h);ctx.bezierCurveTo(w,-h*.75,w,h*.75,0,h);ctx.bezierCurveTo(-w,h*.75,-w,-h*.75,0,-h);ctx.closePath();ctx.fill();}
function shapeLeaf(ctx,h=90,w=46){ctx.beginPath();ctx.moveTo(0,-h*.6);ctx.quadraticCurveTo(w,-h*.1,0,h);ctx.quadraticCurveTo(-w,-h*.1,0,-h*.6);ctx.closePath();ctx.fill();}
function shapeDiamond(ctx,s=70){ctx.beginPath();ctx.moveTo(0,-s);ctx.lineTo(s*.75,0);ctx.lineTo(0,s);ctx.lineTo(-s*.75,0);ctx.closePath();ctx.fill();}
function shapeTeardrop(ctx,h=80,w=44){ctx.beginPath();ctx.arc(0,0,w*.9,0.15*3.14159,1.85*3.14159,false);ctx.quadraticCurveTo(0,-h,0,-h);ctx.closePath();ctx.fill();}

function drawMandala(ctx,t,palette){
  ctx.save();ctx.globalCompositeOperation="lighter";
  ctx.save();ctx.shadowBlur=40;ctx.shadowColor=palette[0]+"80";ctx.globalAlpha=.25;
  fillGradient(ctx,180,[palette[2]+"10",palette[0]+"06","#0000"]);ctx.beginPath();ctx.arc(0,0,180,0,6.283);ctx.fill();ctx.restore();
  const rings=[[6,40,.55,shapePetal],[12,70,.5,shapeLeaf],[18,100,.5,shapeTeardrop],[24,130,.45,shapeDiamond],[30,160,.4,shapeLeaf]];
  rings.forEach((ring,ri)=>{const[count,R,s,shapeFn]=ring;for(let i=0;i<count;i++){ctx.save();const a=(i/count)*6.283+t*(.15+ri*.03);const wob=Math.sin(t*.8+i*.7+ri)*4;ctx.rotate(a);ctx.translate(R+wob,0);const col=palette[(i+ri*2)%palette.length];ctx.globalAlpha=.9;ctx.shadowBlur=18;ctx.shadowColor=col+"aa";ctx.fillStyle=col;const k=1+Math.sin(t*1.2+i*.6+ri)*.05;ctx.scale(s*k,s*k);ctx.rotate(Math.sin(t*.9+i)*.3+(ri%2?Math.PI:0));shapeFn(ctx);ctx.restore();}});
  ctx.save();for(let i=0;i<10;i++){ctx.save();ctx.rotate((i/10)*6.283+t*.3);ctx.fillStyle=palette[(i+1)%palette.length];ctx.shadowBlur=20;ctx.shadowColor=palette[(i+2)%palette.length]+"aa";ctx.scale(.32,.32);shapePetal(ctx,140,70);ctx.restore();}
  ctx.beginPath();ctx.fillStyle=palette[2];ctx.shadowBlur=12;ctx.shadowColor=palette[2]+"aa";ctx.arc(0,0,14,0,6.283);ctx.fill();ctx.restore();ctx.restore();
}
function drawStained(ctx,t,palette){
  ctx.save();ctx.globalCompositeOperation="lighter";const cells=10,size=36;
  for(let y=-cells;y<=cells;y++){for(let x=-cells;x<=cells;x++){
    const nx=x*size+Math.sin(t+y*.3)*6; const ny=y*size+Math.cos(t*.8+x*.3)*6;
    const col=palette[(x-y & 7)%palette.length];
    ctx.save();ctx.translate(nx,ny);ctx.rotate(((x^y)&1?1:-1)*(t*.3+(x+y)*.02));
    ctx.fillStyle=col;ctx.globalAlpha=.75;
    ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(10,0);ctx.lineTo(0,12);ctx.lineTo(-10,0);
    ctx.closePath();ctx.fill();ctx.restore();
  }} ctx.restore();
}
function drawRosette(ctx,t,palette){
  ctx.save();const rings=8;
  for(let r=0;r<rings;r++){const R=30+r*18;const count=12+r*4;
    for(let i=0;i<count;i++){ctx.save();const a=(i/count)*6.283+(r%2?-t*.4:t*.3);ctx.rotate(a);ctx.translate(R,0);
      const col=palette[(r+i)%palette.length];ctx.fillStyle=col;ctx.globalAlpha=.85;ctx.shadowBlur=14;ctx.shadowColor=col+"aa";
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(16,-6);ctx.lineTo(24,0);ctx.lineTo(16,6);
      ctx.closePath();ctx.fill();ctx.restore();
    }
  } ctx.restore();
}
function drawMosaic(ctx,t,palette){
  ctx.save();ctx.globalCompositeOperation="lighter";const N=220;
  for(let i=0;i<N;i++){const a=(i/N)*6.283+t*.5;const R=30+(i%20)*7+Math.sin(t*.8+i)*3;
    ctx.save();ctx.rotate(a);ctx.translate(R,0);
    const col=palette[i%palette.length];ctx.fillStyle=col;ctx.globalAlpha=.75;
    ctx.beginPath();ctx.arc(0,0,4+(i%3),0,6.283);ctx.fill();ctx.restore();
  } ctx.restore();
}
function drawFloral(ctx,t,palette){
  ctx.save();const layers=4;
  for(let L=0;L<layers;L++){const petals=8+L*4;const R=40+L*28;
    for(let i=0;i<petals;i++){ctx.save();
      ctx.rotate((i/petals)*6.283+t*.2*(L+1));ctx.translate(R,0);
      const col=palette[(i+L)%palette.length];ctx.fillStyle=col;ctx.globalAlpha=.9;ctx.shadowBlur=16;ctx.shadowColor=col+"aa";
      shapePetal(ctx,80,40);ctx.restore();
    }
  } ctx.restore();
}

export default function Kaleido2DStage(){
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const offRef = useRef(null);

  const audioRef = useRef(document.createElement("audio"));
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const dataRef = useRef(null);
  const micStreamRef = useRef(null);

  const {
    segments, glow, palette, bg,
    audioMode, audioUrl, audioSensitivity,
    gyroEnabled, styleMode,
    checkEasterEggToday, toggleMessage, showMessage
  } = useKaleidoStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    const off = offRef.current;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    checkEasterEggToday?.();

    const resize = () => {
      const w = wrapRef.current.clientWidth;
      const h = wrapRef.current.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      off.width = 400; off.height = 400;
    };
    resize();
    window.addEventListener("resize", resize);

    const ctx = canvas.getContext("2d");
    const offCtx = off.getContext("2d");

    let anim, t = 0, cx = 0.5, cy = 0.5;

    const onPointer = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      cx = x / rect.width; cy = y / rect.height;
    };
    canvas.addEventListener("pointermove", onPointer, { passive:true });
    canvas.addEventListener("touchmove", onPointer, { passive:true });

    let lastTap = 0, pressTimer = null;
    const onDown = () => {
      const now = Date.now();
      if (now - lastTap < 300) toggleMessage();
      lastTap = now;
      pressTimer = setTimeout(() => { showMessage(); }, 800);
    };
    const onUp = () => { clearTimeout(pressTimer); pressTimer = null; };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onUp);

    const onKey = (e) => { if (e.key.toLowerCase() === "h") toggleMessage(); };
    window.addEventListener("keydown", onKey);

    let tiltX = 0, tiltY = 0; const lerp = (a,b,p)=>a+(b-a)*p;
    const onOrient = (ev) => {
      if (!gyroEnabled) return;
      const beta = (ev.beta ?? 0), gamma = (ev.gamma ?? 0);
      const ny = Math.max(-1, Math.min(1, beta / 45));
      const nx = Math.max(-1, Math.min(1, gamma / 45));
      tiltX = lerp(tiltX, nx, 0.08); tiltY = lerp(tiltY, ny, 0.08);
    };
    window.addEventListener("deviceorientation", onOrient, true);

    const setupAudio = async () => {
      if (audioCtxRef.current) {
        try { await audioCtxRef.current.close(); } catch { /* ignore close errors */ }
        audioCtxRef.current=null; analyserRef.current=null; dataRef.current=null;
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(tr=>tr.stop());
        micStreamRef.current=null;
      }
      if (audioMode === "none") return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctxA = new AudioCtx(); audioCtxRef.current = ctxA;
      const analyser = ctxA.createAnalyser(); analyser.fftSize = 1024; analyser.smoothingTimeConstant = 0.85;
      analyserRef.current = analyser; dataRef.current = new Uint8Array(analyser.frequencyBinCount);
      if (audioMode === "file" && audioUrl) {
        audioRef.current.src = audioUrl; audioRef.current.crossOrigin = "anonymous";
        try { await audioRef.current.play(); } catch { /* autoplay may be blocked */ }
        const src = ctxA.createMediaElementSource(audioRef.current);
        src.connect(analyser); analyser.connect(ctxA.destination);
      }
      if (audioMode === "mic") {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ audio:true, video:false });
          micStreamRef.current = s; const src = ctxA.createMediaStreamSource(s); src.connect(analyser);
        } catch { /* mic permission denied */ }
      }
    };
    setupAudio();

    const drawStamp = () => {
      offCtx.clearRect(0,0,off.width,off.height);
      offCtx.save(); offCtx.translate(off.width/2, off.height/2);
      switch (styleMode) {
        case "stained":  drawStained(offCtx, t, palette); break;
        case "mosaic":   drawMosaic(offCtx, t, palette);  break;
        case "rosette":  drawRosette(offCtx, t, palette); break;
        case "floral":   drawFloral(offCtx, t, palette);  break;
        default:         drawMandala(offCtx, t, palette); break;
      }
      offCtx.restore();
    };

    const lowBand = () => {
      const an = analyserRef.current, data = dataRef.current;
      if (!an || !data) return 0;
      an.getByteFrequencyData(data);
      const N = Math.min(64, data.length); let s=0; for(let i=0;i<N;i++) s+=data[i];
      return (s/N)/255;
    };

    const loop = () => {
      const energy = lowBand();
      const beat = Math.pow(energy, 1.2) * audioSensitivity;
      t += 0.016 * (1 + (audioMode !== "none" ? beat * 0.9 : 0));

      if (gyroEnabled) {
        cx = Math.max(0, Math.min(1, 0.5 + (tiltX * 0.35)));
        cy = Math.max(0, Math.min(1, 0.5 + (tiltY * 0.35)));
      }

      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = bg; ctx.fillRect(0,0,canvas.width,canvas.height);

      const dynamicGlow = Math.max(0, Math.min(1, glow + (audioMode !== "none" ? beat * 0.4 : 0)));
      const g = ctx.createRadialGradient(canvas.width*.5,canvas.height*.5,10, canvas.width*.5,canvas.height*.5, Math.max(canvas.width,canvas.height)*.6);
      g.addColorStop(0, `rgba(255,255,255,${0.06*dynamicGlow})`); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(0,0,canvas.width,canvas.height);

      drawStamp();

      const S = segments;
      const R = Math.min(canvas.width, canvas.height)*0.42;
      const zoomFactor = Math.max(0.7, Math.min(1.3, 1 + (0.5 - cy) * 0.5));

      ctx.save();
      ctx.translate(canvas.width*0.5, canvas.height*0.5);
      const extra = (audioMode !== "none" ? beat * 0.3 : 0);
      ctx.rotate((cx - 0.5) * Math.PI + extra);
      for (let i=0;i<S;i++){
        ctx.save();
        ctx.rotate((Math.PI*2*i)/S);
        if (i%2===1) ctx.scale(1,-1);
        ctx.scale(zoomFactor, zoomFactor);
        ctx.drawImage(offRef.current, -R, -R, R*2, R*2);
        ctx.restore();
      }
      ctx.restore();

      anim = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(anim);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("touchmove", onPointer);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onUp);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("deviceorientation", onOrient, true);
      if (micStreamRef.current){
        micStreamRef.current.getTracks().forEach(tr=>tr.stop());
        micStreamRef.current=null;
      }
      if (audioCtxRef.current){
        try { audioCtxRef.current.close(); } catch { /* ignore close errors */ }
        audioCtxRef.current=null; analyserRef.current=null; dataRef.current=null;
      }
    };
  }, [segments, glow, palette, bg, audioMode, audioUrl, audioSensitivity, gyroEnabled, styleMode, checkEasterEggToday, toggleMessage, showMessage]);

  return (
    <div ref={wrapRef} className="k-wrap">
      <canvas ref={canvasRef} />
      <canvas ref={offRef} style={{display:"none"}} />
    </div>
  );
}
