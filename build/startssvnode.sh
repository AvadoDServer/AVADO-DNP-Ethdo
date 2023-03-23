#!/bin/sh

echo "Preparing node to start"

PUBLIC_KEY_FILE=/data/public_key.txt
PRIVATE_KEY_FILE=/data/private_key.txt
KEY_GEN_OUTPUT=/data/KEY_TEXT
CONFIG_PATH=/data/config.yml
DB_FOLDER=/data/db

if [ ! -f ${CONFIG_PATH} ]; then
    mkdir -p ${DB_FOLDER}
    touch ${CONFIG_PATH}

    /go/bin/ssvnode generate-operator-keys > ${KEY_GEN_OUTPUT}
    
    OPERATOR_PRIVATE_KEY=$(cat ${KEY_GEN_OUTPUT} | grep "private key" | sed -n 's/.*\({.*}\)/\1/p' | yq '.sk')
    OPERATOR_PUBLIC_KEY=$(cat ${KEY_GEN_OUTPUT} | grep "public key" | sed -n 's/.*\({.*}\)/\1/p' | yq '.pk')

    yq eval --inplace '.db.Path = "'${DB_FOLDER}'"' ${CONFIG_PATH}
    yq eval --inplace '.OperatorPrivateKey = "'${OPERATOR_PRIVATE_KEY}'"' ${CONFIG_PATH}
    yq eval --inplace '.OperatorPublicKey = "'${OPERATOR_PUBLIC_KEY}'"' ${CONFIG_PATH}

    yq eval --inplace '.eth2.Network = "prater"' ${CONFIG_PATH}
    yq eval --inplace '.eth2.BeaconNodeAddr = "http://teku-prater.my.ava.do:5051"' ${CONFIG_PATH}
    yq eval --inplace '.eth1.ETH1Addr = "ws://nethermind-goerli.my.ava.do:8546"' ${CONFIG_PATH}

    yq eval --inplace '.RegistryContractAddr="0xb9e155e65b5c4d66df28da8e9a0957f06f11bc04" | .RegistryContractAddr style="double"' ${CONFIG_PATH}

    # yq eval --inplace '.global.LogLevel = "debug"' ${CONFIG_PATH}
fi

echo "---config"
cat ${CONFIG_PATH}
echo "config---"

# Start SSV-Node
CONFIG_PATH=${CONFIG_PATH} make BUILD_PATH=/go/bin/ssvnode start-node