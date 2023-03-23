

const dev = false;

exports.server_config = {
    monitor_url: dev ? "http://localhost:9999" : "http://ethdo.my.ava.do:9999",
    config_file_path: dev ? "./test/config.yml" : "/data/config.yml",
    network: "goerli",
    dev: dev,

    execution_client_name: "goerli-geth.avado.dnp.dappnode.eth",
    execution_client_rest: `http://goerli-geth.my.ava.do:8545`,
    // execution_client: `http://nethermind-goerli.my.ava.do:8545`,        
}

