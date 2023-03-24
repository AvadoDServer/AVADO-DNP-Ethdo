import * as restify from "restify";
import corsMiddleware from "restify-cors-middleware2"
import axios, { Method, AxiosRequestHeaders } from "axios";
import * as fs from 'fs';
import { SupervisorCtl } from "./SupervisorCtl";
import { server_config } from "./server_config";
import { assert } from "console";
import { exec, execSync } from "child_process"
// const exec = require("child_process").exec;

console.log("Monitor starting...");

const server = restify.createServer({
    name: "MONITOR",
    version: "1.0.0"
});

const cors = corsMiddleware({
    preflightMaxAge: 5, //Optional
    origins: [
        /^http:\/\/localhost(:[\d]+)?$/,
        "http://*.dappnode.eth",
        "http://*.my.ava.do"
    ]
});

server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.plugins.bodyParser());

const settings_file_path = '/data/settings.json';

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

const emptyCallBack = (error: Object, value: any) => { };

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


const getValidatorInfo = async (rest_url: string, pubkey: string) => {
    const url = `${rest_url}/eth/v1/beacon/states/finalized/validators/${pubkey}`
    // console.log(url)
    try {
        const data = await axios.get(url)
        if (!data.data)
            return null

        const info = data.data.data
        assert(info.validator.pubkey === pubkey)
        return {
            index: info.index,
            pubkey: pubkey,
            status: info.status,
            withdrawal_credentials: info.validator.withdrawal_credentials
        }

    } catch (e) {
        return null
    }

}

server.get("/:client/:network/validatorsinfo", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
    const client = req.params?.client ?? "teku";
    const network = req.params?.network ?? "prater";
    
    const validator_url = () => {
        switch (client) {
            case "prysm": switch (network) {
                case "prater": return "http://eth2validator-prater.my.ava.do"
                case "mainnet": return "http://eth2validator.my.ava.do"
            }
            case "teku": switch (network) {
                case "prater": return "http://teku-prater.my.ava.do"
                case "mainnet": return "http://teku.my.ava.do"
            }
        }
    }

    const rest_url = () => {
        switch (client) {
            case "prysm": return `http://prysm-beacon-chain-${network}.my.ava.do:3500`
            default: return validator_url() + ":5051"
        }
    }

    const validatorAPI = () => {
        switch (client) {
            case "prysm": return validator_url() + ":7500"
            case "teku": return validator_url() + ":5052"
        }
    }

    const token_url = () => {
        switch (client) {
            case "prysm": return `${validator_url()}:81/auth-token.txt`
            default: return `${validator_url()}:81/auth-token.txt`
        }
    }
    

    const token = (await axios.get(token_url())).data.trim()

    // console.log(token)

    const keystores_url: string = `${validatorAPI()}/eth/v1/keystores`;

    // console.log(keystores_url)

    const data = await axios.get(keystores_url, {
        headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
        }
    }).then((res) => res.data);

    // console.log(data)


    const validators = await Promise.all(data.data.map((d: any) => getValidatorInfo(rest_url(), d.validating_pubkey)))

    const filtered_validators = validators.filter(x => !!x)
    res.send(200, filtered_validators)
    next();
});


server.post("/derive_addresses", async (req: restify.Request, res: restify.Response, next: restify.Next) => {
    // if (!req.is('json')) {
    //     return next(new restify.errors.UnsupportedMediaTypeError('content-type: application/json required'));
    // }
    const body = req.body
    const mnemonic = body.mnemonic
    const amount = body.amount ?? 3

    // const connection = "http://prysm-beacon-chain-prater.my.ava.do:3500"
    const connection = "http://172.33.0.7:3500"
    const extra_params = `--connection ${connection} --allow-insecure-connections`
    const ethdo = "/Users/heeckhau/git/avado-daps/AVADO-SSV-Ethdo/build/monitor/ethdo"

    const derive_address = (path: string) => {
        const stdout = execSync(`${ethdo} account derive --mnemonic="${mnemonic}" --path="${path}" ${extra_params}`)
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

    // console.log(mnemonic)
    // console.log(validator_index)
    // console.log(withdrawal_address)
    console.log(`Setting withdrawal credentials of validator ${validator_index} to ${withdrawal_address}`)

    // const connection = "http://prysm-beacon-chain-prater.my.ava.do:3500"
    const connection = "http://172.33.0.7:3500"
    const extra_params = `--connection ${connection} --allow-insecure-connections`
    const ethdo = "/Users/heeckhau/git/avado-daps/AVADO-SSV-Ethdo/build/monitor/ethdo"

    const cmd = `${ethdo} validator credentials set --mnemonic="${mnemonic}" --validator="${validator_index}" --withdrawal-address="${withdrawal_address}" ${extra_params}`

    try {
        const stdout = execSync(cmd)
        res.send(200, "success")
        next();
    } catch (e: any) {
        // console.log(e.stderr.toString())
        res.send(500, e.stderr.toString().trim())
        next();
    }
});

/////////////////////////////
// Beacon chain rest API   //
/////////////////////////////

server.get('/rest/*', (req: restify.Request, res: restify.Response, next: restify.Next) => {
    const path = req.params["*"]
    const url = `${server_config.rest_url}/${path}`
    const headers = {
        'Content-Type': 'application/json'
    }
    axiosRequest(
        url,
        headers,
        req,
        res,
        next
    )
});

/////////////////////////////
// Key manager API         //
/////////////////////////////

server.get('/keymanager/*', (req: restify.Request, res: restify.Response, next: restify.Next) => {
    processKeyMangerRequest(req, res, next);
});


server.post('/keymanager/*', (req: restify.Request, res: restify.Response, next: restify.Next) => {
    processKeyMangerRequest(req, res, next);
});

server.del('/keymanager/*', (req: restify.Request, res: restify.Response, next: restify.Next) => {
    processKeyMangerRequest(req, res, next);
});

const processKeyMangerRequest = (req: restify.Request, res: restify.Response, next: restify.Next) => {
    const path = req.params["*"]
    const url = `${server_config.keymanager_url}/${path}`
    const keymanagertoken = getKeyManagerToken();
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${keymanagertoken}`
    }

    // console.log(req.body, url, keymanagertoken);
    axiosRequest(
        url,
        headers,
        req,
        res,
        next
    )
}

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

const getKeyManagerToken = () => {
    try {
        return fs.readFileSync(server_config.keymanager_token_path, 'utf8').trim();
    } catch (err) {
        console.error(err);
    }
}

server.listen(9999, function () {
    console.log("%s listening at %s", server.name, server.url);
    // supervisorCtl.callMethod("supervisor.getState", []).then((value: any) => {
    //     console.log("supervisor", value.statename)
    // })
});
