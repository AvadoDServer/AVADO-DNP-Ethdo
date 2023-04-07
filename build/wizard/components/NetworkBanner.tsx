import React from "react";

const NetworkBanner = ({ network }: { network: string }) => {
    return (
        <>
            {(network === "goerli") && (
                <div className="flex items-center gap-x-6 bg-yellow-200 px-6 py-2.5 sm:px-3.5 sm:before:flex-1">
                    <p className="text-sm leading-6 text-black">
                        ⚠️ Using the {network} test network ⚠️
                    </p>
                </div>
            )}

        </>
    );
};

export default NetworkBanner


