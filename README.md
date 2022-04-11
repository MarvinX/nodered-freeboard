# Freeboard dashboard integration for Node-RED

## Overview

This is a patched version of [urbiworx/node-red-contrib-freeboard](https://github.com/urbiworx/node-red-contrib-freeboard) v0.0.7; see also the [Node-RED library link](https://flows.nodered.org/node/node-red-contrib-freeboard). The applied patches to the original sources are documented [here](docs/nodered-freeboard_setup_and_usage.md).

## Copyright

(C) 2022, MarvinX, https://github.com/MarvinX.

## License

Apache Version 2.0, see [LICENSE](./LICENSE) file.\
The included Freeboard package is licensed under [MIT](https://opensource.org/licenses/MIT) license.

## Credits

Based on [urbiworx/node-red-contrib-freeboard](https://github.com/urbiworx/node-red-contrib-freeboard).\
Uses [Freeboard](https://github.com/Freeboard/freeboard) dashboard.\
Includes the custom Freeboard [RAG-widget](https://github.com/leon-van-dongen/freeboard-widget-rag).

## Installation, setup and basic usage

A step-by-step instruction for installing Node.js, Node-RED, Freeboard and this patched nodered/freeboard addon can be found in [docs/nodered-freeboard_setup_and_usage](docs/nodered-freeboard_setup_and_usage.md).

## Technical notes

Technical details about the implementation of nodered-freeboard addon and interaction between Node-RED dataservice and Freeboard dashboard can be found in [docs/nodered-freeboard_internals](docs/nodered-freeboard_internals.md).

## Misc

This repository includes the Github sources of the self-hosted [Freeboard](https://github.com/Freeboard/freeboard) dashboard from master branch 38789f6 of 7 Mar 2018.

The included Freeboard [RAG-widget](freeboard-widget-rag-files) is based on master branch c998136
on 30 Jun 2015 from https://github.com/leon-van-dongen/freeboard-widget-rag.
