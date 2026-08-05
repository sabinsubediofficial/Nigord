import React, { useEffect, useRef, useState } from 'react'

export function InteractiveBackground({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [targetMousePos, setTargetMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    canvas.width = width
    canvas.height = height

    let particles: { x: number; y: number; vx: number; vy: number; radius: number }[] = []
    
    // Create particles
    const initParticles = () => {
      particles = []
      const numParticles = Math.floor((width * height) / 15000)
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          radius: Math.random() * 2 + 1
        })
      }
    }
    initParticles()

    window.addEventListener('resize', () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      initParticles()
    })

    let animationFrameId: number

    const render = () => {
      // Clear with slight trailing effect
      ctx.fillStyle = 'rgba(9, 9, 11, 0.2)'
      ctx.fillRect(0, 0, width, height)

      // Smooth mouse interpolation
      setMousePos(prev => {
        const dx = targetMousePos.x - prev.x
        const dy = targetMousePos.y - prev.y
        return {
          x: prev.x + dx * 0.1,
          y: prev.y + dy * 0.1
        }
      })

      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        // Mouse interaction
        const dx = mousePos.x - p.x
        const dy = mousePos.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        
        if (dist < 150) {
          const angle = Math.atan2(dy, dx)
          const force = (150 - dist) / 150
          p.x -= Math.cos(angle) * force * 2
          p.y -= Math.sin(angle) * force * 2
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.fill()

        // Draw connections
        particles.forEach(p2 => {
          const dx2 = p.x - p2.x
          const dy2 = p.y - p2.y
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
          if (dist2 < 100) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * (1 - dist2 / 100)})`
            ctx.stroke()
          }
        })
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [targetMousePos, mousePos])

  const handleMouseMove = (e: React.MouseEvent) => {
    setTargetMousePos({ x: e.clientX, y: e.clientY })
  }

  // Calculate 3D tilt for the inner container
  const getTiltStyle = () => {
    if (!containerRef.current) return {}
    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const tiltX = (mousePos.y - centerY) / 30
    const tiltY = (centerX - mousePos.x) / 30

    return {
      transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.1s ease-out'
    }
  }

  return (
    <div 
      className="relative min-h-screen w-full overflow-hidden bg-[#09090b] selection:bg-white/30"
      onMouseMove={handleMouseMove}
    >
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none z-0"
      />
      
      {/* CRT Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]" />
      
      {/* Radial vignette */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_0%,#09090b_100%)] opacity-80" />

      <div className="relative z-20 flex min-h-screen items-center justify-center p-4">
        <div ref={containerRef} style={getTiltStyle()} className="w-full max-w-[420px]">
          {children}
        </div>
      </div>
    </div>
  )
}
