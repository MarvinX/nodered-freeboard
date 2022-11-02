# Freeboard dashboard integration for Node-RED

## Overview

This is a patched version of [urbiworx/node-red-contrib-freeboard](https://github.com/urbiworx/node-red-contrib-freeboard) v0.0.7; see also the [NodeRED library link](https://flows.nodered.org/node/node-red-contrib-freeboard).

## Copyright

(C) 2022, MarvinX, https://github.com/MarvinX.

## License

Apache Version 2.0, see [LICENSE](./LICENSE) file.
The included Freeboard package is under [MIT](https://opensource.org/licenses/MIT) license.

## Credits

Based on [urbiworx/node-red-contrib-freeboard](https://github.com/urbiworx/node-red-contrib-freeboard).

Uses [Freeboard](https://github.com/Freeboard/freeboard) dashboard.

Includes the custom Freeboard [RAG-widget](https://github.com/leon-van-dongen/freeboard-widget-rag).

## Installation, setup and basic usage

A step-by-step instruction for installing Node.js, NodeRED, Freeboard and this patched nodered-freeboard extension can be found in [docs/nodered-freeboard_setup_and_usage](docs/nodered-freeboard_setup_and_usage.md).

## Technical notes

Details about the implementation of nodered-freeboard extension and the interaction between NodeRED and Freeboard dashboard can be found in [docs/nodered-freeboard_internals.md](docs/nodered-freeboard_internals.md).

## Misc

This repository includes the Github sources of the self-hosted [Freeboard](https://github.com/Freeboard/freeboard) dashboard from master branch `38789f6` from 7th March 2018.

The included Freeboard [RAG-widget](freeboard-widget-rag-files) is based on master branch `c998136` from 30th June 2015 from https://github.com/leon-van-dongen/freeboard-widget-rag.
