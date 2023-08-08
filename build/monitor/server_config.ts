import { readFileSync } from "fs";

const localdev = false;

export const server_config = {
    eth_do_path: localdev ? "/Users/heeckhau/git/avado-daps/AVADO-DNP-Ethdo/build/monitor/ethdo" : "/app/ethdo",
    network: localdev ? "goerli" : process.env.NETWORK ?? "goerli", // either "goerli", "mainnet" or gnosis
    name: "ethdo",
    https_options: localdev ? {} : {
        key: readFileSync('/etc/nginx/my.ava.do.key'),
        certificate: readFileSync('/etc/nginx/my.ava.do.crt')
    }
}