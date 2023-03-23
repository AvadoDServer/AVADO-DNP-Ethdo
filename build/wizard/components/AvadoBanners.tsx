import React from "react";

import { useWampSession } from "../hooks/useWampSession"
import { DappManagerHelper } from "../utils/DappManagerHelper";
import ExecutionEngineBanner from "./ExecutionEngineBanner";
import { server_config } from "../config";
import NetworkBanner from "./NetworkBanner";

export const packagePrefix = "ssv";
export const packageName = `${packagePrefix}.avado.dnp.dappnode.eth`;
export const packageUrl = `${packagePrefix}.my.ava.do`;
const wikilink = "https://docs.ava.do/packages/ssv"

const Comp = () => {
    const wampSession = useWampSession();
    const dappManagerHelper = React.useMemo(() => wampSession ? new DappManagerHelper(packageName, wampSession) : null, [wampSession]);

    const [packages, setPackages] = React.useState<string[]>();
    React.useEffect(() => {
        if (wampSession && dappManagerHelper) {
            dappManagerHelper.getPackages().then((packages) => {
                setPackages(packages)
            })
        }
    }, [wampSession, dappManagerHelper]);

    return (

        <div className="dashboard has-text-black maincontainer">
            <NetworkBanner network={server_config.network} />

            {!dappManagerHelper && (
                <section className="hero is-danger">
                    <div className="hero-body is-small">
                        <p className="has-text-centered">{"Avado Connection problem. Check your browser's console log for more details."}</p>
                    </div>
                </section>
            )}

            <section className="has-text-black">
                <div className="columns is-mobile">
                    <div className="column">
                        <ExecutionEngineBanner execution_engine={server_config.execution_client_name} wikilink={wikilink} 
                        installedPackages={packages} client="SSV" />
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Comp;
