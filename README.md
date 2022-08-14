# Arma III Mods Key Extractor

A simple utility for extracting keys from Arma III mods and putting them to the keys folder on a server.

## Installation

### Requirements

This utility requires Node JS in order to run, you can install Node JS from [here](https://nodejs.org/en/).
_On Linux based distros you can use [nvm](https://github.com/nvm-sh/nvm)_

### Install

Open up your terminal emulator or PowerShell on Windows

Run the following command:

```bash
npm install --global arma-mods-key-extractor
```

Now the command is installed globally, close down your terminal emulator or powershell to refresh the PATH, and you're ready to run the command.

## Usage

Command: `arma-mods-key-extractor`

Example:

```bash
arma-mods-key-extractor --server-directory /home/Arma3_Server
```

Avaliable parameters:

`--server-directory`

-   Description:
    A path to the Arma III server directory
