#!/bin/bash

# In yarn v1, --frozen-lockfile is completely
# broken when combined with Yarn workspaces. See https://github.com/yarnpkg/yarn/issues/6291

CKSUM_BEFORE=$(cksum yarn.lock)
yarn install
CKSUM_AFTER=$(cksum yarn.lock)


if [[ $CKSUM_BEFORE != $CKSUM_AFTER ]]; then
  echo "Changes were detected in yarn.lock file after running 'yarn install', which is not expected - terminating."
	echo "Please ensure that the correct version of the yarn.lock file has been committed."
  exit 1
fi
