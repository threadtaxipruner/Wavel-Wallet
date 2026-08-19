const { spawn } = require("node:child_process");

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const electron = process.platform === "win32" ? "node_modules/.bin/electron.cmd" : "node_modules/.bin/electron";

function run(command, args, options = {}) {
  return spawn(command, args, { stdio: "inherit", ...options });
}

const build = run(npm, ["run", "build"]);
build.on("exit", (code) => {
  if (code !== 0) process.exit(code ?? 1);
  const app = run(electron, ["."]);
  app.on("exit", (appCode) => process.exit(appCode ?? 0));
});
