export type BenefitStatus = "draft" | "published" | "paused";
export type AccessType = "protected_content" | "external_link";

export type BenefitRule = {
  id?: number;
  benefit_id: string;
  position: number;
  token_address: string;
  token_symbol: string;
  minimum_scaled: string;
  minimum_display: number;
};

export type Benefit = {
  id: string;
  slug: string;
  creator_user_id: string | null;
  creator_wallet: string;
  source: "user" | "system";
  title: string;
  description: string;
  access_type: AccessType;
  network: "base-sepolia";
  chain_id: number;
  contract_address: string;
  onchain_benefit_id: number | null;
  create_tx_hash: string | null;
  rule_type: "SINGLE" | "ALL" | "ANY" | "BASKET";
  one_time: boolean;
  status: BenefitStatus;
  expires_at: string | null;
  metadata_uri: string | null;
  view_count: number;
  check_count: number;
  claim_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  equitykey_benefit_rules?: BenefitRule[];
};

export type EdgeError = { error: string; detail?: string };

