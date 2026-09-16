import { createClient } from "genlayer-js";
import { defineChain } from "viem";
import type { CalldataEncodable } from "genlayer-js/types";
import { TransactionStatus } from "genlayer-js/types";
import { CHAIN_ID, EXPLORER_BASE, RPC_URL } from "./config";

export type Address = `0x${string}`;

type EthereumProvider = NonNullable<Parameters<typeof createClient>[0]>["provider"];

/**
 * Studio Next / studio-dev (61997). Defined locally so we do not point stable
 * `studionet` (61999) at the preview RPC — chain identity must match RPC.
 */
export const studioNext = defineChain({
  id: CHAIN_ID,
  name: "GenLayer Studio Next",
  nativeCurrency: { name: "GEN Token", symbol: "GEN", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: { name: "Studio Next Explorer", url: EXPLORER_BASE },
  },
  testnet: true,
});

export function getReadClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient({ chain: studioNext as any });
}

export function getWriteClient(account: Address, provider: EthereumProvider) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient({ chain: studioNext as any, account, provider });
}

export async function readContract<T = unknown>(
  address: Address,
  functionName: string,
  args: CalldataEncodable[] = [],
): Promise<T> {
  const client = getReadClient();
  return client.readContract({ address, functionName, args }) as Promise<T>;
}

export async function writeAndWait(
  account: Address,
  provider: unknown,
  address: Address,
  functionName: string,
  args: CalldataEncodable[] = [],
): Promise<string> {
  const client = getWriteClient(account, provider as EthereumProvider);
  // Prefer studio-dev alias when SDK supports it; fall back to studionet snap for MetaMask.
  try {
    await client.connect("studionet");
  } catch {
    // Wallet may already be on 61997 after WalletProvider switch.
  }
  const hash = await client.writeContract({
    address,
    functionName,
    args,
    value: BigInt(0),
  });
  await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
  });
  return hash;
}

export function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
