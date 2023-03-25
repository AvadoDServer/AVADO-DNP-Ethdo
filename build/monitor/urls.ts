import { server_config } from "./server_config";

const network = server_config.network

const validator_url = (client: string) => {
    switch (client) {
        case "prysm": switch (network) {
            case "prater": return "eth2validator-prater.my.ava.do"
            case "mainnet": return "eth2validator.my.ava.do"
        }
        default: switch (network) {
            case "prater": return "teku-prater.my.ava.do"
            case "mainnet": return "teku.my.ava.do"
        }
    }
}

export const rest_url = (client: string) => {
    switch (client) {
        case "prysm": return `http://prysm-beacon-chain-${network}.my.ava.do:3500`
        default: return `http://${validator_url(client)}:5051`
    }
}

export const validatorAPI = (client: string) => {
    switch (client) {
        case "prysm": return "http://" + validator_url(client) + ":7500"
        case "teku": return `https://${validator_url(client)}:5052`
    }
}

export const getAvadoPackageName = (client: string, type: "beaconchain" | "validator") => {
    switch (client) {
        case "prysm": switch (type) {
            case "beaconchain": return `prysm-beacon-chain-${network}.avado.dnp.dappnode.eth`
            case "validator": return (network === "prater") ? "eth2validator-prater.avado.dnp.dappnode.eth" : "eth2validator.avado.dnp.dappnode.eth"
        }
        default /*"teku"*/: return (network === "prater") ? "teku-prater.avado.dnp.dappnode.eth" : "teku.avado.dnp.dappnode.eth"
    }
}

export const getTokenPathInContainer = (client: string) => {
    switch (client) {
        case "prysm": return "/usr/share/nginx/wizard/auth-token.txt"
        default /* "teku" */: return `/data/data-${network}/validator/key-manager/validator-api-bearer`
    }
}