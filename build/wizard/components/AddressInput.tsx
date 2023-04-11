import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

interface Props {
    onFinish: () => void
    setWithdrawalAddress: any
}

const AddressInput = ({ onFinish, setWithdrawalAddress }: Props) => {
    const { isConnected, address } = useAccount();

    const finish = () => {
        setWithdrawalAddress(address)
        onFinish()
    }

    return (<>
        <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
            <div className="px-4 py-5 sm:px-6">
                Please enter the desired withdrawal address (= an Ethereum address that you own)
                <ConnectButton showBalance={false} />
                {/* TODO: sign message : https://www.rainbowkit.com/docs/authentication */}
            </div>
        </div >

        <button
            onClick={finish}
            type="button"
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            disabled={!isConnected}
        >
            Continue
        </button>
    </>)
}

export default AddressInput;
