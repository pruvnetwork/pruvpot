# PRUVPOT

Provably fair lottery on Solana devnet, built on the PRUV lottery program
(`Ckvfj2PVnEseErjbjFYM9LtqwvZaVLCN6m8Vii7qPddF`).

## What can be verified, and how

Every round can be checked from public chain data without trusting this UI:
open a round (home page or `/rounds/<id>`) and press **Verify this round yourself**.
The page reads the round account, recomputes the winner index from the committed
slot hash with the same rule the program uses, cross-checks the SlotHashes sysvar
while the slot is still in its window, and confirms the winning ticket belongs to
the recorded winner. The logic is in `lib/verify.ts`.

Trust model today: the seed is Solana's slot hash at a slot fixed when the round
opened (not VRF-grade: the slot leader has marginal influence), node votes are
re-derived and checked on-chain, and payouts are made by the program. PRUV's ZK
attestation layer is **not** part of this devnet deployment.

## Configuration

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_RPC_URL` to a devnet RPC
with an API key. Without it the app talks to the public devnet endpoint, which
rate-limits shared IPs and makes the page show an error box. On Vercel set the same
variable in the project settings and redeploy.

Admin (`/admin`) and node operator (`/operator`) screens open only for the
authority / operator wallet; there is no password.

## Development

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
