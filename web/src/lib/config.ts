export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_DEALGUARD_ADDRESS ??
  "") as `0x${string}` | "";

/** Studio Next / studio-dev — chain ID 61997 (hackathon requirement). */
export const CHAIN_ID = 61997;
export const RPC_URL =
  process.env.NEXT_PUBLIC_GENLAYER_RPC ?? "https://studio-next.genlayer.com/api";
export const EXPLORER_BASE =
  process.env.NEXT_PUBLIC_GENLAYER_EXPLORER ??
  "https://explorer-studio-dev.genlayer.com";

export const EXPLORER = CONTRACT_ADDRESS
  ? `${EXPLORER_BASE}/address/${CONTRACT_ADDRESS}`
  : EXPLORER_BASE;

export const GITHUB = "https://github.com/valentinzubok/DealGuard";
export const DEMO_URL = "https://test-server.genlayer.com/static/genvm/hello.html";
export const DEFAULT_PROVIDER =
  "0x1111111111111111111111111111111111111111" as `0x${string}`;
