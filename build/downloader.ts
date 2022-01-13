import * as fs from 'fs';
import * as path from 'path';
import * as releases from '@hashicorp/js-releases';

function getPlatform() {
  const platform = process.platform.toString();
  if (platform === 'win32') {
    return 'windows';
  }
  if (platform === 'sunos') {
    return 'solaris';
  }
  return platform;
}

function getArch() {
  const arch = process.arch;
  if (arch === 'ia32') {
    return '386';
  }
  if (arch === 'x64') {
    return 'amd64';
  }
  return arch;
}

interface ExtensionInfo {
  extensionVersion: string;
  languageServerVersion: string;
}

export function getExtensionInfo(): ExtensionInfo {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pjson = require('../package.json');
  // return `${pjson.publisher}.${pjson.name}`;
  return {
    extensionVersion: pjson.version,
    languageServerVersion: pjson.langServer.version,
  };
}

async function run() {
  const cwd = path.resolve(__dirname);

  const buildDir = path.basename(cwd);
  const repoDir = cwd.replace(buildDir, '');
  const installPath = path.join(repoDir, 'bin');
  if (fs.existsSync(installPath)) {
    fs.rmSync(installPath, { recursive: true });
  }
  fs.mkdirSync(installPath);

  const extInfo = getExtensionInfo();
  console.log(extInfo);

  const userAgent = `Terraform-VSCode/${extInfo.extensionVersion}`;
  const release = await releases.getRelease('terraform-ls', extInfo.languageServerVersion, userAgent);

  const os = getPlatform();
  const arch = getArch();
  const build = release.getBuild(os, arch);
  if (!build) {
    throw new Error(`Install error: no matching terraform-ls binary for ${os}/${arch}`);
  }

  console.log(build);

  const zipfile = path.resolve(installPath, `terraform-ls_v${release.version}.zip`);
  await release.download(build.url, zipfile, userAgent);
  await release.verify(zipfile, build.filename);
  await release.unpack(installPath, zipfile);

  fs.rmSync(zipfile, {
    recursive: true,
  });
}

run();
