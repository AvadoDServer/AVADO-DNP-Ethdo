import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { useAccount } from 'wagmi';
import { ValidatorInfo, useValidators } from '../hooks/useValidators';
import { useEffect, useState } from 'react';
import { utils } from 'ethers';
import axios from 'axios';
import { server_config } from '../server_config';
import { CheckIcon } from '@heroicons/react/24/solid'

const Home: NextPage = () => {

    const { isConnected, address } = useAccount();
    const [viewState, setViewState] = useState<Number>(0);
    const [loadingMatchingValidators, setLoadingMatchingValidators] = useState(false);
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

    const createBeaconchainUrl = (validatorPubkey: string, text?: any) => {
        const beaconChainBaseUrl = ({
            "goerli": "https://prater.beaconcha.in",
            "mainnet": "https://beaconcha.in",
            "gnosis": "https://beacon.gnosischain.com"
        })[server_config.network ?? "mainnet"]
        return <a href={beaconChainBaseUrl + "/validator/" + validatorPubkey} target="_blank" rel="noopener noreferrer">{text ? text : validatorPubkey}</a>;
    }

    const withdrawaladdress_tag = (validatorInfo: ValidatorInfo) => {
        // console.log(validatorInfo)
        const tag = <span className={"tag " + (validatorInfo.withdrawal_credentials.startsWith("0x01") ? "is-success" : "is-warning")}>{validatorInfo.index}</span>
        return createBeaconchainUrl(validatorInfo.pubkey, tag)
    }

    // useEffect(() => {
    //   if (validators)
    //     console.dir(validators)
    // }, [validators]);

    const [mnemonic, setMnemonic] = useState<string>("");

    const [supportedAddresses, setSupportedAddresses] = useState<string[]>([]);
    const [credentialsFeedback, setCredentialsFeedback] = useState<string>("");

    useEffect(() => {
        if (mnemonic && validators?.length > 0 && utils.isValidMnemonic(mnemonic)) {
            setLoadingMatchingValidators(true);
            const supported_addresses = axios.post(`${server_config.monitor_url}/derive_addresses`, {
                mnemonic: mnemonic,
                amount: validators.length
            }
            ).then((res) => {
                setViewState(2);
                // console.log(res.data)
                const result = res.data
                setSupportedAddresses(result)
            });

        }
    }, [mnemonic, validators]);

    const validMnemonic = () => utils.isValidMnemonic(mnemonic)

    const cleanUpMnemonicInput = (rawMnemonic: string) => rawMnemonic.trim().split(/\s+/).join(" ")

    const filterValidatorByMnemonic = (validators: any, supported_addresses: string[]) => {
        // console.log("VA", validators)
        // console.log("SA", supported_addresses)
        return validators.filter((value: any) => supported_addresses.includes(value.pubkey));
    }

    const set_credentials = (validator: any) => {
        setCredentialsFeedback("")
        axios.post(`${server_config.monitor_url}/set_credentials`,
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

    const validatorsList = () => {
        return (
            <>
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="sm:flex sm:items-center">
                        <div className="sm:flex-auto">
                            <h1 className="text-base font-semibold leading-6 text-gray-900">Your Validators</h1>
                            <p className="mt-2 text-sm text-gray-700">
                                Your validators that need their withdrawal address set
                            </p>
                        </div>
                        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">

                        </div>
                    </div>
                    <div className="mt-8 flow-root">
                        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="inline-block min-w-full py-2 align-middle">
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
                                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                status
                                            </th>
                                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 lg:pr-8">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {validators
                                            .filter((v: any) => v.withdrawal_credentials.startsWith("0x00"))
                                            .map((v: any, index: number) => (
                                                <tr key={index}>
                                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8">
                                                        {v.index}
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{trim_pubkey(v.pubkey)}</td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{v.status}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => { setViewState(1); }}
                    type="button"
                    className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    Set Withdrawal address
                </button>
            </>

        )
    }

    // steps menu - rendered based on the viewState
    const steps = () => {

        if (viewState === 0) {
            return null;
        }

        const steps = [
            { id: 1, name: 'Mnemonic', href: '#' },
            { id: 2, name: 'Set withdrawal address', href: '#' },
            { id: 3, name: 'Confirm', href: '#' },
        ]

        return (
            <nav aria-label="Progress">
                <ol role="list" className="divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0">
                    {steps.map((step, stepIdx) => (
                        <li key={step.name} className="relative md:flex md:flex-1">
                            {step.id < viewState ? (
                                <a href={step.href} className="group flex w-full items-center">
                                    <span className="flex items-center px-6 py-4 text-sm font-medium">
                                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 group-hover:bg-indigo-800">
                                            <CheckIcon className="h-6 w-6 text-white" aria-hidden="true" />
                                        </span>
                                        <span className="ml-4 text-sm font-medium text-gray-900">{step.name}</span>
                                    </span>
                                </a>
                            ) : step.id === viewState ? (
                                <a href={step.href} className="flex items-center px-6 py-4 text-sm font-medium" aria-current="step">
                                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-indigo-600">
                                        <span className="text-indigo-600">{step.id}</span>
                                    </span>
                                    <span className="ml-4 text-sm font-medium text-indigo-600">{step.name}</span>
                                </a>
                            ) : (
                                <a href={step.href} className="group flex items-center">
                                    <span className="flex items-center px-6 py-4 text-sm font-medium">
                                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
                                            <span className="text-gray-500 group-hover:text-gray-900">{step.id}</span>
                                        </span>
                                        <span className="ml-4 text-sm font-medium text-gray-500 group-hover:text-gray-900">{step.name}</span>
                                    </span>
                                </a>
                            )}

                            {stepIdx !== steps.length - 1 ? (
                                <>
                                    {/* Arrow separator for lg screens and up */}
                                    <div className="absolute right-0 top-0 hidden h-full w-5 md:block" aria-hidden="true">
                                        <svg
                                            className="h-full w-full text-gray-300"
                                            viewBox="0 0 22 80"
                                            fill="none"
                                            preserveAspectRatio="none"
                                        >
                                            <path
                                                d="M0 -2L20 40L0 82"
                                                vectorEffect="non-scaling-stroke"
                                                stroke="currentcolor"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </div>
                                </>
                            ) : null}
                        </li>
                    ))}
                </ol>
            </nav>
        )
    }

    const mnemonicInput = () => {
        if (loadingMatchingValidators) {
            return ("Loading");
        }
        return (
            <>
                <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
                    <div className="px-4 py-5 sm:px-6">
                        Please enter the mnemonic for these validators
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                        <textarea
                            placeholder="paste your 24 word mnemonic phrase here" /*value={mnemonic}*/ onChange={event => setMnemonic(cleanUpMnemonicInput(event.target.value))}
                            className="block w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:py-1.5 sm:text-sm sm:leading-6"
                        />
                    </div>
                    <div className="px-4 py-4 sm:px-6">
                        {mnemonic !== "" && (
                            <label className={"label" + (validMnemonic() ? "" : " is-danger")}>{validMnemonic() ? "valid" : "incorrect mnemonic"}</label>
                        )}
                    </div>
                </div>
            </>
        )
    }

    const addressInput = () => {
        if (address) {
            return (<>
                <div>Your selected withdrawal address is <b>{address}</b>. (<div onClick={() => { setAdd }}>change</div>)</div>
                <button
                    onClick={() => { setViewState(3); }}
                    type="button"
                    className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                    Continue
                </button>

            </>);
        }
        return (
            <>
                <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
                    <div className="px-4 py-5 sm:px-6">
                        Please enter the desired withdrawal address (= an Ethereum address that you own)
                    </div>

                    OR ENTER MANUALLY = BUT IT's A BAD IDEA
                    <textarea
                        placeholder="Your Ethereum address" /*value={mnemonic}*/ onChange={event => setMnemonic(cleanUpMnemonicInput(event.target.value))}
                        className="block w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:py-1.5 sm:text-sm sm:leading-6"
                    />

                </div >
            </>
        )
    }


    const steps_actions = () => {
        switch (viewState) {
            case 1:
                return (mnemonicInput());
            case 2:
                return (addressInput());
        }
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

                    viewstate={viewState}
                    {
                        steps()}
                    {
                        steps_actions()
                    }

                    <br />
                    <hr />


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
                    </div>
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
