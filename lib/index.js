const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const argv = yargs(hideBin(process.argv)).argv;
const terminal = require("color-terminal-fixed");
const fs = require("fs");
const path = require("path");
const Table = require("terminal-table");
const md5File = require("md5-file");
const prompt = require("prompt-sync")();
const ColoredLog = require("./ColoredLog");

class ArmaModKeyExtractor {
    constructor() {
        this.serverDirectory = argv.serverDirectory;

        if (this.v || this.version || this.help) {
            ColoredLog.separator();
            ColoredLog.custom(`\t\t%CArma III Mod keys extractor\n\t\t      %MVersion: %Gv0.0.2\n\t\t     %MAuthor: %YMilutinke`);
            ColoredLog.separator();
            ColoredLog.info(`Example usage: 'node index.js --server-directory /home/Arma3_Server/'`);
            return;
        }

        if (!this.serverDirectory) {
            ColoredLog.error(`Invalid use of the program, you are missing the '--server-directory' argument!`);
            ColoredLog.info(`Example usage: 'node index.js --server-directory /home/Arma3_Server/'`);
            return;
        }

        if (!fs.existsSync(this.serverDirectory)) {
            ColoredLog.error(`The provided directory path is invalid or does not exists!`);
            return;
        }

        const startTime = process.hrtime();

        ColoredLog.separator();
        ColoredLog.custom(`\t\t%CArma III Mod keys extractor\n\t\t      %MVersion: %Gv0.0.2\n\t\t     %MAuthor: %YMilutinke`);
        ColoredLog.separator();

        ColoredLog.info(`Working directory set to: %g'${this.serverDirectory}'`);
        ColoredLog.info(`Scanning for mods ...`);

        (async () => {
            const modsFolders = await this.#getModFolders();

            if (modsFolders.length === 0) {
                ColoredLog.warning(`No mods detected, stopping...`);
                ColoredLog.info(`Stopped!`);
                return;
            }

            ColoredLog.info(`Found %g${modsFolders.length}%w mods`);
            ColoredLog.info(`Checking if the main 'keys' folder exists ...`);

            const mainKeysFolder = path.join(this.serverDirectory, "keys");

            if (!fs.existsSync(mainKeysFolder)) {
                ColoredLog.info(`The 'keys' folder does not exist, creating one ...`);
                fs.mkdirSync(mainKeysFolder);
                ColoredLog.info(`Done, created the 'keys' folder!`);
            } else ColoredLog.info(`The 'keys' folder is found!`);

            ColoredLog.info(`Scanning mods for keys ...`);
            const findAndCopyKeysResults = await this.#findAndCopyKeys(modsFolders, mainKeysFolder);

            ColoredLog.info(`Copying keys...`);
            ColoredLog.info(`Finished!`);
            ColoredLog.info(`Results:`);

            const modKeysTable = new Table({ borderStyle: 3, horizontalLine: true, leftPadding: 3, rightPadding: 3 });
            modKeysTable.push(["Mod", "# keys found", "# keys copied"]);
            for (const result of findAndCopyKeysResults.result) modKeysTable.push([result.mod, result.foundKeys, result.copiedKeys]);
            terminal.colorize("%C" + modKeysTable);

            ColoredLog.separator();
            const endTime = process.hrtime(startTime);
            ColoredLog.info(`Done in %G${endTime}%ws!`);
            ColoredLog.separator();

            while (true) {
                const promptAnswer = prompt(`Do you want to print out a detailed log of operations? (Type 'yes' or 'no' and press enter) `).trim().toLowerCase();

                if (promptAnswer === "y" || promptAnswer === "yes") {
                    for (let logLine of findAndCopyKeysResults.log) {
                        switch (logLine.type) {
                            case "separator":
                                ColoredLog.separator();
                                break;

                            default:
                                if (logLine.type === "info" || logLine.type === "warning" || logLine.type === "error") ColoredLog[logLine.type](logLine.message);

                                break;
                        }
                    }

                    break;
                } else if (promptAnswer === "n" || promptAnswer === "no") break;
                else ColoredLog.error(`You must answer with y, yes, n or no!`);
            }
        })();
    }

