

const dev = false;

exports.server_config = {
    monitor_url: dev ? "http://localhost:9999" : "http://ethdo.my.ava.do:9999",
    config_file_path: dev ? "./test/config.yml" : "/data/config.yml",
    network: "goerli",
    dev: dev
}

