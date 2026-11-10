const fs = require('node:fs');
const path = require('node:path');

const projectDir = path.resolve(__dirname, '..');
const iconsetDir = path.join(projectDir, 'assets', 'timetimer.iconset');
const outputPath = path.join(projectDir, 'assets', 'timetimer.icns');

const entries = [
  ['icp4', 'icon_16x16@2x.png'],
  ['icp5', 'icon_32x32@2x.png'],
  ['ic07', 'icon_128x128@2x.png'],
  ['ic08', 'icon_256x256@2x.png'],
  ['ic09', 'icon_512x512.png'],
  ['ic10', 'icon_512x512@2x.png'],
];

const chunks = entries.map(([type, filename]) => {
  const payload = fs.readFileSync(path.join(iconsetDir, filename));
  const header = Buffer.alloc(8);
  header.write(type, 0, 4, 'ascii');
  header.writeUInt32BE(payload.length + 8, 4);
  return Buffer.concat([header, payload]);
});

const output = Buffer.concat([Buffer.from('icns'), Buffer.alloc(4), ...chunks]);
output.writeUInt32BE(output.length, 4);
fs.writeFileSync(outputPath, output);
console.log(`Wrote ${outputPath} (${output.length} bytes)`);
