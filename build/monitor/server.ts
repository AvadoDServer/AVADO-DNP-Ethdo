import * as restify from "restify";
import corsMiddleware from "restify-cors-middleware2"
import axios, { Method, AxiosRequestHeaders } from "axios";
import { SupervisorCtl } from "./SupervisorCtl";
import { server_config } from "./server_config";
import { assert } from "console";
import { execSync } from "child_process"
import { rest_url, rest_url_ip, validatorAPI, getAvadoPackageName, getTokenPathInContainer, getAvadoExecutionClientPackageName, validator_url } from "./urls";
import { DappManagerHelper } from "./DappManagerHelper";
import { readFileSync } from "fs";
const autobahn = require('autobahn');

const supported_beacon_chain_clients = ["prysm", "teku"];
const supported_execution_clients = ["geth", "nethermind"];

console.log("Monitor starting...");

const https_options = server_config.dev ? {} : {
    key: readFileSync('/etc/nginx/my.ava.do.key'),
    certificate: readFileSync('/etc/nginx/my.ava.do.crt')
};

const server = restify.createServer({
    ...https_options,
    name: "MONITOR",
    version: "1.0.0"
});

const cors = corsMiddleware({
    preflightMaxAge: 5, //Optional
    origins: [
        /^http:\/\/localhost(:[\d]+)?$/,
        "http://*.my.ava.do"
    ]
});

server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.plugins.bodyParser());

const ethdo = server_config.eth_do_path

server.get("/ping", (req: restify.Request, res: restify.Response, next: restify.Next) => {
    res.send(200, "pong");
    next()
});

server.get("/network", (req: restify.Request, res: restify.Response, next: restify.Next) => {
    res.send(200, server_config.network);
    next()
});

server.get("/name", (req: restify.Request, res: restify.Response, next: restify.Next) => {
    res.send(200, server_config.name);
    next()
});

const supervisorCtl = new SupervisorCtl(`localhost`, 5555, '/RPC2') || null;

const restart = async () => {
    await Promise.all([
        supervisorCtl.callMethod('supervisor.stopProcess', ["nimbus", true]),
    ])
    return Promise.all([
        supervisorCtl.callMethod('supervisor.startProcess', ["nimbus", true]),
    ])
}

server.post("/service/restart", (req: restify.Request, res: restify.Response, next: restify.Next) => {
    restart().then((result) => {
        res.send(200, "restarted");
        return next()
    }).catch((error) => {
        res.send(500, "failed")
        return next();
    })
});

server.post("/service/stop", (req: restify.Request, res: restify.Response, next: restify.Next) => {
    const method = 'supervisor.stopProcess'
    Promise.all([
        supervisorCtl.callMethod(method, ["nimbus"]),
    ]).then(result => {
        res.send(200, "stopped");
        next()
    }).catch(err => {
        res.send(200, "failed")
        next();
    })
});

server.post("/service/start", (req: restify.Request, res: restify.Response, next: restify.Next) => {
    const method = 'supervisor.startProcess'
    Promise.all([
        supervisorCtl.callMethod(method, ["nimbus"]),
    ]).then(result => {
        res.send(200, "started");
        next()
    }).catch(err => {
        res.send(200, "failed")
        next();
    })
});

server.get("/service/status", (req: restify.Request, res: restify.Response, next: restify.Next) => {
    const method = 'supervisor.getAllProcessInfo'
    supervisorCtl.callMethod(method, [])
        .then((value: any) => {
            res.send(200, value);
            next()
        }).catch((_error: any) => {
            res.send(500, "failed")
            next();
        });
});

let wampSession: any = null;
{
    const url = "ws://wamp.my.ava.do:8080/ws";
    const realm = "dappnode_admin";

    const connection = new autobahn.Connection({ url, realm });
    connection.onopen = (session: any) => {
        console.log("CONNECTED to \nurl: " + url + " \nrealm: " + realm);
        wampSession = session;
    };
    connection.open();
}

const getInstalledClients = async () => {
    const packageName = "ethdo.avado.dnp.dappnode.eth";
    const dappManagerHelper = new DappManagerHelper(packageName, wampSession);
    const packages = await dappManagerHelper.getPackages();

    const installed_clients = supported_beacon_chain_clients.filter(client => packages.includes(getAvadoPackageName(client, "beaconchain"))
        && packages.includes(getAvadoPackageName(client, "validator"))
    );
    return installed_clients;
}

server.get("/clients", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
    res.send(200, await getInstalledClients())
    next();
})

server.get("/executionclients", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
    const packageName = "ethdo.avado.dnp.dappnode.eth";
    const dappManagerHelper = new DappManagerHelper(packageName, wampSession);
    const packages = await dappManagerHelper.getPackages();

    const installed_clients = supported_execution_clients.filter(client => packages.includes(getAvadoExecutionClientPackageName(client)));

    res.send(200, installed_clients.map(client => ({
        name: client,
        api: `http://${validator_url(client)}:8545`
    })))
    next();
})

type ValidatorInfo = {
    index: number,
    pubkey: string,
    status: string,
    withdrawal_credentials: string
}

