# NodeRED/Freeboard extension

## Overview

This projects provides a patched version of [urbiworx/node-red-contrib-freeboard](https://github.com/urbiworx/node-red-contrib-freeboard) v0.0.7, which adds [NodeRED](https://nodered.org/) as datasource for [Freeboard](https://freeboard.io/) dashboards.

The [original](https://github.com/Freeboard/freeboard/commit/38789f6e8bd3d04f7d3b2c3427e509d00f2610fc) extension has a couple of flaws and minor
bugs requiring improvements and fixes in order to work as expected.

## Copyright

(C) 2025, MarvinX

## License

[MIT](https://opensource.org/licenses/MIT)

## Credits

[node-red-contrib-freeboard](https://github.com/urbiworx/node-red-contrib-freeboard),
[Freeboard](https://github.com/Freeboard/freeboard),
[RAG-widget](https://github.com/leon-van-dongen/freeboard-widget-rag)

## Installation, setup and basic usage

A step-by-step instruction for installing Node.js, NodeRED, Freeboard and this patched nodered-freeboard extension can be found in [docs/nodered-freeboard_setup_and_usage](docs/nodered-freeboard_setup_and_usage.md).

## Notes

Details about the implementation of nodered-freeboard extension and the interaction between NodeRED and Freeboard dashboard can be found in [docs/nodered-freeboard_internals.md](docs/nodered-freeboard_internals.md).

Freeboard [RAG-widget](freeboard-widget-rag-files) version, included here, is based on [leon-vd/freeboard-widget-rag](https://github.com/leon-vd/freeboard-widget-rag/commit/c998136d5751da3f7570e3582292b19dae18e7d7).
