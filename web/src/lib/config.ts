/** Live DealGuard deploy on GenLayer Studio Dev (chain 61997). Override via env. */
export const DEFAULT_CONTRACT_ADDRESS = "0x9d2F35936528981aab4D3095a1eE93878C7D4E63";

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_DEALGUARD_ADDRESS ||
  DEFAULT_CONTRACT_ADDRESS) as `0x${string}`;

/** Studio Dev / Studio Next — chain ID 61997 (hackathon requirement). */
export const CHAIN_ID = 61997;
export const RPC_URL =
  process.env.NEXT_PUBLIC_GENLAYER_RPC || "https://studio-dev.genlayer.com/api";
export const STUDIO_URL = "https://studio-dev.genlayer.com/run-debug";
export const EXPLORER_BASE =
  process.env.NEXT_PUBLIC_GENLAYER_EXPLORER ||
  "https://explorer-studio-dev.genlayer.com";

export const EXPLORER = `${EXPLORER_BASE}/address/${CONTRACT_ADDRESS}`;
export const txUrl = (hash: string) => `${EXPLORER_BASE}/tx/${hash}`;

export const GITHUB = "https://github.com/valentinzubok/DealGuard";
export const DEMO_URL = "https://test-server.genlayer.com/static/genvm/hello.html";
export const DEFAULT_PROVIDER =
  "0x94E61053091C5C67C295e69458539d8D54a5B2D3" as `0x${string}`;
