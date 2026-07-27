const svg = `<svg width="240" height="240" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke="#0d9488" stroke-width="1.3" opacity="0.09">
    <!-- Book -->
    <path d="M 30 50 L 55 38 L 80 50 L 80 75 L 55 63 L 30 75 Z" />
    <path d="M 55 38 L 55 63" />
    <!-- Graduation Cap -->
    <path d="M 160 45 L 190 32 L 220 45 L 190 58 Z" />
    <path d="M 170 50 L 170 68 A 20 8 0 0 0 210 68 L 210 50" />
    <path d="M 220 45 L 220 65" />
    <!-- Pencil -->
    <path d="M 35 150 L 55 130 L 67 142 L 47 162 Z" />
    <path d="M 35 150 L 27 155 L 32 145 Z" />
    <!-- Computer Screen -->
    <rect x="150" y="130" width="45" height="30" rx="3" />
    <path d="M 162 160 L 183 160 M 172 160 L 172 166 M 158 166 L 187 166" />
    <!-- AI Sparkle -->
    <path d="M 100 110 L 105 125 L 120 130 L 105 135 L 100 150 L 95 135 L 80 130 L 95 125 Z" />
    <!-- Compass / Math -->
    <circle cx="100" cy="40" r="10" />
    <path d="M 100 30 L 100 50 M 90 40 L 110 40" />
  </g>
</svg>`;
console.log("data:image/svg+xml;base64," + Buffer.from(svg.trim()).toString('base64'));
