import useSWR from "swr";

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
    const network = "prater"
    const api_url: string = `http://localhost:9999/validatorsinfo`;
    // console.log(api_url)
    const { data, error } = get(api_url)
    // console.dir(data)
    return { validators: data as ValidatorInfo[] , error: error };
}
