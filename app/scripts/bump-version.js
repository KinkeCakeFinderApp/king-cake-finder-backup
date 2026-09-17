#!/usr/bin/env node
// Bumps app.json's expo.version minor digit by 1 and resets patch to 0
// (1.0.0 -> 1.1.0 -> 1.2.0 -> ...). Run before every build, per project
// convention — see HANDOFF notes. The internal build number/versionCode
// (what actually distinguishes binaries to the app stores) is separate and
// already auto-increments on its own via eas.json's "autoIncrement": true —
// this script only touches the human-facing version string.

const fs = require('fs');
const path = require('path');

const appJsonPath = path.resolve(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

const current = appJson.expo.version || '1.0.0';
const parts = current.split('.').map((n) => parseInt(n, 10) || 0);
while (parts.length < 3) parts.push(0);

const [major, minor] = parts;
const next = `${major}.${minor + 1}.0`;

appJson.expo.version = next;
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');

console.log(`Version bumped: ${current} -> ${next}`);
