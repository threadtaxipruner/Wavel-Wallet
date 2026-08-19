import { randomUUID } from "node:crypto";
import { HDNodeWallet, JsonRpcProvider, Mnemonic, Wallet, formatEther, getAddress, parseEther } from "ethers";
import type { DashboardData, NetworkId, NetworkInfo, PreparedTransaction, WalletStatus } from "../shared/api";
import { DEFAULT_NETWORKS, validateRpcUrl } from "./networks";
import { Preferences } from "./preferences";
import { VaultStore } from "./vault";

interface PendingTransaction {
  id: string;
  expiresAt: number;
  network: NetworkInfo;
  transaction: {
    to: string;
    value: bigint;
    gasLimit: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    gasPrice?: bigint;
    nonce: number;
    chainId: number;
    type?: number;
  };
}

export class WalletService {
  private wallet?: HDNodeWallet;
  private lockTimer?: NodeJS.Timeout;
  private pending = new Map<string, PendingTransaction>();

  constructor(private readonly vault: VaultStore, private readonly preferences: Preferences) {}

  async initialize(): Promise<void> {
    await this.preferences.load();
  }

  async status(): Promise<WalletStatus> {
    return {
      hasVault: await this.vault.exists(),
      locked: !this.wallet,
      address: this.wallet?.address,
      network: this.network(),
      autoLockMinutes: this.preferences.autoLockMinutes
    };
  }

  async create(password: unknown): Promise<{ mnemonic: string; status: WalletStatus }> {
    const validPassword = requireString(password, "Password", 256);
    if (await this.vault.exists()) throw new Error("A wallet already exists on this device.");
    const wallet = Wallet.createRandom();
    const mnemonic = wallet.mnemonic?.phrase;
    if (!mnemonic) throw new Error("Recovery phrase generation failed.");
    await this.vault.save(mnemonic, validPassword);
    this.setWallet(mnemonic);
    return { mnemonic, status: await this.status() };
  }

  async import(mnemonicValue: unknown, password: unknown): Promise<WalletStatus> {
    const mnemonic = requireString(mnemonicValue, "Recovery phrase", 512).trim().toLowerCase().replace(/\s+/g, " ");
    const validPassword = requireString(password, "Password", 256);
    if (await this.vault.exists()) throw new Error("A wallet already exists on this device.");
    if (!Mnemonic.isValidMnemonic(mnemonic)) throw new Error("Enter a valid BIP-39 recovery phrase.");
    await this.vault.save(mnemonic, validPassword);
    this.setWallet(mnemonic);
    return this.status();
  }

  async unlock(password: unknown): Promise<WalletStatus> {
    const mnemonic = await this.vault.unlock(requireString(password, "Password", 256));
    try {
      this.setWallet(mnemonic);
      return this.status();
    } finally {
      // JavaScript strings cannot be reliably zeroed; the wallet object is discarded on lock.
    }
  }

  async lock(): Promise<WalletStatus> {
    this.wallet = undefined;
    this.pending.clear();
    if (this.lockTimer) clearTimeout(this.lockTimer);
    this.lockTimer = undefined;
    return this.status();
  }

  async dashboard(): Promise<DashboardData> {
    const wallet = this.requireWallet();
    const network = this.network();
    const provider = this.provider(network);
    const balance = await provider.getBalance(wallet.address);
    return { address: wallet.address, balance: formatEther(balance), symbol: network.symbol, network };
  }

  networks(): NetworkInfo[] {
    return Object.values(DEFAULT_NETWORKS).map((network) => ({ ...network, rpcUrl: this.preferences.getRpcUrl(network.id) }));
  }

  async setNetwork(id: NetworkId): Promise<WalletStatus> {
    await this.preferences.setNetwork(id);
    this.pending.clear();
    if (this.wallet) this.touch();
    return this.status();
  }

  async setRpcUrl(id: NetworkId, value: string): Promise<NetworkInfo> {
    const rpcUrl = validateRpcUrl(value);
    const network = { ...DEFAULT_NETWORKS[id], rpcUrl };
    const actual = await this.provider(network).getNetwork();
    if (actual.chainId !== BigInt(network.chainId)) {
      throw new Error(`RPC returned chain ID ${actual.chainId}; expected ${network.chainId}.`);
    }
    await this.preferences.setRpcUrl(id, rpcUrl);
    this.pending.clear();
    if (this.wallet) this.touch();
    return network;
  }

