import type { WalletApi } from "../shared/api";

declare global {
  interface Window {
    wavel: WalletApi;
  }
}

export {};
