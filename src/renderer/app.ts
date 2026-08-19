import "./styles.css";
import type { DashboardData, NetworkId, NetworkInfo, PreparedTransaction, WalletStatus } from "../shared/api";

const rootNode = document.querySelector<HTMLDivElement>("#app");
if (!rootNode) throw new Error("Application root is missing.");
const root = rootNode;

let status: WalletStatus;
let dashboard: DashboardData | undefined;
let networks: NetworkInfo[] = [];
let recoveryPhrase: string | undefined;
let prepared: PreparedTransaction | undefined;
let activePanel: "home" | "receive" | "send" | "settings" = "home";
let notice = "";
let error = "";
let refreshTimer: number | undefined;

void initialize();

async function initialize(): Promise<void> {
  try {
    status = await window.wavel.status();
    networks = await window.wavel.networks();
    if (!status.locked) await refreshDashboard();
    render();
    scheduleRefresh();
  } catch (cause) {
    root.textContent = friendlyError(cause);
  }
}

function render(): void {
  root.replaceChildren();
  if (!status.hasVault) renderOnboarding();
  else if (recoveryPhrase) renderRecoveryPhrase();
  else if (status.locked) renderUnlock();
  else renderWallet();
}

function renderOnboarding(): void {
  const shell = element("main", "onboarding");
  shell.append(brand(), heading("Your wallet, on your machine", "Create a new EVM wallet or restore a standard BIP-39 recovery phrase."));

  const tabs = element("div", "tabs");
  const createButton = button("Create wallet", "tab active");
  const importButton = button("Import phrase", "tab");
  const form = element("form", "card auth-card") as HTMLFormElement;
  let importing = false;
  tabs.append(createButton, importButton);

  const drawForm = () => {
    form.replaceChildren();
    if (importing) form.append(field("Recovery phrase", "mnemonic", "textarea", "Twelve or twenty-four words", "off"));
    form.append(field("Vault password", "password", "password", "At least 10 characters", "new-password"));
    form.append(field("Confirm password", "confirm", "password", "Repeat your password", "new-password"));
    form.append(messageArea(), submit(importing ? "Import wallet" : "Create wallet"));
  };
  createButton.addEventListener("click", () => { importing = false; createButton.classList.add("active"); importButton.classList.remove("active"); drawForm(); });
  importButton.addEventListener("click", () => { importing = true; importButton.classList.add("active"); createButton.classList.remove("active"); drawForm(); });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessages();
    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    if (password !== String(data.get("confirm") ?? "")) return showError("Passwords do not match.");
    await busy(form, async () => {
      if (importing) {
        status = await window.wavel.import(String(data.get("mnemonic") ?? ""), password);
      } else {
        const created = await window.wavel.create(password);
        status = created.status;
        recoveryPhrase = created.mnemonic;
      }
      if (!status.locked) await refreshDashboard();
      render();
    });
  });
  drawForm();
  shell.append(tabs, form, securityNote());
  root.append(shell);
}

function renderRecoveryPhrase(): void {
  const shell = element("main", "onboarding");
  const card = element("section", "card phrase-card");
  card.append(brand(), heading("Write down your recovery phrase", "This is the only time Wavel displays it. Anyone with these words can control your wallet."));
  const words = element("ol", "phrase-grid");
  recoveryPhrase?.split(" ").forEach((word) => {
    const item = document.createElement("li");
    item.textContent = word;
    words.append(item);
  });
  const confirm = document.createElement("label");
  confirm.className = "check";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  confirm.append(checkbox, document.createTextNode(" I stored these words offline and understand they cannot be recovered by Wavel."));
  const continueButton = button("I have saved it", "primary");
  continueButton.disabled = true;
  checkbox.addEventListener("change", () => { continueButton.disabled = !checkbox.checked; });
  continueButton.addEventListener("click", () => {
    recoveryPhrase = undefined;
    render();
  });
  card.append(words, confirm, continueButton);
  shell.append(card);
  root.append(shell);
}

