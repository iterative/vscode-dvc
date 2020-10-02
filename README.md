# vscode-dvc

An extension for VS Code that provides support for experiment tracking, file management, and pipelines

# Dev-Setup

-   Install VS Code, nodejs and yarn
-   Run `yarn` inside in the root dir
-   Run `yarn workspace dvc-integration dev` and `yarn workspace dvc-vscode-webview dev` to start the typescript and webpack compilers.
-   Use the run profile "Run Extension (Hot Reload + Dev UI)" in VS Code. This should enable hot reload for both the VS Code extension and the webview.
-   Run `yarn build` to build the vsix.
