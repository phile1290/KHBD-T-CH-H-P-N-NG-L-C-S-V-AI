const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const target = `<div className="min-h-screen bg-gray-50 font-sans p-2 md:p-8">`;
const replace = `<div className="min-h-screen bg-gray-50 font-sans p-2 md:p-8" style={{ backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBvcGFjaXR5PSIwLjAzIj4KICA8ZyBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMS41Ij4KICAgIDwhLS0gQm9vayAtLT4KICAgIDxwYXRoIGQ9Ik0gMjAgNDAgTCA0MCAzMCBMIDYwIDQwIEwgNjAgNjAgTCA0MCA3MCBMIDIwIDYwIFoiIC8+CiAgICA8cGF0aCBkPSJNIDQwIDMwIEwgNDAgNzAiIC8+CiAgICA8IS0tIFBlbmNpbCAtLT4KICAgIDxwYXRoIGQ9Ik0gMTIwIDQwIEwgMTQwIDIwIEwgMTUwIDMwIEwgMTMwIDUwIFoiIC8+CiAgICA8cGF0aCBkPSJNIDEyMCA0MCBMIDExMCA0NSBMIDExNSAzNSBaIiAvPgogICAgPCEtLSBDYXAgLS0+CiAgICA8cGF0aCBkPSJNIDE0MCAxMjAgTCAxNjAgMTEwIEwgMTgwIDEyMCBMIDE2MCAxMzAgWiIgLz4KICAgIDxwYXRoIGQ9Ik0gMTQ1IDEyNSBMIDE0NSAxNDAgQSAxNSA1IDAgMCAwIDE3NSAxNDAgTCAxNzUgMTI1IiAvPgogICAgPCEtLSBTdGFyIC0tPgogICAgPHBhdGggZD0iTSA2MCAxNDAgTCA2NSAxNTAgTCA3NSAxNTAgTCA2NyAxNTcgTCA3MCAxNjcgTCA2MCAxNjAgTCA1MCAxNjcgTCA1MyAxNTcgTCA0NSAxNTAgTCA1NSAxNTAgWiIgLz4KICA8L2c+Cjwvc3ZnPg==")', backgroundRepeat: 'repeat' }}>`;

code = code.replace(target, replace);
fs.writeFileSync('App.tsx', code);