function renderUnlock(): void {
  const shell = element("main", "onboarding");
  const form = element("form", "card auth-card") as HTMLFormElement;
  form.append(brand(), heading("Welcome back", `Unlock your local vault to use ${status.network.name}.`));
  form.append(field("Vault password", "password", "password", "Your password", "current-password"), messageArea(), submit("Unlock wallet"));
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessages();
    await busy(form, async () => {
      status = await window.wavel.unlock(String(new FormData(form).get("password") ?? ""));
      await refreshDashboard();
      render();
    });
  });
  shell.append(form, securityNote());
  root.append(shell);
}

function renderWallet(): void {
  const app = element("div", "app-shell");
  const sidebar = element("aside", "sidebar");
  sidebar.append(brand());
  const nav = element("nav", "nav");
  for (const [panel, label] of [["home", "Overview"], ["receive", "Receive"], ["send", "Send"], ["settings", "Settings"]] as const) {
    const item = button(label, panel === activePanel ? "nav-item active" : "nav-item");
    item.addEventListener("click", () => { activePanel = panel; prepared = undefined; clearMessages(); render(); });
    nav.append(item);
  }
  const lockButton = button("Lock wallet", "lock-button");
  lockButton.addEventListener("click", async () => { status = await window.wavel.lock(); dashboard = undefined; render(); });
  sidebar.append(nav, lockButton);

  const content = element("main", "content");
  const topbar = element("header", "topbar");
  const networkSelect = document.createElement("select");
  networkSelect.setAttribute("aria-label", "Selected network");
  for (const network of networks) {
    const option = document.createElement("option");
    option.value = network.id;
    option.textContent = network.name;
    option.selected = network.id === status.network.id;
    networkSelect.append(option);
  }
  networkSelect.addEventListener("change", async () => {
    try {
      status = await window.wavel.setNetwork(networkSelect.value as NetworkId);
      await refreshDashboard();
      clearMessages();
    } catch (cause) { error = friendlyError(cause); }
    render();
  });
  topbar.append(networkSelect, addressPill(status.address ?? ""));
  content.append(topbar, messageArea());
  if (activePanel === "home") content.append(renderHome());
  if (activePanel === "receive") content.append(renderReceive());
  if (activePanel === "send") content.append(renderSend());
  if (activePanel === "settings") content.append(renderSettings());
  app.append(sidebar, content);
  root.append(app);
}

function renderHome(): HTMLElement {
  const section = element("section", "panel");
  section.append(heading("Overview", "Native balance for the selected network."));
  const balanceCard = element("div", "balance-card");
  const eyebrow = element("span", "eyebrow", status.network.name);
  const balance = element("strong", "balance", dashboard ? `${trimBalance(dashboard.balance)} ${dashboard.symbol}` : "Unavailable");
  const refresh = button("Refresh balance", "secondary");
  refresh.addEventListener("click", async () => {
    clearMessages();
    await busy(refresh, async () => { await refreshDashboard(); notice = "Balance refreshed."; render(); });
  });
  balanceCard.append(eyebrow, balance, refresh);
  const warning = element("p", "beta-note", "Unaudited beta software. Verify the network, recipient, amount, and fee before sending. Start with a small amount.");
  section.append(balanceCard, warning);
  return section;
}

function renderReceive(): HTMLElement {
  const section = element("section", "panel narrow");
  section.append(heading("Receive", `Share this address to receive ${status.network.symbol} on ${status.network.name}.`));
  const card = element("div", "card receive-card");
  card.append(element("span", "eyebrow", "Your EVM address"), element("code", "full-address", status.address));
  const copy = button("Copy address", "primary");
  copy.addEventListener("click", () => void copyAddress());
  card.append(copy, element("p", "caution", `Only send assets supported on ${status.network.name}. Wavel currently displays native balances only.`));
  section.append(card);
  return section;
}

