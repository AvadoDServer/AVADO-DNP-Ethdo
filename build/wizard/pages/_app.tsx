import '../styles/globals.scss';
// import '../styles/style.sass';
import '@rainbow-me/rainbowkit/styles.css';

import type { AppProps } from 'next/app';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createClient, mainnet, WagmiConfig } from 'wagmi';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { gnosis, goerli } from 'wagmi/chains'
import { server_config } from '../server_config'
import axios from 'axios';
import { useEffect, useState } from 'react';

function MyApp({ Component, pageProps }: AppProps) {
  const [wagmiClient, setWagmiClient] = useState<any>();
  const [chains, setChains] = useState<any>();

  useEffect(() => {
    const setupClient = async () => {
      const data = await axios.get(`${server_config.monitor_url}/executionclients`).then((res) => res.data)
      const clientRpcs = data.map((c: any) => c.api)

      const { chains, provider, webSocketProvider } = configureChains(
        [
          goerli, mainnet, gnosis
        ],
        clientRpcs.map((client_rpc: any) =>
          jsonRpcProvider({
            rpc: (_) => ({
              http: client_rpc,
            }),
          })).concat([
            alchemyProvider({
              // This is Alchemy's default API key.
              // You can get your own at https://dashboard.alchemyapi.io
              apiKey: "8kMhSrpLGyIlRYBtAtT9IAVWeVK8hiOZ",
            }),
            publicProvider(),
          ])
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

      setWagmiClient(wagmiClient)
      setChains(chains)
    }

    setupClient()
  }, []);

  return <>
    <link rel="stylesheet" href="https://rsms.me/inter/inter.css"></link>
    {wagmiClient ? (
      <WagmiConfig client={wagmiClient}>
        <RainbowKitProvider chains={chains}>
          <Component {...pageProps} />
        </RainbowKitProvider>
      </WagmiConfig>
    ) : (
      <>Connecting to Ethereum clients...</>
    )}
  </>
}

export default MyApp;
