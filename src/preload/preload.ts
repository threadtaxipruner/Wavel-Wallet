import { contextBridge, ipcRenderer } from "electron";
import { IPC, type NetworkId, type WalletApi } from "../shared/api";

const api: WalletApi = Object.freeze({
  status: () => ipcRenderer.invoke(IPC.status),
  create: (password: string) => ipcRenderer.invoke(IPC.create, password),
  import: (mnemonic: string, password: string) => ipcRenderer.invoke(IPC.import, mnemonic, password),
  unlock: (password: string) => ipcRenderer.invoke(IPC.unlock, password),
  lock: () => ipcRenderer.invoke(IPC.lock),
  dashboard: () => ipcRenderer.invoke(IPC.dashboard),
  copyAddress: () => ipcRenderer.invoke(IPC.copyAddress),
  networks: () => ipcRenderer.invoke(IPC.networks),
  setNetwork: (id: NetworkId) => ipcRenderer.invoke(IPC.setNetwork, id),
  setRpcUrl: (id: NetworkId, rpcUrl: string) => ipcRenderer.invoke(IPC.setRpcUrl, id, rpcUrl),
  setAutoLock: (minutes: number) => ipcRenderer.invoke(IPC.setAutoLock, minutes),
  prepareTransaction: (to: string, amount: string) => ipcRenderer.invoke(IPC.prepareTransaction, to, amount),
  broadcastTransaction: (id: string) => ipcRenderer.invoke(IPC.broadcastTransaction, id)
});

contextBridge.exposeInMainWorld("wavel", api);
