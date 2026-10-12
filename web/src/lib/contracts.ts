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
  /** Price in wei of native GEN. */
  amount: string;
  /** Wei this deal holds in the contract right now. */
  escrow: string;
  delivery_window: number;
  delivery_due_at: number;
  paid_to: string;
  paid_amount: string;
  status: string;
  listing_items?: unknown[];
  delivery_items?: unknown[];
  pay_provider?: boolean;
  /** v3: seconds the losing side has to appeal a ruling before it can be paid. */
  appeal_window?: number;
  ruling_pay?: boolean;
  appeal_until?: number;
  appellant?: string;
  grounds?: string;
  appeal_result?: string;
  outcome?: string;
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

/** Wei the contract owes this address outside any deal (an overpaid or refused funding). */
export async function getCredit(user: string): Promise<string> {
  return (await readContract<string>(requireAddress(), "get_credit", [user])) || "0";
}

/** Wei the contract actually holds: every funded deal plus every credit. */
export async function getEscrowBalance(): Promise<string> {
  return (await readContract<string>(requireAddress(), "get_escrow_balance", [])) || "0";
}

export type Schedule = {
  deal_id: string;
  now: number;
  status: string;
  delivery_due_at: number;
  can_fund: boolean;
  can_deliver: boolean;
  can_reclaim: boolean;
  can_release: boolean;
  can_dispute: boolean;
  can_adjudicate: boolean;
  appeal_until: number;
  ruling_pay: boolean;
  can_appeal: boolean;
  can_settle: boolean;
  can_adjudicate_appeal: boolean;
};

export async function getSchedule(id: string): Promise<Schedule | null> {
  const raw = await readContract<string>(requireAddress(), "get_schedule", [id]);
  const parsed = parseJson<Schedule & { error?: string }>(raw, {} as Schedule);
  return parsed.deal_id ? parsed : null;
}

export async function createDeal(
  account: Address,
  provider: unknown,
  dealId: string,
  providerAddr: string,
  terms: string,
  listingUrlsJson: string,
  amountWei: string,
  deliveryWindow: string,
  appealWindow: string,
) {
  return writeAndWait(account, provider, requireAddress(), "create_deal", [
    dealId,
    providerAddr,
    terms,
    listingUrlsJson,
    amountWei,
    deliveryWindow,
    appealWindow,
  ]);
}

/** The deal amount travels as the transaction's value and is escrowed by the contract. */
export async function fund(
  account: Address,
  provider: unknown,
  dealId: string,
  amountWei: string,
) {
  return writeAndWait(account, provider, requireAddress(), "fund", [dealId], BigInt(amountWei));
}

export async function reclaim(account: Address, provider: unknown, dealId: string) {
  return writeAndWait(account, provider, requireAddress(), "reclaim", [dealId]);
}

export async function withdrawCredit(account: Address, provider: unknown) {
  return writeAndWait(account, provider, requireAddress(), "withdraw_credit", []);
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

/** The side a ruling went against asks for a second consensus round. */
export async function appeal(account: Address, provider: unknown, dealId: string, grounds: string) {
  return writeAndWait(account, provider, requireAddress(), "appeal", [dealId, grounds]);
}

/** The second, independent round. Its verdict is final and is paid in this call. */
export async function adjudicateAppeal(account: Address, provider: unknown, dealId: string) {
  return writeAndWait(account, provider, requireAddress(), "adjudicate_appeal", [dealId]);
}

/** Pay a ruling nobody appealed, once the appeal window has closed. */
export async function settle(account: Address, provider: unknown, dealId: string) {
  return writeAndWait(account, provider, requireAddress(), "settle", [dealId]);
}