function renderSend(): HTMLElement {
  const section = element("section", "panel narrow");
  section.append(heading("Send", `Send native ${status.network.symbol} on ${status.network.name}.`));
  if (prepared) {
    const review = element("div", "card review");
    review.append(element("span", "eyebrow", "Confirm exact transaction"));
    review.append(reviewRow("Network", prepared.network.name), reviewRow("To", prepared.to), reviewRow("Amount", `${prepared.amount} ${prepared.symbol}`), reviewRow("Maximum fee", `${prepared.fee} ${prepared.symbol}`), reviewRow("Maximum total", `${prepared.total} ${prepared.symbol}`));
    review.append(element("p", "caution", "The maximum fee can exceed the fee ultimately charged. Confirmation expires after 60 seconds."));
    const actions = element("div", "actions");
    const cancel = button("Cancel", "secondary");
    cancel.addEventListener("click", () => { prepared = undefined; render(); });
    const confirm = button("Sign and broadcast", "danger");
    confirm.addEventListener("click", async () => {
      clearMessages();
      await busy(confirm, async () => {
        const result = await window.wavel.broadcastTransaction(prepared!.id);
        prepared = undefined;
        notice = `Broadcast ${result.hash}`;
        await refreshDashboard();
        render();
      });
    });
    actions.append(cancel, confirm);
    review.append(actions);
    section.append(review);
    return section;
  }

  const form = element("form", "card send-form") as HTMLFormElement;
  form.append(field("Recipient address", "to", "text", "0x...", "off"), field(`Amount (${status.network.symbol})`, "amount", "text", "0.0", "off"), submit("Review fee and transaction"));
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessages();
    const data = new FormData(form);
    await busy(form, async () => {
      prepared = await window.wavel.prepareTransaction(String(data.get("to") ?? ""), String(data.get("amount") ?? ""));
      render();
    });
  });
  section.append(form);
  return section;
}

function renderSettings(): HTMLElement {
  const section = element("section", "panel narrow");
  section.append(heading("Settings", "RPC requests expose your public address and IP address to the selected provider."));
  const lockForm = element("form", "card settings-card") as HTMLFormElement;
  const lockField = field("Auto-lock after minutes", "minutes", "number", "5", "off");
  const lockInput = lockField.querySelector("input")!;
  lockInput.min = "1";
  lockInput.max = "60";
  lockInput.value = String(status.autoLockMinutes);
  lockForm.append(element("h3", "", "Session"), lockField, submit("Save auto-lock"));
  lockForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await busy(lockForm, async () => {
      status = await window.wavel.setAutoLock(Number(new FormData(lockForm).get("minutes")));
      notice = "Auto-lock updated.";
      render();
    });
  });

  const rpcForm = element("form", "card settings-card") as HTMLFormElement;
  const rpcNetwork = document.createElement("select");
  rpcNetwork.name = "network";
  for (const network of networks) {
    const option = document.createElement("option");
    option.value = network.id;
    option.textContent = `${network.name} (${network.chainId})`;
    rpcNetwork.append(option);
  }
  const rpcField = field("RPC URL", "rpcUrl", "url", "https://...", "off");
  const rpcInput = rpcField.querySelector("input")!;
  const syncRpc = () => { rpcInput.value = networks.find((item) => item.id === rpcNetwork.value)?.rpcUrl ?? ""; };
  rpcNetwork.value = status.network.id;
  rpcNetwork.addEventListener("change", syncRpc);
  syncRpc();
  const selectLabel = element("label", "field");
  selectLabel.append(element("span", "", "Network"), rpcNetwork);
  rpcForm.append(element("h3", "", "Network provider"), selectLabel, rpcField, element("p", "hint", "Use a keyless HTTPS endpoint without credentials or query parameters."), submit("Verify and save RPC"));
  rpcForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessages();
    await busy(rpcForm, async () => {
      await window.wavel.setRpcUrl(rpcNetwork.value as NetworkId, rpcInput.value);
      networks = await window.wavel.networks();
      status = await window.wavel.status();
      if (rpcNetwork.value === status.network.id) await refreshDashboard();
      notice = "RPC chain identity verified and saved.";
      render();
    });
  });
  section.append(lockForm, rpcForm, element("p", "beta-note", "Wavel has no telemetry, update service, dApp browser, or remote application content."));
  return section;
}

