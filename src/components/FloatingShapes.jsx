import { useMemo } from "react";
import { useKaleidoStore } from "../store/useKaleidoStore";
import {
  FaHeart, FaStar, FaSmile, FaLeaf, FaSnowflake, FaFeather,
  FaApple, FaFish, FaTree, FaPaw, FaCloud, FaBolt, FaGhost,
  FaRocket, FaAppleAlt, FaKiwiBird, FaDragon, FaOtter,
  FaSun, FaMoon, FaCandyCane, FaCookie, FaIceCream, FaGift,
  FaWineGlass, FaPaperPlane, FaMusic, FaMagic
} from "react-icons/fa";
import { GiButterfly } from "react-icons/gi"; // butterfly alt

const ICONS = [
  FaHeart, FaStar, FaSmile, FaLeaf, FaSnowflake, FaFeather,
  FaApple, FaFish, FaTree, FaPaw, FaCloud, FaBolt, FaGhost,
  FaRocket, FaAppleAlt, FaKiwiBird, FaDragon, FaOtter,
  FaSun, FaMoon, FaCandyCane, FaCookie, FaIceCream, FaGift,
  FaWineGlass, FaPaperPlane, FaMusic, FaMagic, GiButterfly
];

function rand(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export default function FloatingShapes({ count = 18 }) {
  const { palette } = useKaleidoStore();

  // freeze layout per mount
  const items = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        icon: pick(ICONS),
        size: Math.round(rand(16, 40)),
        dur: rand(8, 16),
        rot: Math.random() < 0.5 ? -1 : 1,
        x: rand(4, 96),
        y: rand(6, 94),
        delay: rand(-10, 0),
        opacity: rand(0.25, 0.65),
      })),
    [count]
  );

  return (
    <div className="float-layer" aria-hidden="true">
      {items.map(({ id, icon: IconComp, size, dur, rot, x, y, delay, opacity }) => {
        const color =
          (palette && palette.length)
            ? palette[(id * 3) % palette.length]
            : "rgba(255,255,255,0.75)";

        return (
          <div
            key={id}
            className="float-item"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              fontSize: `${size}px`,
              animationDuration: `${dur}s, ${dur * 1.2}s`,
              animationDelay: `${delay}s, ${delay / 2}s`,
              transform: `translate(-50%, -50%)`,
              opacity,
              color,
              textShadow: `0 2px 10px ${color}40`,
            }}
          >
            <span
              style={{
                display: "inline-block",
                animation: `spin ${dur * 1.1}s linear infinite`,
                transformOrigin: "50% 50%",
                animationDirection: rot === -1 ? "reverse" : "normal"
              }}
            >
              <IconComp />
            </span>
          </div>
        );
      })}
    </div>
  );
}
