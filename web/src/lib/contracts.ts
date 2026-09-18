import { CONTRACT_ADDRESS } from "./config";
import { type Address, parseJson, readContract, writeAndWait } from "./genlayer";

function requireAddress(): Address {
  if (!CONTRACT_ADDRESS || !CONTRACT_ADDRESS.startsWith("0x")) {
    throw new Error(
      "Set NEXT_PUBLIC_DEALGUARD_ADDRESS to your Studio Dev (61997) deploy",
    );
  }
  return CONTRACT_ADDRESS as Address;
}

export type DealRow = {
  deal_id: string;
  client: string;
  provider: string;
  terms: string;
  amount: number;
  status: string;
  listing_items?: unknown[];
  delivery_items?: unknown[];
  pay_provider?: boolean;
};

export async function listDeals(): Promise<string[]> {
  const raw = await readContract<string>(requireAddress(), "list_deals", []);
  return parseJson<string[]>(raw, []);
}

export async function getDeal(id: string): Promise<DealRow | null> {
  const raw = await readContract<string>(requireAddress(), "get_deal", [id]);
  const parsed = parseJson<DealRow & { error?: string }>(raw, {} as DealRow);
  if ("error" in parsed && parsed.error) return null;
  return parsed.deal_id ? parsed : null;
}

export async function getOwner(): Promise<string> {
  return (await readContract<string>(requireAddress(), "get_owner", [])) || "";
}

export async function getStats(): Promise<unknown> {
  const raw = await readContract<string>(requireAddress(), "get_stats", []);
  return parseJson(raw, null);
}

export async function getBalance(user: string) {
  const raw = await readContract<string>(requireAddress(), "get_balance", [user]);
  return parseJson(raw, null);
}

export async function credit(
  account: Address,
  provider: unknown,
  user: string,
  amount: string,
) {
  return writeAndWait(account, provider, requireAddress(), "credit", [user, amount]);
}

export async function createDeal(
  account: Address,
  provider: unknown,
  dealId: string,
  providerAddr: string,
  terms: string,
  listingUrlsJson: string,
  amount: string,
) {
  return writeAndWait(account, provider, requireAddress(), "create_deal", [
    dealId,
    providerAddr,
    terms,
    listingUrlsJson,
    amount,
  ]);
}

export async function fund(account: Address, provider: unknown, dealId: string) {
  return writeAndWait(account, provider, requireAddress(), "fund", [dealId]);
}

export async function submitDelivery(
  account: Address,
  provider: unknown,
  dealId: string,
  deliveryUrlsJson: string,
) {
  return writeAndWait(account, provider, requireAddress(), "submit_delivery", [
    dealId,
    deliveryUrlsJson,
  ]);
}

export async function release(account: Address, provider: unknown, dealId: string) {
  return writeAndWait(account, provider, requireAddress(), "release", [dealId]);
}

export async function dispute(
  account: Address,
  provider: unknown,
  dealId: string,
  claim: string,
) {
  return writeAndWait(account, provider, requireAddress(), "dispute", [dealId, claim]);
}

export async function adjudicate(account: Address, provider: unknown, dealId: string) {
  return writeAndWait(account, provider, requireAddress(), "adjudicate", [dealId]);
}
