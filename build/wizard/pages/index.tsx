import { useEffect, useState } from 'react'
import type { NextPage } from 'next';
import {
    PlayIcon,
    AdjustmentsHorizontalIcon,
    ServerIcon,
} from '@heroicons/react/20/solid'
import axios from "axios";
import { server_config } from '../server_config';
import { ValidatorInfo, useValidators } from '../hooks/useValidators';
import ValidatorsTags from '../components/validatorsTags';
import SetValidatorCredentialsTable from '../components/SetValidatorCredentialsTable';
import Spinner from '../components/Spinner';
import NetworkBanner from '../components/NetworkBanner';

const Home: NextPage = () => {

    const [ecClient, setEcClient] = useState<string>();
    const [bcClient, setBcClient] = useState<string>();
    const [network, setNetwork] = useState<"goerli" | "mainnet" | "gnosis">();

    const { validators, error: validators_error } = useValidators()

    const title = "Avado: Set withdrawal credentials (Shapella update)"

    useEffect(() => {
        axios.get(`${server_config.monitor_url}/clients`)
            .then((res) => {
                setBcClient(res.data[0])
            });
        axios.get(`${server_config.monitor_url}/executionclients`)
            .then((res) => {
                setEcClient(res.data[0].name)
            });
        axios.get(`${server_config.monitor_url}/network`)
            .then((res) => {
                setNetwork(res.data)
            });
    }, []);

    return (
        <div className="py-10 bg-white">
            <header>
                {network && <NetworkBanner network={network} />}
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* https://tailwindui.com/components/application-ui/headings/page-headings */}
                    <div className="lg:flex lg:items-center lg:justify-between">
                        <div className="min-w-0 flex-1">
                            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                                {title}
                            </h1>
                            <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
                                <div className="mt-2 flex items-center text-sm text-gray-500">
                                    <ServerIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                                    {network}: {ecClient},{bcClient}
                                </div>
                                <div className="mt-2 flex items-center text-sm text-gray-500">
                                    <PlayIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                                    {validators ? validators.length : "Loading..."} validators
                                </div>

                                <div className="mt-2 flex items-center text-sm text-gray-500">
                                    <AdjustmentsHorizontalIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                                    <a href="http://my.ava.do/#/Packages/ethdo.avado.dappnode.eth/detail" className="text-sm leading-6 text-gray-600 hover:text-gray-900">
                                        Logs
                                    </a>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 flex lg:ml-4 lg:mt-0">
                            {/* <span className="hidden sm:block">
                    <button
                        type="button"
                        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                        <PencilIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                        Edit
                    </button>
                </span>

                <span className="ml-3 hidden sm:block">
                    <button
                        type="button"
                        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                        <LinkIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                        View
                    </button>
                </span>

                <span className="sm:ml-3">
                    <button
                        type="button"
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        <CheckIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                        Publish
                    </button>
                </span>

                <Menu as="div" className="relative ml-3 sm:hidden">
                    <Menu.Button className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:ring-gray-400">
                        More
                        <ChevronDownIcon className="-mr-1 ml-1.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                    </Menu.Button>

                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <Menu.Items className="absolute right-0 z-10 -mr-1 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <Menu.Item>
                                {({ active }) => (
                                    <a
                                        href="#"
                                        className={[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700'].join(' ')}
                                    >
                                        Edit
                                    </a>
                                )}
                            </Menu.Item>
                            <Menu.Item>
                                {({ active }) => (
                                    <a
                                        href="#"
                                        className={[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700'].join(' ')}
                                    >
                                        View
                                    </a>
                                )}
                            </Menu.Item>
                        </Menu.Items>
                    </Transition>
                </Menu> */}
                        </div>
                    </div>
                </div>
            </header>
            <main className="bg-white">
                {!(validators && network) && (
                    <>
                        <Spinner />Loading your validators...
                    </>
                )}
                {validators && network && (
                    <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <div className="lg:flex lg:items-center lg:justify-between">
                            <div className="min-w-0 flex-1">
                                <SetValidatorCredentialsTable network={network} validators={validators.filter((v: ValidatorInfo) => v.withdrawal_credentials.startsWith("0x00"))} numberOfAddressesToDerive={validators.length} />
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <footer className="bg-white">
                <div className="mx-auto max-w-7xl overflow-hidden px-6 py-20 sm:py-24 lg:px-8">
                    {validators && network && (
                        <ValidatorsTags network={network} validators={validators} />
                    )}
                    <p className="mt-10 text-center text-xs leading-5 text-gray-500">
                        <a href="https://ava.do" target="_blank" rel="noopener noreferrer">
                            &copy; Made with ❤️ by your frens at Avado
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    )
}

export default Home;
