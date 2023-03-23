import styles from '../styles/Home.module.css';
import axios from 'axios';
import { server_config } from "../config";
import React, { useEffect, useState, useCallback } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faAngleDown, faAngleUp } from "@fortawesome/free-solid-svg-icons";
const yaml = require('js-yaml');

// // import { StyledDropZone } from 'react-drop-zone';
// const react_drop_zone = require('react-drop-zone');

import Dropzone from 'react-dropzone'

export const RestoreBackup = () => {

    const [collapsed, setCollapsed] = React.useState(true);
    const [backupFile, setBackupFile] = React.useState<File | null>();
    const [backupFileContent, setBackupFileContent] = React.useState<string>();

    type result = {
        status: "restored" | "error" | "restoring" | "validating" | "valid" | null
        message: string
    }

    const [result, setResult] = React.useState<result>({ status: null, message: "" });


    useEffect(() => {

        const verifyAndSet = async (backupFile: File) => {
            const setError = (message: string) => {
                setResult({ status: "error", message: `The uploaded file is not a valid config backup (${message})` })
                setBackupFileContent(undefined)
            }
            const backupContent = backupFile ? await backupFile?.text() : null

            if (!backupContent) {
                setError("no content")
                return
            }

            console.log("Validating backup file:", backupFile?.name)

            try {
                const content = yaml.load(backupContent, 'utf8');

                // Backup file should at least have these fields
                if (
                    content?.db?.Path
                    && content?.OperatorPrivateKey
                    && content?.OperatorPublicKey
                    && content?.RegistryContractAddr
                ) {
                    setResult({ status: "valid", message: "Valid config file, ready for restoring" })
                    setBackupFileContent(backupContent)
                } else {
                    setError("missing items in yaml file")
                }

            } catch (e) {
                setError(e as string)
                return
            }
        }

        if (backupFile) {
            setResult({ status: "validating", message: "Verifying backup file" })
            verifyAndSet(backupFile)
        }
    }, [backupFile]);

    const restoreBackup = () => {
        const element = document.createElement("a");
        setBackupFileContent(undefined)
        setResult({ status: "restoring", message: "Restoring backup" })

        axios.post(`${server_config.monitor_url}/restoreConfig`, { config: backupFileContent })
            .catch(e => { console.error(e) })
            .then((res) => {
                setResult({ status: "restored", message: "Successfully restored SSV operator config" })
                window.location.reload()
            });
    }

    const getResultTag = () => {
        switch (result.status) {
            case "error": return "is-danger";
            case "validating": return "is-warning";
            case "restoring": return "is-warning";
            default: return "is-success";
        }
    }

    // TODO: why are angledown and up icons not visible?
    return (
        <>
            <>Or</>
            <div>
                <section className="section">
                    <div className="container">
                        <div className="card">
                            <header className="card-header" onClick={() => setCollapsed(!collapsed)}>
                                <p className="card-header-title">Restore an SSV operator from a backup config file</p>
                                <div className="card-header-icon card-toggle">
                                    <FontAwesomeIcon icon={collapsed ? faAngleDown : faAngleUp} />
                                </div>
                            </header>
                            <div className={"card-content" + (collapsed ? " is-hidden" : "")}>
                                <div className="content">
                                    <div className="field is-horizontal">
                                        <label className="field-label has-text-black">Config backup file (required):</label>
                                        <div className="field-body">
                                            <div className="file has-name">
                                                <label className="file-label"><input className="file-input" type="file" name="keystore" id="keystore" onChange={e => setBackupFile(e.target?.files?.item(0))} />
                                                    <span className="file-cta">
                                                        <span className="file-icon">
                                                            <FontAwesomeIcon icon={faUpload} />
                                                        </span>
                                                        <span className="file-label">
                                                            Choose config file…
                                                        </span>
                                                    </span>
                                                    <span className="file-name">
                                                        {backupFile ? backupFile.name : "No file uploaded"}
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="field is-grouped">
                                        <label className="field-label has-text-black">{/* Left empty for spacing*/}</label>
                                        <div className="field-body">
                                            <div className="control">
                                                <button className="button is-link" onClick={restoreBackup} disabled={!backupFileContent}>Restore config file from backup</button>
                                            </div>
                                        </div>
                                    </div>
                                    {result.message && (<p className={"tag " + getResultTag()}>{result.message}</p>)}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>

    );
};


