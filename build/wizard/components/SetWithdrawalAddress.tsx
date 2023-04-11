import { CheckIcon } from '@heroicons/react/24/outline'
import { ValidatorInfo } from '../hooks/useValidators'
import { useEffect, useState } from 'react';
import { utils } from 'ethers';
import axios from 'axios';
import { server_config } from '../server_config';
import Spinner from './Spinner';
import AddressInput from './AddressInput';

interface Props {
  validator: ValidatorInfo,
  numberOfAddressesToDerive: number,
  checkPendingValidators: () => Promise<void>
}

const SetWithdrawalAddress = ({ validator, numberOfAddressesToDerive: numberOfAddressesToDerive, checkPendingValidators }: Props) => {
  const [viewState, setViewState] = useState<number>(1);
  const [loadingMatchingValidators, setLoadingMatchingValidators] = useState(false);
  const [mnemonic, setMnemonic] = useState<string>("");
  const [supportedAddresses, setSupportedAddresses] = useState<string[]>([]);
  const [withdrawalAddress, setWithdrawalAddress] = useState<string>("");



  const [settingCredentials, setSettingCredentials] = useState<boolean>(false);
  const [credentialsFeedback, setCredentialsFeedback] = useState<{ error: boolean, message?: string }>({ error: false });

  const validMnemonic = () => utils.isValidMnemonic(mnemonic)

  const cleanUpMnemonicInput = (rawMnemonic: string) => rawMnemonic.trim().split(/\s+/).join(" ")

  const set_credentials = () => {
    setCredentialsFeedback({ error: false })
    setSettingCredentials(true)
    setViewState(4)

    const waitAndCheckPendingValidators = async () => {
      // wait 5 seconds and update the pending validators
      await setTimeout(checkPendingValidators, 5000);
    }
    axios.post(`${server_config.monitor_url}/set_credentials`,
      {
        validator_index: validator.index,
        mnemonic: mnemonic,
        withdrawal_address: address
      })
      .then(res => {
        console.dir(res.data)
        setCredentialsFeedback({ error: false, message: res.data || "Credentials set" })
        setSettingCredentials(false)
        waitAndCheckPendingValidators()
      })
      .catch(e => {
        console.log("Error setting credentials", e)
        const message = e.response.data || "Setting credentials failed"
        setCredentialsFeedback({ error: true, message })
        setSettingCredentials(false)
      })
  }

  useEffect(() => {
    if (mnemonic && utils.isValidMnemonic(mnemonic)) {
      setLoadingMatchingValidators(true);
      axios.post(`${server_config.monitor_url}/derive_addresses`, {
        mnemonic: mnemonic,
        amount: numberOfAddressesToDerive
      }
      ).then((res) => {
        // console.log("derived validators", res.data)
        const result = res.data
        setSupportedAddresses(result)
        setLoadingMatchingValidators(false);
        if (result.includes(validator.pubkey) && viewState == 1)
          setViewState(2)
      });

    }
  }, [mnemonic]);

  // steps menu - rendered based on the viewState
  const progressStepsBar = () => {
    if (viewState === 0 || viewState === 4) {
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
                <a href={step.href} className="group flex w-full items-center" onClick={() => setViewState(step.id)}>
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

  const mnemonicInput = () => (
    <>
      <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
        <label htmlFor="mnemonic" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Please enter the mnemonic for validator {validator.index} ({validator.pubkey})</label>
        <textarea id="mnemonic" rows={4}
          className={`block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-2 focus:ring-inset ${validMnemonic() ? "ring-gray-300" : "ring-red-700"}`}
          onChange={event => setMnemonic(cleanUpMnemonicInput(event.target.value))}
          readOnly={loadingMatchingValidators}
          placeholder="paste your 24 word mnemonic phrase here" />
        {mnemonic !== "" && !validMnemonic() && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-500">Invalid mnemonic</p>
        )}
        {mnemonic !== "" && !loadingMatchingValidators && supportedAddresses && !supportedAddresses.includes(validator.pubkey) && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-500">
            This mnemonic does not match this validator
          </p>
        )}
        {loadingMatchingValidators && (
          <div className="animate-pulse flex space-x-4">
            <><Spinner />Checking mnemonic...</>
          </div>
        )}
      </div>
    </>
  )

  const confirm = () => (<>
    <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
      <div className="px-4 py-5 sm:px-6 space-y-4">
        <div role="alert">
          <div className="bg-red-500 text-white font-bold rounded-t px-4 py-2">
            ☠️ Please check the address three times because you can only set the withdrawal address once ☠️ 
          </div>
          <div className="border border-t-0 border-red-400 rounded-b bg-red-100 px-4 py-3 text-red-700">
          <strong>This is final. You can NOT change this afterwards. So if you lose access to the private key of this address, the deposit and rewards of this validator are lost forever</strong>
          </div>
        </div>

        <div>Are you sure you want to set the withdrawal address of Validator {validator.index} (<code>{validator.pubkey}</code>) to <code>{withdrawalAddress}</code>?</div>

        <div>⏳ Note that it may take a while for the chain to pick up your withdrawal address configuration. ⏳</div>

        <button
          onClick={set_credentials}
          type="button"
          className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Confirm withdrawal address
        </button>
      </div>
    </div>
  </>)

  return (<>
    {progressStepsBar()}
    {viewState == 1 && mnemonicInput()}
    {viewState == 2 && (<AddressInput onFinish={() => setViewState(3)} setWithdrawalAddress={setWithdrawalAddress} />)}
    {viewState == 3 && confirm()}
    {viewState == 4 && (
      <div>
        {settingCredentials && (
          <div className="animate-pulse flex space-x-4">
            <><Spinner />Setting credentials...</>
          </div>)}
        {!settingCredentials && credentialsFeedback.message && (
          <p className={`mt-2 text-sm ${credentialsFeedback.error ? "text-red-600" : "text-green-700"}`}>
            {credentialsFeedback.message}
          </p>
        )}
      </div>
    )}

  </>

  )

}


export default SetWithdrawalAddress;
