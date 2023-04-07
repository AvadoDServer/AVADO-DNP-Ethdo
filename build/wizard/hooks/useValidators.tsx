import useSWR from "swr";
import { server_config } from "../server_config"

const get = (api_url: string) => {
    const fetcher = async (url: string) => await fetch(url).then((res) => res.json());
    return useSWR(api_url, fetcher);
}

export type ValidatorInfo = {
    index: number,
    pubkey: string,
    status: string,
    withdrawal_credentials: string
}

export function useValidators() {
    const api_url: string = `${server_config.monitor_url}/validatorsinfo`;
    // console.log(api_url)
    const { data, error } = get(api_url)

    if (Array.isArray(data))
        return { validators: data as ValidatorInfo[], error: error };
    else
        return { validators: [], error: error };

    // console.dir("data", data)
}
