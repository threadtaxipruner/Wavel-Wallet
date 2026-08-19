import type { NetworkId, NetworkInfo } from "../shared/api";

export const DEFAULT_NETWORKS: Record<NetworkId, NetworkInfo> = {
  ethereum: {
    id: "ethereum",
    name: "Ethereum",
    chainId: 1,
    symbol: "ETH",
    rpcUrl: "https://ethereum-rpc.publicnode.com",
    explorerUrl: "https://etherscan.io"
  },
  base: {
    id: "base",
    name: "Base",
    chainId: 8453,
    symbol: "ETH",
    rpcUrl: "https://mainnet.base.org",
    explorerUrl: "https://basescan.org"
  },
  arbitrum: {
    id: "arbitrum",
    name: "Arbitrum One",
    chainId: 42161,
    symbol: "ETH",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    explorerUrl: "https://arbiscan.io"
  },
  optimism: {
    id: "optimism",
    name: "Optimism",
    chainId: 10,
    symbol: "ETH",
    rpcUrl: "https://mainnet.optimism.io",
    explorerUrl: "https://optimistic.etherscan.io"
  },
  polygon: {
    id: "polygon",
    name: "Polygon",
    chainId: 137,
    symbol: "POL",
    rpcUrl: "https://polygon-bor-rpc.publicnode.com",
    explorerUrl: "https://polygonscan.com"
  }
};

export const NETWORK_IDS = Object.keys(DEFAULT_NETWORKS) as NetworkId[];

export function isNetworkId(value: unknown): value is NetworkId {
  return typeof value === "string" && NETWORK_IDS.includes(value as NetworkId);
}

export function validateRpcUrl(value: string): string {
  if (value.length > 500) throw new Error("RPC URL is too long.");

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Enter a valid RPC URL.");
  }

  const localHost = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1";
  if (url.protocol !== "https:" && !(url.protocol === "http:" && localHost)) {
    throw new Error("RPC URLs must use HTTPS. Plain HTTP is allowed only for localhost.");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("RPC URLs cannot contain credentials, query parameters, or fragments.");
  }
  return url.toString().replace(/\/$/, "");
}