    async #getModFolders() {
        const modFolders = new Array();
        const files = await fs.promises.readdir(this.serverDirectory);

        for (const file of files) {
            const stat = await fs.promises.stat(path.join(this.serverDirectory, file));
            if (stat.isDirectory() && file.trim().startsWith("@")) modFolders.push(file);
        }

        return modFolders;
    }

    async #findAndCopyKeys(modsFolders, mainKeysFolder) {
        const log = [];
        const result = [];

        for (const modFolder of modsFolders) {
            log.push({ type: "separator" });
            log.push({ type: "info", message: `Scanning mod %G'${modFolder}'%w for keys folder...` });
            const keysFolderPath = await this.#getKeysFolder(modFolder);

            if (!keysFolderPath) {
                log.push({ type: "warning", message: `Havent found any keys for mod %G'${modFolder}'%Y!` });

                result.push({
                    mod: modFolder,
                    foundKeys: 0,
                    copiedKeys: 0,
                });

                continue;
            }

            log.push({ type: "info", message: `Found a keys folder for mod %G'${modFolder}'%w path %G'${keysFolderPath}'%w!` });
            log.push({ type: "info", message: `Scanning mod %G'${modFolder}'%w for keys ...` });

            let foundKeys = 0;
            let copiedKeys = 0;

            const files = await fs.promises.readdir(keysFolderPath);
            for (const file of files) {
                const stat = await fs.promises.stat(path.join(keysFolderPath, file));
                if (stat.isFile() && file.trim().endsWith(".bikey")) {
                    log.push({ type: "info", message: `Found a key %C'${file}'%w for mod %G'${modFolder}'%w, attempting to copy...` });
                    foundKeys++;

                    try {
                        const keySource = path.join(keysFolderPath, file);
                        const keyDestination = path.join(mainKeysFolder, file);

                        // Check if we arelady have the key in the main keys folder
                        if (fs.existsSync(keyDestination)) {
                            // If we do, check if it's a different file (content wise) with the same name
                            // if yes, skip and mark as copied
                            if ((await md5File(keyDestination)) === (await md5File(keySource))) {
                                log.push({ type: "info", message: `Keys %C'${file}'%w for mod %G'${modFolder}'%w already exists, marking it as copied!` });
                                copiedKeys++;
                                continue;
                            }

                            // delete the destination filde
                            fs.unlinkSync(keyDestination);
                        }

                        await fs.promises.copyFile(keySource, keyDestination);
                        copiedKeys++;
                        log.push({ type: "info", message: `Succesfully copied a key %C'${file}'%w for mod %G'${modFolder}'%w!` });
                    } catch (error) {
                        log.push({ type: "error", message: `Failed to copy a key %C'${file}'%R for mod %G'${modFolder}'%R!` });
                    }
                }
            }

            result.push({
                mod: modFolder,
                foundKeys,
                copiedKeys,
            });
        }

        return {
            log,
            result,
        };
    }

    async #getKeysFolder(modFolder) {
        const fullDirectory = path.join(this.serverDirectory, modFolder);

        // Check for 'keys' and 'Keys'
        for (const usualName of ["key", "Key", "keys", "Keys"]) if (fs.existsSync(path.join(fullDirectory, usualName))) return path.join(fullDirectory, usualName);

        // Fallback: Check if a folder contains 'keys' in it's name
        const files = await fs.promises.readdir(fullDirectory);

        for (const file of files) {
            const stat = await fs.promises.stat(path.join(fullDirectory, file));
            if (stat.isDirectory() && file.trim().toLowerCase().includes("keys")) return path.join(fullDirectory, file);
        }

        return null;
    }
}

module.exports = ArmaModKeyExtractor;
