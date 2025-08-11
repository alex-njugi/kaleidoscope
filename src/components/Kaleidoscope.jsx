import { useEffect, useRef, useState } from "react";
import { useKaleidoStore } from "../store/useKaleidoStore";
import HexMirrorKaleidoscope from "./HexMirrorKaleidoscope";
import Kaleido2DStage from "./Kaleido2DStage";

export default function Kaleidoscope(){
  const { textureType, textureUrl } = useKaleidoStore();

  // media refs for WebGL mode
  const imgRef = useRef(new Image());
  const videoRef = useRef(document.createElement("video"));
  const [mediaReady, setMediaReady] = useState(false);

  useEffect(() => {
    setMediaReady(false);

    const v = videoRef.current;
    const cleanVideo = () => {
      if (!v) return;
      v.oncanplay = null; v.onloadeddata = null; v.onloadedmetadata = null; v.onerror = null;
    };
    cleanVideo();

    if (textureType === "image" && textureUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => setMediaReady(true);
      img.onerror = () => console.warn("Image failed to load");
      imgRef.current = img;
      img.src = textureUrl;

    } else if (textureType === "video" && textureUrl) {
      v.muted = true; v.loop = true; v.playsInline = true; v.src = textureUrl;
      const ready = () => setMediaReady(true);
      v.oncanplay = ready; v.onloadeddata = ready; v.onloadedmetadata = ready;
      v.onerror = () => console.warn("Video failed to load");
      v.play().catch(()=>{});

    } else if (textureType === "camera") {
      v.muted = true; v.loop = true; v.playsInline = true;
      (async () => {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
          v.srcObject = s;
          const ready = () => setMediaReady(true);
          v.oncanplay = ready; v.onloadeddata = ready; v.onloadedmetadata = ready;
          await v.play().catch(()=>{});
        } catch (e) {
          console.warn("Camera needs HTTPS or permission", e);
        }
      })();
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject;
        if (s && s.getTracks) s.getTracks().forEach(tr => tr.stop());
        videoRef.current.srcObject = null;
      }
      cleanVideo();
    };
  }, [textureType, textureUrl]);

  const usingMedia = textureType === "image" || textureType === "video" || textureType === "camera";

  return (
    <div className="k-wrap">
      {usingMedia && mediaReady ? (
        <HexMirrorKaleidoscope
          sourceEl={textureType === "image" ? imgRef.current : videoRef.current}
          angle={0.0}   /* exact alignment */
          tile={1.35}   /* adjust to match your Canva spacing */
          zoom={1.0}    /* 1.0 natural; increase for tighter crop */
        />
      ) : (
        <Kaleido2DStage />
      )}
    </div>
  );
}
