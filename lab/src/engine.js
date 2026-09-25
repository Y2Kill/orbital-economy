import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadModelJSON } from 'simulation';

export const EXPECTED_ENGINE_VERSION = '9.0.0';

const DEFAULT_PACKAGE_JSON = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'node_modules',
  'simulation',
  'package.json'
);

export function readInstalledEngineVersion(packageJsonFile = DEFAULT_PACKAGE_JSON) {
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(packageJsonFile, 'utf8'));
  } catch (e) {
    throw new Error(
      `Orbital Economy Lab requires simulation@${EXPECTED_ENGINE_VERSION}, but cannot read installed engine metadata at ${packageJsonFile}: ${e.message || e}`
    );
  }
  if (typeof raw?.version !== 'string' || !raw.version) {
    throw new Error(`Installed simulation package at ${packageJsonFile} has no valid version field.`);
  }
  return raw.version;
}

export function assertEngineVersion(packageJsonFile = DEFAULT_PACKAGE_JSON) {
  const installed = readInstalledEngineVersion(packageJsonFile);
  if (installed !== EXPECTED_ENGINE_VERSION) {
    throw new Error(
      `Orbital Economy Lab requires simulation@${EXPECTED_ENGINE_VERSION}; found ${installed} at ${packageJsonFile}. Run INSTALL.cmd to restore the pinned engine.`
    );
  }
  return installed;
}

export const ENGINE_VERSION = assertEngineVersion();
export { loadModelJSON };