async function refreshDashboard(): Promise<void> {
  try {
    dashboard = await window.wavel.dashboard();
    status = await window.wavel.status();
  } catch (cause) {
    const latest = await window.wavel.status();
    status = latest;
    dashboard = undefined;
    if (!latest.locked) error = friendlyError(cause);
  }
}

function scheduleRefresh(): void {
  if (refreshTimer) window.clearInterval(refreshTimer);
  refreshTimer = window.setInterval(async () => {
    if (!status.hasVault || status.locked || recoveryPhrase) return;
    await refreshDashboard();
    render();
  }, 30_000);
}

function brand(): HTMLElement {
  const node = element("div", "brand");
  const mark = element("span", "mark", "W");
  node.append(mark, element("span", "wordmark", "Wavel"));
  return node;
}

function heading(title: string, subtitle: string): HTMLElement {
  const wrap = element("div", "heading");
  wrap.append(element("h1", "", title), element("p", "", subtitle));
  return wrap;
}

function securityNote(): HTMLElement {
  return element("p", "security-note", "Keys are encrypted locally. Wavel cannot recover your password or recovery phrase.");
}

function field(labelText: string, name: string, type: string, placeholder: string, autocomplete: string): HTMLLabelElement {
  const label = element("label", "field") as HTMLLabelElement;
  label.append(element("span", "", labelText));
  const input = type === "textarea" ? document.createElement("textarea") : document.createElement("input");
  input.name = name;
  if (input instanceof HTMLInputElement) input.type = type;
  input.placeholder = placeholder;
  input.setAttribute("autocomplete", autocomplete);
  input.required = true;
  if (type === "password") input.maxLength = 256;
  label.append(input);
  return label;
}

function submit(text: string): HTMLButtonElement {
  const node = button(text, "primary");
  node.type = "submit";
  return node;
}

function button(text: string, className: string): HTMLButtonElement {
  const node = element("button", className, text) as HTMLButtonElement;
  node.type = "button";
  return node;
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function messageArea(): HTMLElement {
  const area = element("div", "messages");
  if (error) area.append(element("p", "message error", error));
  if (notice) area.append(element("p", "message success", notice));
  return area;
}

function addressPill(address: string): HTMLElement {
  const pill = button(shortAddress(address), "address-pill");
  pill.title = "Copy address";
  pill.addEventListener("click", () => void copyAddress());
  return pill;
}

function reviewRow(label: string, value: string): HTMLElement {
  const row = element("div", "review-row");
  row.append(element("span", "", label), element("strong", "", value));
  return row;
}

async function busy(target: HTMLElement, operation: () => Promise<void>): Promise<void> {
  const controls = target.matches("button") ? [target as HTMLButtonElement] : Array.from(target.querySelectorAll<HTMLButtonElement>("button"));
  controls.forEach((control) => { control.disabled = true; });
  try {
    await operation();
  } catch (cause) {
    error = friendlyError(cause);
    render();
  } finally {
    controls.forEach((control) => { control.disabled = false; });
  }
}

async function copyAddress(): Promise<void> {
  clearMessages();
  try {
    await window.wavel.copyAddress();
    notice = "Address copied. Compare it after pasting.";
  } catch {
    error = "Clipboard access failed. Select and copy the address manually.";
  }
  render();
}

function clearMessages(): void { notice = ""; error = ""; }
function showError(value: string): void { error = value; render(); }
function shortAddress(value: string): string { return value ? `${value.slice(0, 6)}...${value.slice(-4)}` : ""; }
function trimBalance(value: string): string { return Number(value).toLocaleString(undefined, { maximumFractionDigits: 8 }); }
function friendlyError(cause: unknown): string {
  const raw = cause instanceof Error ? cause.message : "Something went wrong.";
  return raw.replace(/^Error invoking remote method '[^']+': Error: /, "").replace(/^Error: /, "");
}