const getValidatorInfo = async (rest_url: string, pubkey: string) => {
    const url = `${rest_url}/eth/v1/beacon/states/finalized/validators/${pubkey}`
    // console.log(url)
    try {
        const data = await axios.get(url)
        if (!data.data)
            return null

        const info = data.data.data
        assert(info.validator.pubkey === pubkey)
        // console.log(info.validator.pubkey)
        return {
            index: info.index,
            pubkey: pubkey,
            status: info.status,
            withdrawal_credentials: info.validator.withdrawal_credentials
        } as ValidatorInfo

    } catch (e) {
        return null
    }
}

server.get("/validatorsinfo", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
    const installed_clients = await getInstalledClients()

    const validatorsinfo = await Promise.all(installed_clients.map(async (client) => {
        console.log(`fetching validators info from ${client}`)

        const dappManagerHelper = new DappManagerHelper(getAvadoPackageName(client, "validator"), wampSession);
        const path = getTokenPathInContainer(client);

        const file = await dappManagerHelper.getFileContentFromContainer(path);
        const token = file?.trim();

        const data = await axios.get(`${validatorAPI(client)}/eth/v1/keystores`, {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`
            }
        }).then((res) => res.data);

        // console.log(data)
        const pubKeys: string[] = data.data.map((d: any) => d.validating_pubkey);

        const validators = await Promise.all(pubKeys.map(pubKey => getValidatorInfo(rest_url(client), pubKey)))

        return (validators.filter(x => !!x)) as ValidatorInfo[];
    }))

    res.send(200, validatorsinfo.flat())
    next();
});

function ethdoExtraParams(installed_clients: string[]) {
    const connection = rest_url_ip(installed_clients[0]);
    const extra_params = `--connection ${connection} --allow-insecure-connections`;
    return extra_params;
}

server.post("/derive_addresses", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
    const body = req.body
    const mnemonic = body.mnemonic
    const amount = body.amount ?? 3

    const installed_clients = await getInstalledClients()

    if (installed_clients.length < 1) {
        res.send(500, "No beacon chain running")
        next();
    }

    const derive_address = (path: string) => {
        const stdout = execSync(`${ethdo} account derive --mnemonic="${mnemonic}" --path="${path}" ${ethdoExtraParams(installed_clients)}`)
        const matches = stdout.toString().match(/Public key: (.*)/)
        if (matches) {
            return matches[1]
        }
    }

    const addresses_3 = [...Array(amount)].map((_, i) => derive_address(`m/12381/3600/${i}/0/0`))
    const addresses_2 = [...Array(amount)].map((_, i) => derive_address(`m/12381/3600/${i}/0`))

    const addresses = addresses_3.concat(addresses_2);
    console.log(addresses)

    res.send(200, addresses)
    next();
});

server.post("/set_credentials", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
    const mnemonic = req.body.mnemonic
    const validator_index = req.body.validator_index
    const withdrawal_address = req.body.withdrawal_address

    const installed_clients = await getInstalledClients()

    if (installed_clients.length < 1) {
        res.send(500, "No beacon chain running")
        next();
    }

    console.log(`Setting withdrawal credentials of validator ${validator_index} to ${withdrawal_address}`)

    const cmd = `${ethdo} validator credentials set --mnemonic="${mnemonic}" --validator="${validator_index}" --withdrawal-address="${withdrawal_address}" ${ethdoExtraParams(installed_clients)}`

    try {
        const stdout = execSync(cmd)
        res.send(200, stdout.toString().trim() || "success")
        next();
    } catch (e: any) {
        // console.log(e.stderr.toString())
        res.send(500, e.stderr.toString().trim())
        next();
    }
});

// Returns one of:
// * "Ethereum execution address: 0x9b18e9e9aa3dD35100b385b7035C0B1E44AfcA14"
// * "BLS credentials: 0x00f719a14c8733dbb419af60246d8f29181f2549f99d6aa0867ba92d7d2a2966"
server.get("/get_credentials/:validator_index", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
    const validator_index = parseInt(req.params?.validator_index)

    if (!validator_index || Number.isNaN(validator_index)) {
        res.send(500, "incorrect validator_index")
        next();
    }

    const installed_clients = await getInstalledClients()

    if (installed_clients.length < 1) {
        res.send(500, "No beacon chain running")
        next();
    }

    console.log(`Getting withdrawal credentials of validator ${validator_index}`)

    const cmd = `${ethdo} validator credentials get --validator="${validator_index}" ${ethdoExtraParams(installed_clients)}`

    try {
        const stdout = execSync(cmd)
        res.send(200, stdout.toString().trim() || "success")
        next();
    } catch (e: any) {
        // console.log(e.stderr.toString())
        res.send(500, e.stderr.toString().trim())
        next();
    }
});

const axiosRequest = (url: string, headers: AxiosRequestHeaders, req: restify.Request, res: restify.Response, next: restify.Next) => {
    axios.request({
        method: req.method as Method,
        url: url,
        data: req.body,
        headers: headers,
    }).then((response: any) => {
        res.send(response.status, response.data)
        next();
    }).catch((error: any) => {
        console.log("Error contacting ", url, error.cause);
        res.send(500, "failed")
        next();
    });
}

server.listen(9999, function () {
    console.log("%s listening at %s", server.name, server.url);
    // supervisorCtl.callMethod("supervisor.getState", []).then((value: any) => {
    //     console.log("supervisor", value.statename)
    // })
});