  async setAutoLock(minutes: number): Promise<WalletStatus> {
    await this.preferences.setAutoLock(minutes);
    if (this.wallet) this.touch();
    return this.status();
  }

  async prepareTransaction(toValue: unknown, amountValue: unknown): Promise<PreparedTransaction> {
    const wallet = this.requireWallet();
    this.touch();
    const to = getAddress(requireString(toValue, "Recipient", 128));
    const amount = requireString(amountValue, "Amount", 80);
    const value = parseEther(amount);
    if (value <= 0n) throw new Error("Amount must be greater than zero.");

    const network = this.network();
    const provider = this.provider(network);
    const actualNetwork = await provider.getNetwork();
    if (actualNetwork.chainId !== BigInt(network.chainId)) throw new Error("RPC chain identity does not match the selected network.");

    const base = { from: wallet.address, to, value };
    const [gasLimit, feeData, nonce] = await Promise.all([
      provider.estimateGas(base),
      provider.getFeeData(),
      provider.getTransactionCount(wallet.address, "pending")
    ]);
    const transaction: PendingTransaction["transaction"] = {
      to, value, gasLimit, nonce, chainId: network.chainId
    };
    let feePerGas: bigint;
    if (feeData.maxFeePerGas != null && feeData.maxPriorityFeePerGas != null) {
      transaction.type = 2;
      transaction.maxFeePerGas = feeData.maxFeePerGas;
      transaction.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
      feePerGas = feeData.maxFeePerGas;
    } else if (feeData.gasPrice != null) {
      transaction.type = 0;
      transaction.gasPrice = feeData.gasPrice;
      feePerGas = feeData.gasPrice;
    } else {
      throw new Error("The RPC provider did not return usable fee data.");
    }
    const fee = gasLimit * feePerGas;
    const balance = await provider.getBalance(wallet.address);
    if (value + fee > balance) throw new Error("Insufficient balance for the amount and maximum estimated fee.");

    const id = randomUUID();
    const expiresAt = Date.now() + 60_000;
    this.pending.clear();
    this.pending.set(id, { id, expiresAt, network, transaction });
    return { id, to, amount: formatEther(value), fee: formatEther(fee), total: formatEther(value + fee), symbol: network.symbol, network, expiresAt };
  }

  async broadcastTransaction(idValue: unknown): Promise<{ hash: string; explorerUrl: string }> {
    const wallet = this.requireWallet();
    this.touch();
    const id = requireString(idValue, "Transaction confirmation", 64);
    const pending = this.pending.get(id);
    this.pending.clear();
    if (!pending || pending.expiresAt < Date.now()) throw new Error("Transaction confirmation expired. Review the transaction again.");
    if (pending.network.id !== this.preferences.networkId) throw new Error("Selected network changed. Review the transaction again.");

    const provider = this.provider(pending.network);
    const signed = await wallet.signTransaction(pending.transaction);
    const response = await provider.broadcastTransaction(signed);
    return { hash: response.hash, explorerUrl: `${pending.network.explorerUrl}/tx/${response.hash}` };
  }

  private setWallet(mnemonic: string): void {
    this.wallet = HDNodeWallet.fromPhrase(mnemonic, undefined, "m/44'/60'/0'/0/0");
    this.touch();
  }

  private requireWallet(): HDNodeWallet {
    if (!this.wallet) throw new Error("Wallet is locked.");
    return this.wallet;
  }

  private network(): NetworkInfo {
    const network = DEFAULT_NETWORKS[this.preferences.networkId];
    return { ...network, rpcUrl: this.preferences.getRpcUrl(network.id) };
  }

  private provider(network: NetworkInfo): JsonRpcProvider {
    return new JsonRpcProvider(network.rpcUrl, { chainId: network.chainId, name: network.id }, { staticNetwork: true });
  }

  private touch(): void {
    if (this.lockTimer) clearTimeout(this.lockTimer);
    this.lockTimer = setTimeout(() => void this.lock(), this.preferences.autoLockMinutes * 60_000);
    this.lockTimer.unref();
  }
}

function requireString(value: unknown, name: string, maxLength: number): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`${name} is required.`);
  if (value.length > maxLength) throw new Error(`${name} is too long.`);
  return value;
}
