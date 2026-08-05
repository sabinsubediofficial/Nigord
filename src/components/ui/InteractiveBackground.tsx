import React, { useEffect, useRef } from 'react'

export function InteractiveBackground({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Use refs instead of state to prevent re-rendering on every frame
  const mousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const targetMousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })

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
    
    // Create particles - reduced number for better performance (O(n^2) line drawing)
    const initParticles = () => {
      particles = []
      // Fewer particles to ensure smooth 60fps even on large 4k monitors
      const numParticles = Math.min(Math.floor((width * height) / 20000), 100) 
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 1.0, // Slower base movement
          vy: (Math.random() - 0.5) * 1.0,
          radius: Math.random() * 1.5 + 0.5
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
      ctx.fillStyle = 'rgba(9, 9, 11, 0.4)' // Increased opacity for less smearing
      ctx.fillRect(0, 0, width, height)

      // Smooth mouse interpolation
      const dx = targetMousePos.current.x - mousePos.current.x
      const dy = targetMousePos.current.y - mousePos.current.y
      mousePos.current.x += dx * 0.15
      mousePos.current.y += dy * 0.15

      // Apply 3D tilt directly to DOM node to avoid React render cycle
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        
        // Cap the max tilt to avoid extreme angles
        const tiltX = Math.max(-10, Math.min(10, (mousePos.current.y - centerY) / 40))
        const tiltY = Math.max(-10, Math.min(10, (centerX - mousePos.current.x) / 40))
        
        containerRef.current.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`
      }

      particles.forEach((p, i) => {
        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1

        // Mouse interaction
        const mdx = mousePos.current.x - p.x
        const mdy = mousePos.current.y - p.y
        const dist = Math.sqrt(mdx * mdx + mdy * mdy)
        
        if (dist < 150) {
          const angle = Math.atan2(mdy, mdx)
          const force = (150 - dist) / 150
          p.x -= Math.cos(angle) * force * 1.5
          p.y -= Math.sin(angle) * force * 1.5
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.fill()

        // Draw connections (only check remaining particles to avoid double drawing and halve the loop cost)
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx2 = p.x - p2.x
          const dy2 = p.y - p2.y
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
          if (dist2 < 120) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.15 * (1 - dist2 / 120)})`
            ctx.stroke()
          }
        }
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    targetMousePos.current = { x: e.clientX, y: e.clientY }
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
        <div 
          ref={containerRef} 
          className="w-full max-w-[420px] transition-transform duration-75 ease-out will-change-transform"
        >
          {children}
        </div>
      </div>
    </div>
  )
}
