const fs = require("node:fs");

for (const directory of ["dist", "dist-electron", "release"]) {
  fs.rmSync(directory, { recursive: true, force: true });
}
