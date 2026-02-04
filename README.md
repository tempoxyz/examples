# Tempo Examples

A collection of TypeScript App examples built on [Tempo](https://docs.tempo.xyz).

## Examples

| Example | Description |
| ------- | ----------- |
| [accounts](./examples/accounts) | Connecting accounts using Passkeys or external wallets |
| [exchange](./examples/exchange) | Stablecoin DEX trading with order placement, buy/sell swaps, and quotes |
| [issuance](./examples/issuance) | Stablecoin lifecycle: create tokens, mint/burn, manage roles, AMM liquidity, and rewards |
| [payments](./examples/payments) | Token transfers with memos and sponsored transactions |

## Quick Start

Clone a specific example:

```sh
pnpx gitpick tempoxyz/examples/tree/main/examples/<example-name> <example-name>
cd <example-name>
pnpm i
pnpm dev
```

Or run an example from this monorepo:

```sh
pnpm install
pnpm --filter <example-name> dev
```

## Contributing

See [_template-example](./examples/_template-example) for the starter template when creating new examples.

## Resources

- [Tempo Docs](https://docs.tempo.xyz)
- [Viem](https://github.com/wevm/viem)
- [Wagmi](https://github.com/wevm/wagmi)
