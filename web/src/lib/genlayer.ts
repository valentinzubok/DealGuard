import { createClient } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";
import type { CalldataEncodable } from "genlayer-js/types";
import { TransactionStatus } from "genlayer-js/types";
import { EXPLORER_BASE, RPC_URL } from "./config";

export type Address = `0x${string}`;

type EthereumProvider = NonNullable<Parameters<typeof createClient>[0]>["provider"];

/**
 * GenLayer Studio Dev (61997). Built on the SDK's `studioDevnet` definition so the
 * consensus contracts, `isStudio` flag and fee policy match the chain; only the
 * RPC / explorer URLs are overridable.
 */
export const studioNext = {
  ...studioDevnet,
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: { default: { name: "Studio Dev Explorer", url: EXPLORER_BASE } },
} as typeof studioDevnet;

export function getReadClient() {
  return createClient({ chain: studioNext });
}

export function getWriteClient(account: Address, provider: EthereumProvider) {
  return createClient({ chain: studioNext, account, provider });
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
  // Studio Dev enforces the fee system: every tx must carry a non-zero fee deposit.
  const fees = await client.estimateTransactionFees({});
  const hash = await client.writeContract({
    address,
    functionName,
    args,
    value: BigInt(0),
    fees,
  });
  await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.ACCEPTED,
    retries: 200,
    interval: 3000,
  });
  return hash;
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const body = (await res.json()) as { result?: T; error?: { message?: string } };
  if (body.error) throw new Error(body.error.message || `${method} failed`);
  return body.result as T;
}

/** Studio faucet: tops up the connected wallet with test GEN for tx fees. */
export async function fundWithTestGen(address: Address, gen = 100): Promise<void> {
  // 100 * 1e18 is exactly representable as a JS number; the RPC expects a JSON number.
  await rpc("sim_fundAccount", [address, gen * 1e18]);
}

export async function getNativeBalance(address: Address): Promise<string> {
  const wei = BigInt(await rpc<string>("eth_getBalance", [address, "latest"]));
  return (wei / BigInt(10) ** BigInt(18)).toString();
}

export function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
