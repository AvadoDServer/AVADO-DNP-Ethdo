import useSWR from "swr";
import axios from "axios";
import { network } from "../types";
import { server_config } from "../config"
import { networkInterfaces } from "os";

const get = (api_url: string) => {
    const fetcher = async (url: string) => await fetch(url).then((res) => res.json());
    return useSWR(api_url, fetcher);
}

export function useValidators(
//     {
//     network
// }: {
//     network: network
// }
) {
    const network = "prater"
    const api_url: string = `http://localhost:9999/prysm/${network}/validatorsinfo`;
    // console.log(api_url)
    const { data, error } = get(api_url)
    // console.dir(data)
    return { data: data, error: error };
}
