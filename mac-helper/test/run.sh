#!/bin/sh
# DuoDesk native policy tests. GPL-3.0.
set -eu
cd "$(dirname "$0")/.."
mkdir -p .build/tests
swiftc Sources/macshare-helper/EdgePolicy.swift test/main.swift -o .build/tests/edge-policy
.build/tests/edge-policy
