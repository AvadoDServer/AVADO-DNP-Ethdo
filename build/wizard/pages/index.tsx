import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useAccount } from 'wagmi';
import { useValidators } from '../hooks/useValidators';
import { network } from "../types";
import { useEffect, useState } from 'react';
import { utils } from 'ethers';
import axios from 'axios';

const Home: NextPage = () => {

  const { isConnected, address } = useAccount()

  const { validators, error: validators_error } = useValidators()

  const trim_pubkey = (pubkey: string) => pubkey.substring(0, 6) + "..." + pubkey.substring(pubkey.length - 6)

  const getStatusColor = (status: string) => {
    switch (status) {
      // https://ethereum.github.io/beacon-APIs/#/ValidatorRequiredApi/getStateValidator
      case "pending_initialized": return "is-info" // When the first deposit is processed, but not enough funds are available (or not yet the end of the first epoch) to get validator into the activation queue.
      case "pending_queued": return "is-info" // When validator is waiting to get activated, and have enough funds etc. while in the queue, validator activation epoch keeps changing until it gets to the front and make it through (finalization is a requirement here too).
      case "active_ongoing": return "is-success" // When validator must be attesting, and have not initiated any exit.
      case "active_exiting": return "is-warning" // When validator is still active, but filed a voluntary request to exit.
      case "active_slashed": return "is-danger"// When validator is still active, but have a slashed status and is scheduled to exit.
      case "exited_unslashed": return "is-info"// When validator has reached regular exit epoch, not being slashed, and doesn't have to attest any more, but cannot withdraw yet.
      case "exited_slashed": return "is-danger"// When validator has reached regular exit epoch, but was slashed, have to wait for a longer withdrawal period.
      case "withdrawal_possible": return "is-info"// After validator has exited, a while later is permitted to move funds, and is truly out of the system.
      case "withdrawal_done": return "is-info"// (not possible in phase0, except slashing full balance)// actually having moved funds away
      default: return ""
    }
  }

  const withdrawaladdress_tag = (withdrawal_credentials: string) => withdrawal_credentials.startsWith("0x01") ?
    <span className={"tag is-success"}>withdrawal credentials OK</span>
    : <span className={"tag is-danger"}>TODO set withdrawal address</span>

  useEffect(() => {
    if (validators)
      console.dir(validators)
  }, [validators]);

  const [mnemonic, setMnemonic] = useState<string>("");

  const [supportedAddresses, setSupportedAddresses] = useState<string[]>([]);
  const [credentialsFeedback, setCredentialsFeedback] = useState<string>("");

  useEffect(() => {
    if (mnemonic && validators?.length > 0 && utils.isValidMnemonic(mnemonic)) {
      const supported_addresses = axios.post(`http://localhost:9999/derive_addresses`, {
        mnemonic: mnemonic,
        amount: validators.length
      }
      ).then((res) => {
        console.log(res.data)
        const result = res.data
        setSupportedAddresses(result)
      });

    }
  }, [mnemonic, validators]);

  const validMnemonic = () => utils.isValidMnemonic(mnemonic)

  const cleanUpMnemonicInput = (rawMnemonic:string) => rawMnemonic.trim().split(/\s+/).join(" ")

  const filterValidatorByMnemonic = (validators: any, supported_addresses: string[]) => {
    // console.log("VA", validators)
    // console.log("SA", supported_addresses)
    return validators.filter((value: any) => supported_addresses.includes(value.pubkey));
  }

  const set_credentials = (validator: any) => {
    setCredentialsFeedback("")
    axios.post(`http://localhost:9999/set_credentials`,
      {
        validator_index: validator.index,
        mnemonic: mnemonic,
        withdrawal_address: address
      })
      .then(res => {
        console.dir(res.data)
        setCredentialsFeedback(res.data)
      })
      .catch(e => {
        setCredentialsFeedback(e.response.data)
      })
  }

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

        <div className="App">
          <section className="hero is-default is-bold">
            <div className="hero-body">
              <div className="container has-text-centered ">
                <div className="columns is-vcentered">
                  <div className="column  is-6 is-offset-1">
                    <h1 className="title is-1">Avado Convert BLS withdrawal credentials</h1>

                    <h2 className="title is-2">Your validators that need their withdrawal address set</h2>
                    {validators && (
                      <ul>
                        {validators.filter((v:any)=>v.withdrawal_credentials.startsWith("0x00")).map((v: any, index: number) =>
                          <li key={index}>
                            {v.index}, {trim_pubkey(v.pubkey)}, <span className={"tag " + getStatusColor(v.status)}>{v.status}</span>, {withdrawaladdress_tag(v.withdrawal_credentials)}
                          </li>
                        )}
                      </ul>
                    )}

                    <h2 className="title is-2">Your mnemonic</h2>
                    <div>
                      <textarea className={"textarea" + (validMnemonic() ? "" : " is-danger")} placeholder="your mnemonic" /*value={mnemonic}*/ onChange={event => setMnemonic(cleanUpMnemonicInput(event.target.value))} />
                      <label className={"label" + (validMnemonic() ? "" : " is-danger")}>{validMnemonic() ? "valid" : "incorrect"}</label>
                    </div>

                    <h2 className="title is-2">Your requested withdrawal address</h2>
                    <div className="column">
                      <ConnectButton />
                      {/* TODO: sign message : https://www.rainbowkit.com/docs/authentication */}
                    </div>

                    <h2 className="title is-2">Set validator credentials</h2>
                    <div>
                      {supportedAddresses && validators && (

                        <ul>
                          {filterValidatorByMnemonic(validators, supportedAddresses)
                            .filter((v: any) => (v.withdrawal_credentials.startsWith("0x00")))
                            .map((v: any, index: number) =>
                              <>
                                <li key={index}>
                                  {v.index}, {trim_pubkey(v.pubkey)} <button className="button" onClick={() => set_credentials(v)}>Set withdrawal_address</button>
                                </li>
                              </>
                            )}
                        </ul>
                      )}
                      {credentialsFeedback && (
                        <label className={"label"}>{JSON.stringify(credentialsFeedback)}</label>
                      )}
                    </div>

                    <h2 className="title is-2">Your validators with withdrawal address already set</h2>
                    {validators && (
                      <ul>
                        {validators.filter((v:any)=>v.withdrawal_credentials.startsWith("0x01")).map((v: any, index: number) =>
                          <li key={index}>
                            {v.index}, {trim_pubkey(v.pubkey)}, <span className={"tag " + getStatusColor(v.status)}>{v.status}</span>, {withdrawaladdress_tag(v.withdrawal_credentials)}
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
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
