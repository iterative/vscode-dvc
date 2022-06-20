## Feedback

See something that should be changed? Want to request a new feature? Open an
[issue on GitHub](https://github.com/iterative/vscode-dvc/issues)!

## Pull requests

You may also submit a change request to this repository directly
[from here](https://github.com/iterative/vscode-dvc/pulls). Contributions are
highly appreciated!

> 💡 **Tip**: To enable formatting on save in VS Code, install the
> `esbenp.prettier-vscode` extension. This is highly recommended as PRs with
> improper format will be blocked from merge until fixed.

## Development environment

The development environment allows contributors to test their changes to the
extension. The local repository source is built and loaded into the Extension
Development Host.

First, ensure that [Yarn](https://yarnpkg.com/) and
[Visual Studio Code](https://code.visualstudio.com) are installed.

- Open this repository's root directory as a project in VS Code.

- Run `Tasks: Run Build Task` (Ctrl+Shift+b) to start the extension and webview
  development servers (alternatively run `yarn dev-server` from the terminal).

  > **Warning**: Having a separate (`.vsix`) version of the extension installed
  > may cause all kinds of chaos in your development environment.

- Open the Extension Development Host, a child instance of VS Code with the
  results of the dev servers installed as an extension, with `Start Debugging`
  (f5).

  > **Note**: using the `Run Extension` command when running the debugger will
  > prevent all other extensions from loading into VS Code. This will improve
  > the performance of VS Code but can cause certain DVC commands to fail if the
  > project uses an isolated python environment (see [this warning](#warning)).

- Open a DVC project in the Extension Development Host. VS Code will remember
  the last project opened, so this step only has to be done once.

  > **Note**: We have provided a demo project as part of this repo, but feel
  > free to use any DVC project that you have available.

## The demo project

The [demo project](demo) was initially forked from [dvc-checkpoints-mnist], and
is provided as a lightweight, convenient testbed to try the extension out with.
It is not an exhaustive showcase of DVC's features, so testers are encouraged to
try other DVC repositories -- especially real-world cases!

- Go to the `demo/` directory of this repo.

- Install [Yarn](https://yarnpkg.com/) if needed, and run `yarn install` to set
  up the project.

- Go back to the root of this repo (`cd ..`) and run `yarn setup:venv` to set up
  a Python virtual environment in the demo project (in `demo/.env`).

  > Go to `demo/` if you want to use DVC from command line (terminal).

- Pull the project data with the extension (DVC panel in the Source Code view)
  or with `dvc pull` from command line.

- In order to run experiments in the demo project, the virtual env should be
  loaded. This will happen automatically if the Microsoft [Python extension] is
  installed and setup to use the demo's virtual env, or you can set it up
  manually with the `dvc.dvcPath` setting (see [Configuration]).

[dvc-checkpoints-mnist]:
  https://github.com/iterative/dvc-checkpoints-mnist/tree/make_checkpoint
[python extension]:
  https://marketplace.visualstudio.com/items?itemName=ms-python.python
[configuration]:
  https://github.com/iterative/vscode-dvc/tree/contrib/demo#configuration

<a id='warning'></a>

> **Warning**  
> When using any project that relies on an isolated Python environment (`conda`,
> `venv`, etc.), Microsoft's Python extension is required. It's used by this
> extension to locate and utilize the required environment.

## React component development with Storybook

Start Storybook with `yarn storybook` in either the monorepo root or in the
`webview` project. You can develop the React components this plugin uses without
requiring VS Code as a dev environment.

There are some discrepancies between the Storybook environment and the
environment of a real VS Code extension, custom themes being a big one. Always
make sure to try out changed components in the full dev environment before
merging!
