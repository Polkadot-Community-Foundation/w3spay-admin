// SPDX-License-Identifier: GPL-3.0-or-later
// @paritytech

export interface ReviveCallDryRun {
  readonly weight_required: {
    readonly ref_time: bigint;
    readonly proof_size: bigint;
  };
  readonly storage_deposit: {
    readonly type: "Charge" | "Refund";
    readonly value: bigint;
  };
  readonly result:
    | {
        readonly success: true;
        readonly value: {
          readonly flags: number;
          readonly data: Uint8Array;
        };
      }
    | {
        readonly success: false;
        readonly value: unknown;
      };
}

export interface WeightV2 {
  readonly ref_time: bigint;
  readonly proof_size: bigint;
}

export interface ReviveApiShim {
  call(
    origin: string,
    dest: string,
    value: bigint,
    gasLimit: WeightV2 | undefined,
    storageDepositLimit: bigint | undefined,
    data: Uint8Array,
    opts?: { at?: "best" | "finalized" },
  ): Promise<ReviveCallDryRun>;
  address(ss58: string): Promise<`0x${string}` | null | undefined>;
}
