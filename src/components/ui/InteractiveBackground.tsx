import React, { useEffect, useRef } from 'react'
import Matter from 'matter-js'

interface InteractiveBackgroundProps {
  children?: React.ReactNode;
  fullScreen?: boolean;
}

const COMMON_KEYS = ['A', 'W', 'S', 'D', 'Space', 'Enter', 'Shift', 'Ctrl', 'Alt', '1', '2', '3', '?', '@', '#', 'Esc', 'Tab']

export function InteractiveBackground({ children, fullScreen = false }: InteractiveBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<Matter.Engine | null>(null)
  
  // Track our physics bodies and DOM nodes
  const bodiesRef = useRef<{ 
    body: Matter.Body, 
    node: HTMLDivElement, 
    isTyped: boolean, 
    createdAt: number, 
    lifespan: number, 
    targetOpacity: number,
    floatForce: number,
    seed: number
  }[]>([])

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Setup Matter.js Engine
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0 } // Zero gravity, we apply upward forces manually
    });
    engineRef.current = engine;
    
    // 2. Setup Boundaries (Walls)
    const width = window.innerWidth;
    const height = window.innerHeight;
    const wallOptions = { isStatic: true, friction: 0, restitution: 1 };
    
    // Login Card Deflector
    // A large invisible circular collider in the center of the screen. 
    // We use a circle so that keys floating directly up from the bottom will slide off the curve 
    // left or right, rather than getting permanently pinned against a flat edge!
    const deflectorRadius = Math.min(280, width / 2.2); 
    const cardDeflector = Matter.Bodies.circle(width / 2, height / 2, deflectorRadius, {
      isStatic: true,
      restitution: 0.8,
      friction: 0.1
    });

    Matter.World.add(engine.world, [
      Matter.Bodies.rectangle(-50, height / 2, 100, height * 2, wallOptions), // Left
      Matter.Bodies.rectangle(width + 50, height / 2, 100, height * 2, wallOptions), // Right
      cardDeflector // Center layout collider
    ]);

    // 3. Helper to spawn a key
    const spawnKey = (keyLabel: string, isTyped: boolean, startX?: number, startY?: number) => {
      const isWide = keyLabel.length > 1;
      const w = isWide ? 100 : 60; // Approximate width based on UI styling
      const h = 60;
      
      const x = startX !== undefined ? startX : Math.random() * (width - 100) + 50;
      const y = startY !== undefined ? startY : Math.random() * height;
      const color = isTyped ? '#ff5e6c' : (Math.random() > 0.5 ? '#ffaaab' : '#ff5e6c');
      
      // Physics body
      const body = Matter.Bodies.rectangle(x, y, w, h, {
        restitution: 0.8, // Bounciness
        friction: 0.1,
        frictionAir: isWide ? 0.06 : 0.04, // Wide keys (Shift, Enter) have more air drag
        angle: (Math.random() * 40 - 20) * (Math.PI / 180),
      });
      
      // DOM Node
      const node = document.createElement('div');
      node.className = 'absolute top-0 left-0 flex items-center justify-center font-bold text-lg';
      node.style.width = isWide ? 'auto' : `${w}px`;
      node.style.minWidth = `${w}px`;
      node.style.height = `${h}px`;
      node.style.padding = isWide ? '0 16px' : '0';
      node.style.border = `2px solid ${color}`;
      if (isTyped) node.style.borderWidth = '3px';
      
      // Liquid / Glassmorphism look for contrast (Optimized for performance)
      node.style.backgroundColor = 'rgba(255, 255, 255, 0.7)'; // Strong white tint for visibility
      node.style.borderRadius = '12px';
      node.style.color = color;
      node.style.boxShadow = `0 4px 0 0 ${color}40, inset 0 4px 8px rgba(255,255,255,1)`; 
      node.style.pointerEvents = 'none';
      node.style.willChange = 'transform'; // Force GPU hardware acceleration for smooth 60fps
      node.textContent = keyLabel;
      
      // Initial Opacity
      // Boosted opacity significantly so the glass effect is visible!
      const targetOpacity = isTyped ? 0.9 : (Math.random() * 0.4 + 0.4); // 0.4 to 0.8
      node.style.opacity = isTyped ? '1' : targetOpacity.toString();
      
      containerRef.current?.appendChild(node);
      Matter.World.add(engine.world, body);
      
      // Initial Velocity
      if (isTyped) {
        // Shoot typed keys up slightly faster, but not too fast
        Matter.Body.setVelocity(body, {
          x: (Math.random() - 0.5) * 2,
          y: -Math.random() * 2 - 2 
        });
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.05);
      } else {
        // Very slow initial drift for ambient keys
        Matter.Body.setVelocity(body, {
          x: (Math.random() - 0.5) * 0.5,
          y: -Math.random() * 0.5 - 0.2
        });
        Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.02);
      }

      bodiesRef.current.push({
        body,
        node,
        isTyped,
        createdAt: Date.now(),
        lifespan: Math.random() * 15000 + 15000, // Typed keys live 15-30s
        targetOpacity,
        floatForce: (Math.random() * 0.0001) + (isWide ? 0.00005 : 0.00015), // Small keys get stronger upward push
        seed: Math.random() * 1000 // Seed for liquid sine wave
      });
    };

    // 4. Initial Ambient Keys (Reduced traffic)
    for (let i = 0; i < 12; i++) {
      const keyLabel = COMMON_KEYS[Math.floor(Math.random() * COMMON_KEYS.length)];
      spawnKey(keyLabel, false);
    }

    // 5. Game Loop
    let animationFrameId: number;
    let lastTime = performance.now();
    
    const tick = (time: number) => {
      const delta = Math.min(time - lastTime, 100); // cap delta
      lastTime = time;
      
      // Update Physics Engine
      Matter.Engine.update(engine, delta);
      
      const now = Date.now();
      
      // Update DOM & Logic
      for (let i = bodiesRef.current.length - 1; i >= 0; i--) {
        const item = bodiesRef.current[i];
        
        // Liquid sway force (sine wave based on time and unique seed)
        // Reverted to a gentle sway
        const sway = Math.sin(now / 1500 + item.seed) * 0.00005;

        // Constant gentle upward float force (varied per key) + gentle sway
        Matter.Body.applyForce(item.body, item.body.position, {
          x: sway * item.body.mass,
          y: -item.floatForce * item.body.mass 
        });

        // Wrap around logic for ambient keys (infinite scroll)
        if (item.body.position.y < -100 && !item.isTyped) {
          Matter.Body.setPosition(item.body, {
            x: Math.random() * (width - 100) + 50,
            y: height + 100
          });
          Matter.Body.setVelocity(item.body, { x: (Math.random() - 0.5), y: -1 });
        }
        
        // Remove old typed keys
        if (item.isTyped) {
          const age = now - item.createdAt;
          // Fade opacity from 1 down to targetOpacity over 2 seconds
          if (age < 2000) {
             const progress = Math.max(0, (age - 200) / 1800); // Wait 200ms then fade over 1.8s
             const currentOpacity = 1 - (progress * (1 - item.targetOpacity));
             item.node.style.opacity = currentOpacity.toString();
          } else {
             item.node.style.opacity = item.targetOpacity.toString();
          }

          if (age > item.lifespan || item.body.position.y < -150) {
            // Remove typed key from world and DOM
            Matter.World.remove(engine.world, item.body);
            if (item.node.parentNode === containerRef.current) {
              containerRef.current?.removeChild(item.node);
            }
            bodiesRef.current.splice(i, 1);
            continue; // Skip rendering
          }
        }
        
        // Visual liquid refraction effect (Squish, stretch)
        const stretchX = 1 + Math.sin(now / 800 + item.seed) * 0.15;
        const stretchY = 1 + Math.cos(now / 800 + item.seed) * 0.15;

        // Sync DOM element position, rotation, AND liquid stretching
        // Removed CSS blur filter as it caused severe composite lag on many devices
        item.node.style.transform = `translate3d(calc(${item.body.position.x}px - 50%), calc(${item.body.position.y}px - 50%), 0) rotate(${item.body.angle}rad) scale(${stretchX}, ${stretchY})`;
      }
      
      animationFrameId = requestAnimationFrame(tick);
    };
    
    animationFrameId = requestAnimationFrame(tick);

    // 6. Handle Keydown
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.key || e.repeat) return;
      let keyLabel = e.key;
      if (keyLabel === ' ') keyLabel = 'Space';
      
      // Calculate a random X position that avoids the center login card
      let startX;
      const exclusionWidth = 460; // 420px max-w of card + 40px padding
      const leftZoneEnd = (width / 2) - (exclusionWidth / 2);
      const rightZoneStart = (width / 2) + (exclusionWidth / 2);

      if (leftZoneEnd > 50 && (width - rightZoneStart) > 50) {
        // We have enough room on both sides, pick one randomly
        if (Math.random() > 0.5) {
          startX = Math.random() * (leftZoneEnd - 50) + 50;
        } else {
          startX = rightZoneStart + Math.random() * (width - rightZoneStart - 50);
        }
      } else {
        // Screen is too narrow, just spawn randomly anywhere
        startX = Math.random() * (width - 100) + 50;
      }
      
      // Spawn at the calculated X, near the bottom of the screen
      spawnKey(keyLabel, true, startX, height - 100);
    };
    
    window.addEventListener('keydown', handleKeyDown);

    // 7. Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animationFrameId);
      Matter.Engine.clear(engine);
      bodiesRef.current.forEach(item => {
        if (item.node.parentNode) {
          item.node.parentNode.removeChild(item.node);
        }
      });
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#fff5d7] font-serif">
      <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden z-0" />

      {fullScreen ? (
        <div className="relative z-20 w-full h-full min-h-screen flex flex-col pointer-events-none">
          {children}
        </div>
      ) : (
        <div className="relative z-20 flex min-h-screen items-center justify-center p-4 pointer-events-none">
          <div className="w-full max-w-[420px] bg-white rounded-3xl p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 pointer-events-auto">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
