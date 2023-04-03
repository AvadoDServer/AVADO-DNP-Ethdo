import { ValidatorInfo } from '../hooks/useValidators';

import { server_config } from '../server_config';
import Link from 'next/link';

const ValidatorsTags = ({ validators }: { validators: ValidatorInfo[] }) => {

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
        return (
            <div key={validatorInfo.index} className={`ml-4 text-xs inline-flex items-center font-bold leading-sm uppercase px-3 py-1 ${className} rounded-full`}>
                {createBeaconchainUrl(validatorInfo.pubkey, `${(ready ? "✅" : "")}${validatorInfo.index}`)}
            </div>
        )
    }

    return (
        <>
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="sm:flex sm:items-center">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="sm:flex-auto">
                            <p className="text-base font-semibold leading-6 text-gray-900 text-center">Validators Overview </p>
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
            </div>
        </>
    )
};

export default ValidatorsTags;
