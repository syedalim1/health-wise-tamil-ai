import React, { useEffect, useState } from "react";
import { PillIcon, Heart, Droplet, Zap, FlaskConical } from "lucide-react";

interface AnimatedBackgroundProps {
  opacity?: number;
}

interface AnimatedItem {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  icon: React.ReactNode;
  rotation: number;
  rotationSpeed: number;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  opacity = 0.04,
}) => {
  const [items, setItems] = useState<AnimatedItem[]>([]);
  const [dimensions, setDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1000,
    height: typeof window !== "undefined" ? window.innerHeight : 1000,
  });

  useEffect(() => {
    // Create animated items
    const icons = [
      <PillIcon />,
      <Heart />,
      <Droplet />,
      <Zap />,
      <FlaskConical />,
    ];

    const newItems: AnimatedItem[] = [];
    const itemCount = Math.floor(dimensions.width / 200); // Adjust density here

    for (let i = 0; i < itemCount; i++) {
      newItems.push({
        id: i,
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        size: 10 + Math.random() * 20,
        speed: 0.2 + Math.random() * 0.5,
        icon: icons[Math.floor(Math.random() * icons.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 0.5,
      });
    }

    setItems(newItems);

    // Window resize handler
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    // Animation loop
    let animationId: number;
    const animate = () => {
      setItems((prevItems) =>
        prevItems.map((item) => {
          let newY = item.y + item.speed;
          if (newY > dimensions.height + 50) {
            newY = -50;
          }

          return {
            ...item,
            y: newY,
            rotation: (item.rotation + item.rotationSpeed) % 360,
          };
        })
      );

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [dimensions.height, dimensions.width]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute text-health-primary"
          style={{
            left: `${item.x}px`,
            top: `${item.y}px`,
            width: `${item.size}px`,
            height: `${item.size}px`,
            transform: `rotate(${item.rotation}deg)`,
            opacity: opacity,
            transition: "transform 0.5s ease",
          }}
        >
          {item.icon}
        </div>
      ))}
    </div>
  );
};

export default AnimatedBackground;
