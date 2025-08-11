import { useEffect, useRef } from "react";

export default function HexMirrorKaleidoscope({ sourceEl, angle = 0.0, tile = 1.35, zoom = 1.0 }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl =
      canvas.getContext("webgl", { antialias: true, preserveDrawingBuffer: true }) ||
      canvas.getContext("experimental-webgl");
    if (!gl) { 
      console.warn("WebGL not available"); 
      return; 
    }

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(2, Math.floor(r.width * dpr));
      canvas.height = Math.max(2, Math.floor(r.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const vertSrc = `
      attribute vec2 a_pos;
      varying vec2 v_uv;
      void main(){ v_uv=(a_pos*0.5)+0.5; gl_Position=vec4(a_pos,0.0,1.0); }
    `;
    const fragSrc = `
      precision mediump float;
      varying vec2 v_uv;
      uniform vec2 u_res;
      uniform sampler2D u_tex;
      uniform float u_time,u_angle,u_tile,u_zoom;

      vec2 rot(vec2 p, float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c)*p; }
      vec2 triFold(vec2 p){
        const float SQ3=1.7320508075688772;
        vec2 b1=vec2(1.0,0.0), b2=vec2(0.5,SQ3*0.5);
        float u=dot(p,b1), v=dot(p,b2);
        u=fract(u)-0.5; v=fract(v)-0.5;
        vec2 r=u*b1+v*b2;
        if ((u+v)>0.0){ float t=u+v; u-=t; v-=t; r=u*b1+v*b2; }
        return r;
      }
      void main(){
        vec2 uv=v_uv, res=u_res; float ar=res.x/res.y;
        vec2 p=(uv-0.5); p.x*=ar;
        p*= (1.5*u_tile);
        p=rot(p,u_angle);

        vec2 q=triFold(p);

        vec2 src=q;
        src.x/=ar;
        src=rot(src,-u_angle*0.35);
        src*= (1.0/max(0.001,u_zoom));
        src+=0.5;

        vec2 m=abs(mod(src,2.0)-1.0);
        vec4 col=texture2D(u_tex,m);

        float r=length((uv-0.5)*vec2(ar,1.0));
        float vig=smoothstep(0.95,0.55,r);
        col.rgb*=vig;

        gl_FragColor=col;
      }
    `;
    const compile = (t, s) => {
      const sh = gl.createShader(t);
      gl.shaderSource(sh, s);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh));
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, vertSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1,-1,  1,-1, -1, 1,
       1,-1,  1, 1, -1, 1
    ]), gl.STATIC_DRAW);
    const a_pos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(a_pos);
    gl.vertexAttribPointer(a_pos, 2, gl.FLOAT, false, 0, 0);

    const u_res  = gl.getUniformLocation(prog, "u_res");
    const u_tex  = gl.getUniformLocation(prog, "u_tex");
    const u_time = gl.getUniformLocation(prog, "u_time");
    const u_angle= gl.getUniformLocation(prog, "u_angle");
    const u_tile = gl.getUniformLocation(prog, "u_tile");
    const u_zoom = gl.getUniformLocation(prog, "u_zoom");

    // --- Texture: NPOT-safe params ---
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    let t0 = performance.now();
    const loop = () => {
      const t = (performance.now() - t0) * 0.001;
      const src = sourceEl;

      if (src &&
         ((src instanceof HTMLVideoElement && src.readyState >= 2) ||
          (src instanceof HTMLImageElement  && src.complete && src.naturalWidth > 0))) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      }

      gl.useProgram(prog);
      gl.uniform2f(u_res, canvas.width, canvas.height);
      gl.uniform1i(u_tex, 0);
      gl.uniform1f(u_time, t);
      gl.uniform1f(u_angle, angle);
      gl.uniform1f(u_tile, tile);
      gl.uniform1f(u_zoom, zoom);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      try {
        gl.deleteTexture(tex);
        gl.deleteBuffer(buf);
        gl.deleteProgram(prog);
      } catch { /* ignore cleanup errors */ }
    };
  }, [sourceEl, angle, tile, zoom]);

  return <canvas ref={canvasRef} className="k-hex" style={{ width:"100%", height:"100%", display:"block" }}/>;
}
