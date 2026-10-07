import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const out = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url));

const mark = await readFile(new URL("../public/favicon.svg", import.meta.url));

const png32 = await sharp(mark).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header[6] = 32;
header[7] = 32;
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png32.length, 14);
header.writeUInt32LE(22, 18);
await writeFile(out("favicon.ico"), Buffer.concat([header, png32]));

const apple = `
<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
  <rect width="180" height="180" fill="#f7f4ef"/>
  <g transform="translate(38 38) scale(3.25)">
    ${mark.toString().replace(/<\/?svg[^>]*>/g, "")}
  </g>
</svg>`;
await sharp(Buffer.from(apple)).png().toFile(out("apple-touch-icon.png"));

await sharp("src/assets/images/bouquet-editorial.jpg")
  .resize(1200, 630, { fit: "cover", position: "attention" })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile("public/ogp.jpg");
