import { ValidatorInfo } from '../hooks/useValidators';
import { useEffect, useState } from 'react';

import { server_config } from '../server_config';
import SetWithdrawalAddress from './SetWithdrawalAddress';
import Link from 'next/link';
import axios from 'axios';
import Spinner from './Spinner';
import { CheckIcon } from '@heroicons/react/24/outline'

interface Props {
    validators: ValidatorInfo[],
    network: "goerli" | "mainnet" | "gnosis",
    numberOfAddressesToDerive: number
}

const SetValidatorCredentialsTable = ({ validators, network, numberOfAddressesToDerive: numberOfAddressesToDerive }: Props) => {

    //currently showing the SetWithdrawalAddress widget for this validator
    const [showEdit, setShowEdit] = useState<ValidatorInfo | undefined>();

    //which validators are set, but not reflected in the validators list yet (checked with Ethdo)
    const [pendingValidators, setPendingValidators] = useState<ValidatorInfo[]>();

    const trim_pubkey = (pubkey: string) => pubkey.substring(0, 10) + "..." + pubkey.substring(pubkey.length - 10)

    const createBeaconchainUrl = (validatorPubkey: string, text?: any) => {
        const beaconChainBaseUrl = ({
            "goerli": "https://prater.beaconcha.in",
            "mainnet": "https://beaconcha.in",
            "gnosis": "https://beacon.gnosischain.com"
        })[network]
        return <Link href={beaconChainBaseUrl + "/validator/" + validatorPubkey} target="_blank" rel="noopener noreferrer">{text ? text : validatorPubkey}</Link>;
    }

    const checkPendingValidators = async () => {
        console.log("check for pending validators")
        setPendingValidators(undefined)
        const result = await Promise.all(validators.map(v => axios.get(`${server_config.monitor_url}/get_credentials/${v.index}`).then((res) => ({ v: v, data: res.data }))))
        const pending = result.filter(x => x.data.startsWith("Ethereum")).map(v => v.v)
        console.log("Pending validators", pending)
        setPendingValidators(pending)
    }

    useEffect(() => {
        if (validators) {
            checkPendingValidators()
        }
    }, [validators]);

    return (
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="mt-8 flow-root">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle">
                            <p className="mt-2 text-sm text-gray-700">
                                Your validators that need their withdrawal address set
                            </p>
                            {!validators ? <><Spinner />Loading...</> : (
                                <>
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

                                            {validators.sort((v1, v2) => v1.index - v2.index)
                                                .map((v: ValidatorInfo, index: number) => (
                                                    <>
                                                        <tr key={index}>
                                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8">
                                                                {createBeaconchainUrl(v.pubkey, v.index)}
                                                            </td>
                                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{trim_pubkey(v.pubkey)}</td>
                                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                                <div className="mx-auto flex items-center justify-center">
                                                                    {!pendingValidators && <Spinner />}
                                                                    {pendingValidators && (pendingValidators.includes(v) ?
                                                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                                                            <CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                                                                        </div>
                                                                        :
                                                                        <>
                                                                            {showEdit !== v && (
                                                                                <button
                                                                                    onClick={() => { (showEdit == v ? setShowEdit(undefined) : setShowEdit(v)) }}
                                                                                    type="button"
                                                                                    className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                                                                >
                                                                                    Set Withdrawal address
                                                                                </button>
                                                                            )}
                                                                        </>
                                                                    )
                                                                    }
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        {showEdit == v && (
                                                            <tr key={`edit_${index}`}>
                                                                <td colSpan={3}>
                                                                    <SetWithdrawalAddress validator={v} numberOfAddressesToDerive={numberOfAddressesToDerive} checkPendingValidators={checkPendingValidators} />
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </>
                                                ))}

                                        </tbody>
                                    </table>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default SetValidatorCredentialsTable;
