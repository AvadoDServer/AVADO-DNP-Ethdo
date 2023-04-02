import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { ValidatorInfo, useValidators } from '../hooks/useValidators';
import { useEffect, useState } from 'react';

import { server_config } from '../server_config';
import { CheckIcon } from '@heroicons/react/24/solid'
import Example from '../components/Example';
import SetWithdrawalAddress from '../components/SetWithdrawalAddress';
import Link from 'next/link';

const Home: NextPage = () => {

    const { validators, error: validators_error } = useValidators()

    const [showEdit, setShowEdit] = useState<ValidatorInfo | undefined>();

    const trim_pubkey = (pubkey: string) => pubkey.substring(0, 10) + "..." + pubkey.substring(pubkey.length - 10)

    const createBeaconchainUrl = (validatorPubkey: string, text?: any) => {
        const beaconChainBaseUrl = ({
            "goerli": "https://prater.beaconcha.in",
            "mainnet": "https://beaconcha.in",
            "gnosis": "https://beacon.gnosischain.com"
        })[server_config.network ?? "mainnet"]
        return <Link href={beaconChainBaseUrl + "/validator/" + validatorPubkey} target="_blank" rel="noopener noreferrer">{text ? text : validatorPubkey}</Link>;
    }

    const withdrawaladdress_tag = (validatorInfo: ValidatorInfo) => {
        // console.log(validatorInfo)
        const ready = validatorInfo.withdrawal_credentials.startsWith("0x01")
        const className = ready ? "bg-green-200 text-green-700" : "bg-yellow-200 text-yellow-700"
        const tag = <div className={`ml-4 text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 ${className} rounded-full`}>
            {(ready ? "✅" : "")}{validatorInfo.index}
        </div>
        return createBeaconchainUrl(validatorInfo.pubkey, tag)
    }

    // useEffect(() => {
    //   if (validators)
    //     console.dir(validators)
    // }, [validators]);



    const validatorsList = () => {
        return (
            <>
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="sm:flex sm:items-center">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="sm:flex-auto">
                                <h1 className="text-base font-semibold leading-6 text-gray-900">Your Validators</h1>
                                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                                    {validators && (
                                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                                            {validators.sort((v1, v2) => v1.index - v2.index).map((v, index) => withdrawaladdress_tag(v))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 flow-root">
                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="inline-block min-w-full py-2 align-middle">
                                <p className="mt-2 text-sm text-gray-700">
                                    Your validators that need their withdrawal address set
                                </p>
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead>
                                        <tr>
                                            <th
                                                scope="col"
                                                className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 lg:pl-8"
                                            >
                                                Index
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                Pubkey
                                            </th>
                                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-3">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {validators
                                            .filter((v: ValidatorInfo) => v.withdrawal_credentials.startsWith("0x00"))
                                            .map((v: ValidatorInfo, index: number) => (
                                                <>
                                                    <tr key={index}>
                                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8">
                                                            {createBeaconchainUrl(v.pubkey, v.index)}
                                                        </td>
                                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{trim_pubkey(v.pubkey)}</td>
                                                        {showEdit !== v && (
                                                            <button
                                                                onClick={() => { (showEdit == v ? setShowEdit(undefined) : setShowEdit(v)) }}
                                                                type="button"
                                                                className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                                            >
                                                                Set Withdrawal address
                                                            </button>
                                                        )}
                                                    </tr>
                                                    {showEdit == v && (
                                                        <tr>
                                                            <td colSpan={3}>
                                                                <SetWithdrawalAddress validator={v} amount={validators.length} />
                                                            </td>
                                                        </tr>

                                                    )}
                                                </>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </>

        )
    }




    return (
        <div className={styles.container}>
            <Head>
                <title>Avado BLS</title>
                <meta
                    name="Avado Convert BLS withdrawal credentials"
                />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className={styles.main}>

                <div className="App">

                    {validators && (
                        <>
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                <CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                            </div>
                            {validatorsList()}
                        </>
                    )}

                    {/* 
                    <h2 className="title is-4">Your validators that need their withdrawal address set</h2>
                    {validators && (
                        <ul>
                            {validators.filter((v: any) => v.withdrawal_credentials.startsWith("0x00")).map((v: any, index: number) =>
                                <li key={index}>
                                    {v.index}, {trim_pubkey(v.pubkey)}, <span className={"tag " + getStatusColor(v.status)}>{v.status}</span>
                                </li>
                            )}
                        </ul>
                    )} */}


                    <br />
                    <hr />

                    {/* 
                    <h2 className="title is-4">Set validator credentials</h2>
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
                    </div> */}
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
