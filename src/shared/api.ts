export type NetworkId = "ethereum" | "base" | "arbitrum" | "optimism" | "polygon";

export interface NetworkInfo {
  id: NetworkId;
  name: string;
  chainId: number;
  symbol: string;
  rpcUrl: string;
  explorerUrl: string;
}

export interface WalletStatus {
  hasVault: boolean;
  locked: boolean;
  address?: string;
  network: NetworkInfo;
  autoLockMinutes: number;
}

export interface DashboardData {
  address: string;
  balance: string;
  symbol: string;
  network: NetworkInfo;
}

export interface PreparedTransaction {
  id: string;
  to: string;
  amount: string;
  fee: string;
  total: string;
  symbol: string;
  network: NetworkInfo;
  expiresAt: number;
}

export interface WalletApi {
  status(): Promise<WalletStatus>;
  create(password: string): Promise<{ mnemonic: string; status: WalletStatus }>;
  import(mnemonic: string, password: string): Promise<WalletStatus>;
  unlock(password: string): Promise<WalletStatus>;
  lock(): Promise<WalletStatus>;
  dashboard(): Promise<DashboardData>;
  copyAddress(): Promise<void>;
  networks(): Promise<NetworkInfo[]>;
  setNetwork(id: NetworkId): Promise<WalletStatus>;
  setRpcUrl(id: NetworkId, rpcUrl: string): Promise<NetworkInfo>;
  setAutoLock(minutes: number): Promise<WalletStatus>;
  prepareTransaction(to: string, amount: string): Promise<PreparedTransaction>;
  broadcastTransaction(id: string): Promise<{ hash: string; explorerUrl: string }>;
}

export const IPC = {
  status: "wallet:status",
  create: "wallet:create",
  import: "wallet:import",
  unlock: "wallet:unlock",
  lock: "wallet:lock",
  dashboard: "wallet:dashboard",
  copyAddress: "wallet:copy-address",
  networks: "wallet:networks",
  setNetwork: "wallet:set-network",
  setRpcUrl: "wallet:set-rpc-url",
  setAutoLock: "wallet:set-auto-lock",
  prepareTransaction: "wallet:prepare-transaction",
  broadcastTransaction: "wallet:broadcast-transaction"
} as const;
