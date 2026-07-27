const svg = `
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg" opacity="0.05">
  <g fill="none" stroke="#000000" stroke-width="1.5">
    <!-- Book -->
    <path d="M 20 40 L 40 30 L 60 40 L 60 60 L 40 70 L 20 60 Z" />
    <path d="M 40 30 L 40 70" />
    <!-- Pencil -->
    <path d="M 120 40 L 140 20 L 150 30 L 130 50 Z" />
    <path d="M 120 40 L 110 45 L 115 35 Z" />
    <!-- Cap -->
    <path d="M 140 120 L 160 110 L 180 120 L 160 130 Z" />
    <path d="M 145 125 L 145 140 A 15 5 0 0 0 175 140 L 175 125" />
    <!-- Star -->
    <path d="M 60 140 L 65 150 L 75 150 L 67 157 L 70 167 L 60 160 L 50 167 L 53 157 L 45 150 L 55 150 Z" />
  </g>
</svg>
`;
console.log("data:image/svg+xml;base64," + Buffer.from(svg.trim()).toString('base64'));
