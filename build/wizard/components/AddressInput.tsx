import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useEnsAddress, useEnsResolver } from 'wagmi';
import { Switch } from '@headlessui/react'
import { useEffect, useState } from 'react';
import { faUtensilSpoon } from '@fortawesome/free-solid-svg-icons';
import { utils } from "ethers"

interface Props {
    onFinish: () => void
    setWithdrawalAddress: any
}

const AddressInput = ({ onFinish, setWithdrawalAddress }: Props) => {
    const { isConnected, address } = useAccount();
    const [manualInput, setManualInput] = useState<boolean>(false)
    const [manualAddressInput, setManualAddressInput] = useState<string>("0x")
    const [manualAddressFeedback, setManualAddressFeedback] = useState<string>()

    function classNames(...classes: string[]) {
        return classes.filter(Boolean).join(' ')
    }

    const finish = () => {
        if (manualAddressInput) {
            if (!isEnsName() && utils.isAddress(manualAddressInput)) {
                setWithdrawalAddress(manualAddressInput)
            }
            else {
                setWithdrawalAddress(data)
            }
        } else {
            setWithdrawalAddress(address)
        }
        onFinish()
    }

    const canAdvance = () => {
        if (manualInput) {
            if (!isEnsName())
                return utils.isAddress(manualAddressInput)
            else
                return utils.isAddress(data ?? "")
        } else {
            return isConnected
        }
    }

    const isEnsName = () => manualAddressInput.endsWith(".eth")

    const { data, error, isLoading, refetch } = useEnsAddress({
        name: manualAddressInput,
        enabled: isEnsName(),
    })


    const walletInput = <ConnectButton showBalance={false} />

    useEffect(() => {
        if (error) {
            setManualAddressFeedback(error.message)
        } else if (manualAddressInput && utils.isAddress(manualAddressInput)) {
            setManualAddressFeedback(undefined)
        } else if (isEnsName() && utils.isAddress(data ?? "")) {
            setManualAddressFeedback(data ?? undefined)
        } else {
            setManualAddressFeedback("Invalid Ethereum address")
        }
    }, [manualAddressInput, data, error]);

    const manual = (
        <>
            <div className="sm:col-span-4">
                <label className="block text-sm font-medium leading-6 text-gray-900">
                    Enter address (and tripple check!)
                </label>
                <div className="mt-2">
                    <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                        <input
                            type="text"
                            className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                            onChange={(e) => { setManualAddressInput(e.target.value) }}
                        />
                    </div>
                </div>
                {manualAddressInput && (
                    <p className="text-red-700">{manualAddressFeedback}</p>
                )}

            </div>
        </>
    )

    const toggleButton = <Switch.Group as="div" className="flex items-center">
        <Switch
            checked={manualInput}
            onChange={setManualInput}
            className={classNames(
                manualInput ? 'bg-indigo-600' : 'bg-gray-200',
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2'
            )}
        >
            <span
                aria-hidden="true"
                className={classNames(
                    manualInput ? 'translate-x-5' : 'translate-x-0',
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                )} />
        </Switch>
        <Switch.Label as="span" className="ml-3 text-sm">
            <span className="font-medium text-gray-900">Manual input</span>{' '}
            <span className="text-gray-500">(Discouraged)</span>
        </Switch.Label>
    </Switch.Group>;
    return (<>
        <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
            <div className="px-4 py-5 sm:px-6 space-y-4">
                <div>
                    Please enter the desired withdrawal address (= an Ethereum address that you own)
                </div>

                {manualInput ? manual : walletInput}

                {toggleButton}

            </div>
        </div >

        <button
            onClick={finish}
            type="button"
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            disabled={!canAdvance()}
        >
            Continue
        </button>
    </>)
}

export default AddressInput;
