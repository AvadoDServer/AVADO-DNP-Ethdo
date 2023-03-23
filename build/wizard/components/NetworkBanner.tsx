import React from "react";

const NetworkBanner = ({ network }: { network: string }) => {
    return (
        <>
            {(network === "goerli") && (
                <section className="hero is-warning">
                    <div className="hero-body is-small">
                        <p className="has-text-centered">Using the {network} test network</p>
                    </div>
                </section>
            )}
        </>
    );
};

export default NetworkBanner


