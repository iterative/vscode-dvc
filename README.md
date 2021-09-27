# VSCode DVC: Insider Preview

[![Continuous Integration](https://github.com/iterative/vscode-dvc/actions/workflows/continuous-integration.yml/badge.svg)](https://github.com/iterative/vscode-dvc/actions/workflows/continuous-integration.yml)
[![Cross-Platform Test](https://github.com/iterative/vscode-dvc/actions/workflows/cross-platform-test.yml/badge.svg)](https://github.com/iterative/vscode-dvc/actions/workflows/cross-platform-test.yml)
[![Maintainability](https://api.codeclimate.com/v1/badges/fb243c31ea059c0038b2/maintainability)](https://codeclimate.com/repos/608b5886f52398018b00264c/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/fb243c31ea059c0038b2/test_coverage)](https://codeclimate.com/repos/608b5886f52398018b00264c/test_coverage)

A Visual Studio Code Extension that aims to allow users of all technical
backgrounds to effectively use [DVC](https://dvc.org/), particularly the new
[Experiments](https://dvc.org/doc/start/experiments) feature.

This project is in a developmental state, and constantly evolving.

## Setup

### Installing the Extension

This repo is set up with a
[GitHub Action](https://github.com/iterative/vscode-dvc/actions) that uploads an
installable vsix build of the extension for every commit, complete with the Git
SHA appended to the extension version.

You can find the download link in the Artifacts list of any run of the
Continuous Integration workflow.

![Screenshot of artifacts menu](https://user-images.githubusercontent.com/9111807/118053924-64d0e000-b353-11eb-8d3d-7e202d741f54.png)

The easiest way to get to the build for any particular branch is to use the
GitHub Checks UI to get to the details of the "Continuous Integration" run: next
to any commit, its CI status will show up as an icon next to it. From there, you
can get to that commit's vsix in a few clicks through the Continuous Integration
check's details and to the summary of the Check run:

![Guide to get from Checks status to Artifacts](https://user-images.githubusercontent.com/9111807/118057990-19bacb00-b35b-11eb-9030-558e802668f1.png)

Once you have downloaded and extracted the `vsix` file, you can install it
following the
[official documentation](https://code.visualstudio.com/docs/editor/extension-marketplace#_install-from-a-vsix).

## How to Use

**See walkthrough** - `Welcome: Open Walkthrough...` > `Get Started With DVC`
from the command palette.

### Debugging

Due to the way DVC pipelines run scripts of any language from the command line,
users must debug pipeline scripts (e.g. `train.py`) standalone in whatever way
debuggers are run on the base language- this is standard for debugging DVC
pipelines, and most scripts are capable of running outside of DVC.

## Contributing

See development docs and contributing guidelines in
[CONTRIBUTING.md](CONTRIBUTING.md)
