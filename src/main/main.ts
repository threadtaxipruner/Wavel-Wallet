import { app, BrowserWindow, clipboard, ipcMain, safeStorage, session } from "electron";
import { join } from "node:path";
import { IPC } from "../shared/api";
import { isNetworkId } from "./networks";
import { Preferences } from "./preferences";
import { VaultStore } from "./vault";
import { WalletService } from "./wallet-service";

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(async () => {
  const preferences = new Preferences(join(app.getPath("userData"), "preferences.json"));
  const vault = new VaultStore(join(app.getPath("userData"), "wavel-vault.json"), safeStorage);
  const wallet = new WalletService(vault, preferences);
  await wallet.initialize();

  registerIpc(wallet);
  hardenSession();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1060,
    height: 760,
    minWidth: 760,
    minHeight: 600,
    backgroundColor: "#07100e",
    show: false,
    autoHideMenuBar: true,
    title: "Wavel Wallet",
    webPreferences: {
      preload: join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event) => event.preventDefault());
  mainWindow.webContents.on("will-attach-webview", (event) => event.preventDefault());
  mainWindow.webContents.on("render-process-gone", () => { mainWindow = null; });
  mainWindow.once("ready-to-show", () => mainWindow?.show());

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (!app.isPackaged && devUrl) void mainWindow.loadURL(devUrl);
  else void mainWindow.loadFile(join(__dirname, "../../dist/renderer/index.html"));
}

function hardenSession(): void {
  const csp = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'";
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [csp]
      }
    });
  });
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
}

function registerIpc(wallet: WalletService): void {
  const handle = (channel: string, listener: (...args: unknown[]) => unknown) => {
    ipcMain.handle(channel, (event, ...args) => {
      if (!mainWindow || event.sender !== mainWindow.webContents || event.senderFrame !== mainWindow.webContents.mainFrame) {
        throw new Error("Unauthorized IPC sender.");
      }
      return listener(...args);
    });
  };

  handle(IPC.status, () => wallet.status());
  handle(IPC.create, (password) => wallet.create(password));
  handle(IPC.import, (mnemonic, password) => wallet.import(mnemonic, password));
  handle(IPC.unlock, (password) => wallet.unlock(password));
  handle(IPC.lock, () => wallet.lock());
  handle(IPC.dashboard, () => wallet.dashboard());
  handle(IPC.copyAddress, async () => {
    const status = await wallet.status();
    if (status.locked || !status.address) throw new Error("Wallet is locked.");
    clipboard.writeText(status.address);
  });
  handle(IPC.networks, () => wallet.networks());
  handle(IPC.setNetwork, (id) => {
    if (!isNetworkId(id)) throw new Error("Unknown network.");
    return wallet.setNetwork(id);
  });
  handle(IPC.setRpcUrl, (id, rpcUrl) => {
    if (!isNetworkId(id) || typeof rpcUrl !== "string") throw new Error("Invalid RPC settings.");
    return wallet.setRpcUrl(id, rpcUrl);
  });
  handle(IPC.setAutoLock, (minutes) => wallet.setAutoLock(Number(minutes)));
  handle(IPC.prepareTransaction, (to, amount) => wallet.prepareTransaction(to, amount));
  handle(IPC.broadcastTransaction, (id) => wallet.broadcastTransaction(id));
}
