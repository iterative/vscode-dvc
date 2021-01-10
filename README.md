# vscode-dvc

[![Build plugin](https://github.com/iterative/vscode-dvc/workflows/Build%20plugin/badge.svg)](https://github.com/iterative/vscode-dvc/actions?query=workflow%3A%22Build+plugin%22)

This extension adds first-class support for DVC experiments in Visual Studio
Code

# Dev-Setup

- Install VS Code, nodejs and yarn
- Run `yarn` inside in the root dir
- Run `yarn workspace dvc-integration dev` and
  `yarn workspace dvc-vscode-webview dev` to start the typescript and webpack
  compilers.
- Use the run profile "Run Extension (Hot Reload + Dev UI)" in VS Code. This
  should enable hot reload for both the VS Code extension and the webview.
- Run `yarn build` to build the vsix.

## Usage

### Commands

Use the main view or VS Code's Command Palette (ctrl+shift+p) to access
commands.

- View Tree: show the webview.
- Run Experiment: run 'dvc exp run' in current workspace.

## Development

### Set Up Environment

- Install Visual Studio Code, nodejs and yarn
- Run `yarn` inside in the root dir to install packages

### Visual Studio Code Development

- Open the `vscode-dvc` parent project folder in VS Code
- Run `Tasks: Run Build Task` (Ctrl+Shift+b) to start the extension and webview
  development servers
- Open the test extension with `Start Debugging` (f5)

### Editor-agnostic Development

- run the `dev-server` NPM script to start the extension and webview dev servers
  (alternatively, use `extension-dev-server` and `webview-dev-server` to launch
  them individually)
- run the `dev-ui` script to launch VS code in with this plugin in dev mode.

# Resources

Expand for project-related examples:

<details><summary>Using DVC
</summary>
<p>

- [Command Reference](https://dvc.org/doc/command-reference)

  </details>
  <br>
  <details><summary>Using Visual Studio Code
  </summary>
  <p>

  - [User and Workspace Settings](https://code.visualstudio.com/docs/getstarted/settings)
    <p>
    </details>
    <br>
    <details><summary>VS Code API
    </summary>
    <br>

- Official (code.visualstudio.com/api)

  - [Window](https://code.visualstudio.com/api/references/vscode-api#window)
  - [Worskspace](https://code.visualstudio.com/api/references/vscode-api#workspace)
  - [Source Control Management](https://code.visualstudio.com/api/references/vscode-api#scm)
  - [Commands](https://code.visualstudio.com/api/references/vscode-api#commands)
  - [API Patterns](https://code.visualstudio.com/api/references/vscode-api#api-patterns)
    </details>
    <br>
    <details><summary>Other Extensions
    </summary>
    <p>

- **Samples:**
  - [Tree View](https://github.com/microsoft/vscode-extension-samples/tree/master/webview-view-sample)
  - [Webview Panel](https://github.com/microsoft/vscode-extension-samples/tree/master/webview-view-sample)
- **Other:**

  - [Git Graph](https://github.com/mhutchie/vscode-git-graph)
  - [Mercurial](https://github.com/mrcrowl/vscode-hg)
    </details>
    <br>
    <details><summary>Figma Toolkit for VS Code
    </summary>
    <br>

- [Webview List Pattern](https://www.figma.com/file/bfGPz3571VtKVHb0DR3HIk/VS-Code-Webview-Page-Patterns?node-id=2%3A0)

![](./extension/docs/figma-webview-list.png.png)

</details>

## Special Tech

- [Hot Reload for VS Code Extension Development](https://blog.hediet.de/post/hot_reload_for_vs_code_extension_development)
  by @heidet 🙏
- [node-reload](https://github.com/hediet/node-reload) by @heidet 🙏
- [vscode-webview-react](https://github.com/rebornix/vscode-webview-react) by
  @rebornix 🙏
- [MobX](https://mobx.js.org/README.html) by @mobxjs 🙏

## Submit/Request

Identify a unique challenge while working in the project? Describe it [here]().

Have a useful resource/snippet to add? Share it [here]().
