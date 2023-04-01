import { Dialog, Transition } from '@headlessui/react'
import { CheckIcon } from '@heroicons/react/24/outline'
import { ValidatorInfo } from '../hooks/useValidators'
import { useEffect, useState } from 'react';
import { utils } from 'ethers';
import axios from 'axios';
import { server_config } from '../server_config';
import { Address } from 'wagmi';

const SetWithdrawalAddress = ({ validator, address, amount }: { validator: ValidatorInfo, address: Address | undefined, amount: number }) => {
  const [open, setOpen] = useState(true)
  
    const [viewState, setViewState] = useState<number>(1);
    const [loadingMatchingValidators, setLoadingMatchingValidators] = useState(false);
    const [mnemonic, setMnemonic] = useState<string>("");

    const [supportedAddresses, setSupportedAddresses] = useState<string[]>([]);
    const [credentialsFeedback, setCredentialsFeedback] = useState<string>("");

    const validMnemonic = () => utils.isValidMnemonic(mnemonic)

    const cleanUpMnemonicInput = (rawMnemonic: string) => rawMnemonic.trim().split(/\s+/).join(" ")

    const filterValidatorByMnemonic = (validators: any, supported_addresses: string[]) => {
      // console.log("VA", validators)
      // console.log("SA", supported_addresses)
      return validators.filter((value: any) => supported_addresses.includes(value.pubkey));
    }

    const set_credentials = (validator: ValidatorInfo) => {
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

    useEffect(() => {
      if (mnemonic && utils.isValidMnemonic(mnemonic)) {
        setLoadingMatchingValidators(true);
        const supported_addresses = axios.post(`${server_config.monitor_url}/derive_addresses`, {
          mnemonic: mnemonic,
          amount: amount
        }
        ).then((res) => {
          setViewState(2);
          // console.log(res.data)
          const result = res.data
          setSupportedAddresses(result)
        });

      }
    }, [mnemonic]);


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
          <div>Your selected withdrawal address is <b>{address}</b>. (<div onClick={() => { /*TODO*/ }}>change</div>)</div>
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

    return (<>
      {
        steps()
      }

      {
        steps_actions()
      }
    </>

    )

  }


export default SetWithdrawalAddress;
