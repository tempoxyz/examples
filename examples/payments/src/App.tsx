import { useState } from 'react'
import { formatUnits, pad, parseUnits, stringToHex } from 'viem'
import {
  useAccount,
  useConnect,
  useConnectors,
  useDisconnect,
  useWatchBlockNumber,
} from 'wagmi'
import { Hooks } from 'wagmi/tempo'
import { alphaUsd, betaUsd, pathUsd, sponsorAccount } from './wagmi.config'

export function App() {
  const account = useAccount()

  const alphaUsdBalance = Hooks.token.useGetBalance({
    account: account?.address,
    token: alphaUsd,
  })

  return (
    <div>
      <h1>Tempo Example</h1>
      <hr />
      {account.isConnected ? (
        <>
          <h2>Account</h2>
          <Account />
          <h2>Fund Account</h2>
          <FundAccount />
          <h2>Balances</h2>
          <Balance />
          {alphaUsdBalance.data && alphaUsdBalance.data > 0n && (
            <>
              <h2>Send 100 Alpha USD</h2>
              <SendPayment />
            </>
          )}
        </>
      ) : (
        <>
          <h2>Connect</h2>
          <Connect />
        </>
      )}
    </div>
  )
}

export function Connect() {
  const connect = useConnect()
  const [connector] = useConnectors()

  return (
    <div>
      <button
        onClick={() =>
          connect.connect({ connector, capabilities: { type: 'sign-up' } })
        }
        type="button"
      >
        Sign up
      </button>
      <button onClick={() => connect.connect({ connector })} type="button">
        Sign in
      </button>
    </div>
  )
}

export function Account() {
  const account = useAccount()
  const disconnect = useDisconnect()

  return (
    <div>
      <div>
        <strong>Address: </strong>
        {account.address}
      </div>
      <button type="button" onClick={() => disconnect.disconnect()}>
        Disconnect
      </button>
    </div>
  )
}

export function Balance() {
  const account = useAccount()

  const alphaUsdBalance = Hooks.token.useGetBalance({
    account: account?.address,
    token: alphaUsd,
  })
  const betaUsdBalance = Hooks.token.useGetBalance({
    account: account?.address,
    token: betaUsd,
  })

  const sponsorAlphaUsdBalance = Hooks.token.useGetBalance({
    account: sponsorAccount.address,
    token: alphaUsd,
  })

  const alphaUsdMetadata = Hooks.token.useGetMetadata({
    token: alphaUsd,
  })
  const betaUsdMetadata = Hooks.token.useGetMetadata({
    token: betaUsd,
  })

  useWatchBlockNumber({
    onBlockNumber() {
      alphaUsdBalance.refetch()
      betaUsdBalance.refetch()
      sponsorAlphaUsdBalance.refetch()
    },
  })

  // Only show section if either alphaUsd or betaUsd metadata are loaded
  if (!alphaUsdMetadata.data && !betaUsdMetadata.data) return null
  return (
    <div>
      {alphaUsdMetadata.data && (
        <div>
          <strong>{alphaUsdMetadata.data?.name} Balance: </strong>
          {formatUnits(
            alphaUsdBalance.data ?? 0n,
            alphaUsdMetadata.data?.decimals ?? 6,
          )}{' '}
          {alphaUsdMetadata.data?.symbol}
        </div>
      )}
      {betaUsdMetadata.data && (
        <div>
          <strong>{betaUsdMetadata.data?.name} Balance: </strong>
          {formatUnits(
            betaUsdBalance.data ?? 0n,
            betaUsdMetadata.data?.decimals ?? 6,
          )}{' '}
          {betaUsdMetadata.data?.symbol}
        </div>
      )}
      <br />
      {alphaUsdMetadata.data && (
        <div>
          <div>
            <strong>Sponsor Account: </strong>
            {sponsorAccount.address}
          </div>
          <div>
            <strong>Sponsor Balance: </strong>
            {`${formatUnits(sponsorAlphaUsdBalance.data ?? 0n, alphaUsdMetadata.data?.decimals ?? 6)} ${alphaUsdMetadata.data?.symbol}`}
          </div>
        </div>
      )}
    </div>
  )
}

export function FundAccount() {
  const account = useAccount()
  const fund = Hooks.faucet.useFund()

  if (!account.address) return null
  return (
    <div>
      <button
        disabled={fund.isPending}
        type="button"
        onClick={() => fund.mutate({ account: account.address! })}
      >
        Fund Account
      </button>

      {fund.data && (
        <div>
          Receipts:{' '}
          {fund.data.map((hash) => (
            <div key={hash}>
              <a href={`https://explore.tempo.xyz/${hash}`} target="_blank">
                {hash}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function SendPayment() {
  const [feePayment, setFeePayment] = useState<
    'token' | 'sponsor-relay' | 'sponsor-local'
  >('token')

  const sendPayment = Hooks.token.useTransferSync()
  const metadata = Hooks.token.useGetMetadata({
    token: alphaUsd,
  })

  if (!metadata.data) return null
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.target as HTMLFormElement)

        const recipient = (formData.get('recipient') ||
          '0x0000000000000000000000000000000000000000') as `0x${string}`
        const memo = formData.get('memo') as string

        const [feePayer, feeToken] = (() => {
          if (feePayment === 'sponsor-relay')
            return [true, undefined] as const
          if (feePayment === 'sponsor-local')
            return [sponsorAccount, undefined] as const

          const selectedFeeToken = formData.get('feeToken') as string
          const feeTokenAddress =
            selectedFeeToken === 'pathUsd'
              ? pathUsd
              : selectedFeeToken === 'betaUsd'
                ? betaUsd
                : alphaUsd
          return [undefined, feeTokenAddress] as const
        })()

        sendPayment.mutate({
          amount: parseUnits('100', metadata.data.decimals),
          memo: memo ? pad(stringToHex(memo), { size: 32 }) : undefined,
          feePayer,
          feeToken,
          to: recipient,
          token: alphaUsd,
        })
      }}
    >
      <div>
        <label htmlFor="recipient">Recipient address</label>
        <input type="text" name="recipient" placeholder="0x..." />
      </div>

      <div>
        <label htmlFor="memo">Memo (optional)</label>
        <input type="text" name="memo" placeholder="INV-12345" />
      </div>

      <div>
        <label htmlFor="feePayment">Fee Payment</label>
        <select
          name="feePayment"
          value={feePayment}
          onChange={(e) =>
            setFeePayment(
              e.target.value as 'token' | 'sponsor-relay' | 'sponsor-local',
            )
          }
        >
          <option value="token">Pay with Token</option>
          <option value="sponsor-relay">Sponsored (via Relay)</option>
          <option value="sponsor-local">Sponsored (via Local Sponsor)</option>
        </select>
      </div>

      <div>
        <label htmlFor="feeToken">Fee Token</label>
        <select name="feeToken" disabled={feePayment !== 'token'}>
          <option value="pathUsd">PathUSD</option>
          <option value="alphaUsd">AlphaUSD</option>
          <option value="betaUsd">BetaUSD</option>
        </select>
      </div>

      <button disabled={sendPayment.isPending} type="submit">
        Send Payment
      </button>

      {sendPayment.data && (
        <a
          href={`https://explore.tempo.xyz/tx/${sendPayment.data.receipt.transactionHash}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View receipt
        </a>
      )}
    </form>
  )
}
