import React from 'react';

const GLYPHS = ['+', '*', '<>', '{}', '[]', '/\\', '@@', '##', '01', '::', '()'];
const NODE_COUNT = 26;

function createNodes(width, height) {
  const nodes = [];
  for (let i = 0; i < NODE_COUNT; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    nodes.push({
      id: i,
      glyph: GLYPHS[i % GLYPHS.length],
      baseX: x,
      baseY: y,
      x,
      y,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      size: 11 + Math.random() * 14,
      opacity: 0.18 + Math.random() * 0.25
    });
  }
  return nodes;
}

export default function CursorDriftBackground() {
  const [nodes, setNodes] = React.useState([]);
  const nodeRefs = React.useRef([]);
  const nodesRef = React.useRef([]);
  const mouseRef = React.useRef({ x: 0, y: 0, active: false });

  React.useEffect(() => {
    const initialize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const generated = createNodes(width, height);
      nodesRef.current = generated;
      setNodes(generated);
    };

    initialize();

    const onResize = () => initialize();
    const onMove = (event) => {
      mouseRef.current = { x: event.clientX, y: event.clientY, active: true };
    };
    const onLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);

    let rafId = 0;
    const frame = () => {
      const nodes = nodesRef.current;
      const { x: mx, y: my, active } = mouseRef.current;

      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];

        if (active) {
          const dx = node.x - mx;
          const dy = node.y - my;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const influence = Math.max(0, 180 - dist) / 180;
          if (influence > 0) {
            node.vx += (dx / dist) * influence * 0.6;
            node.vy += (dy / dist) * influence * 0.6;
          }
        }

        node.vx += (node.baseX - node.x) * 0.005;
        node.vy += (node.baseY - node.y) * 0.005;
        node.vx *= 0.94;
        node.vy *= 0.94;

        node.x += node.vx;
        node.y += node.vy;

        const el = nodeRefs.current[i];
        if (el) {
          el.style.transform = `translate3d(${node.x}px, ${node.y}px, 0)`;
        }
      }

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {nodes.map((node, index) => (
        <span
          key={node.id}
          ref={(el) => {
            nodeRefs.current[index] = el;
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 select-none font-mono text-[#522b5b]"
          style={{
            transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
            fontSize: `${node.size}px`,
            opacity: node.opacity,
            textShadow: '0 8px 24px rgba(82, 43, 91, 0.18)'
          }}
        >
          {node.glyph}
        </span>
      ))}
    </div>
  );
}
