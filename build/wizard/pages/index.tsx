import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useAccount } from 'wagmi';
import { useValidators } from '../hooks/useValidators';
import { network } from "../types";
import { useEffect } from 'react';

const Home: NextPage = () => {

  const { isConnected, address } = useAccount()

  const { data: data } = useValidators()

  const trim_pubkey = (pubkey: string) => pubkey.substring(0, 6) + "..." + pubkey.substring(pubkey.length - 6)

  const getStatusColor = (status: string) => {
    switch (status) {
      // https://ethereum.github.io/beacon-APIs/#/ValidatorRequiredApi/getStateValidator
      case "pending_initialized": return "is-info" // When the first deposit is processed, but not enough funds are available (or not yet the end of the first epoch) to get validator into the activation queue.
      case "pending_queued": return "is-info" // When validator is waiting to get activated, and have enough funds etc. while in the queue, validator activation epoch keeps changing until it gets to the front and make it through (finalization is a requirement here too).
      case "active_ongoing": return "is-success" // When validator must be attesting, and have not initiated any exit.
      case "active_exiting": return "is-warning" // When validator is still active, but filed a voluntary request to exit.
      case "active_slashed": return "is-danger"// When validator is still active, but have a slashed status and is scheduled to exit.
      case "exited_unslashed": return "is-info"// When validator has reached reguler exit epoch, not being slashed, and doesn't have to attest any more, but cannot withdraw yet.
      case "exited_slashed": return "is-danger"// When validator has reached reguler exit epoch, but was slashed, have to wait for a longer withdrawal period.
      case "withdrawal_possible": return "is-info"// After validator has exited, a while later is permitted to move funds, and is truly out of the system.
      case "withdrawal_done": return "is-info"// (not possible in phase0, except slashing full balance)// actually having moved funds away
      default: return ""
    }
  }

  const withdrawaladdress_tag = (withdrawal_credentials: string) => withdrawal_credentials.startsWith("0x01") ?
    <span className={"tag is-success"}>withdrawal credentials OK</span>
    : <span className={"tag is-danger"}>TODO set withdrawal address</span>

  useEffect(() => {
    if (data)
      console.dir(data[0].index)
  }, [data]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Avado SSV</title>
        <meta
          name="Avado Convert BLS withdrawal credentials"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>

        <h1 className="title is-1">Avado Convert BLS withdrawal credentials</h1>

        {data && (
          <ul>
            {data.map((v: any, index: number) =>
              <li key={index}>
                {v.index}, {trim_pubkey(v.pubkey)}, <span className={"tag " + getStatusColor(v.status)}>{v.status}</span>, {withdrawaladdress_tag(v.withdrawal_credentials)}
              </li>
            )}
          </ul>
        )}

      </main>

      <footer className={styles.footer}>
        <a href="http://my.ava.do/#/Packages/ethdo.avado.dappnode.eth/detail">Logs</a>
        <br />
        <a href="https://ava.do" target="_blank" rel="noopener noreferrer">
          Made with ❤️ by your frens at Avado
        </a>
      </footer>
    </div>
  );
};

export default Home;
