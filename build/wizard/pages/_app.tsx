import '../styles/globals.css';
import '../styles/style.sass';
import '@rainbow-me/rainbowkit/styles.css';

import type { AppProps } from 'next/app';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createClient, WagmiConfig } from 'wagmi';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { goerli } from 'wagmi/chains'
import {server_config} from '../config'

const { chains, provider, webSocketProvider } = configureChains(
  [
    goerli
  ],
  [
    jsonRpcProvider({
      rpc: (chain) => ({
        http: server_config.execution_client_rest,
      }),
    }),
    alchemyProvider({
      // This is Alchemy's default API key.
      // You can get your own at https://dashboard.alchemyapi.io
      apiKey: "8kMhSrpLGyIlRYBtAtT9IAVWeVK8hiOZ",
    }),
    publicProvider(),
  ]
);

const { connectors } = getDefaultWallets({
  appName: 'Avado Ethdo',
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
  webSocketProvider,
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <Component {...pageProps} />
      </RainbowKitProvider>
    </WagmiConfig>

  );
}

export default MyApp;
