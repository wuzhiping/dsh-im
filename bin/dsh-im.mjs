#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const PACKAGE_NAME = 'dsh-im';
const DEFAULT_SOURCE = 'github:wuzhiping/dsh-im';
const LEGACY_PACKAGES = [
  '@xmanrui/dsh-feishu',
  '@xmanrui/dsh-weixin',
  '@xmanrui/dsh-dingtalk',
];
const DSH_ENTRY_SUFFIX = join('node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js');

function usage() {
  console.log(`Usage:
  dsh-im install [--profile web] [--source <package-spec>]
  dsh-im uninstall [--profile web]

Examples:
  npx -y github:wuzhiping/dsh-im install
  dsh-im install --source .

If DSH is installed somewhere this CLI cannot discover, set DSH_CLI to its
lib/bin.js path (or to an executable that takes the same arguments).`);
}

function takeOption(args, name, fallback) {
  const index = args.indexOf(name);
  if (index < 0) return fallback;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
  args.splice(index, 2);
  return value;
}

/** Resolve `<prefix>/node_modules/@deepseek-ai/dsh/lib/bin.js` for an npm prefix. */
function entryUnder(prefix) {
  if (!prefix) return null;
  for (const candidate of [join(prefix, DSH_ENTRY_SUFFIX), join(prefix, '..', DSH_ENTRY_SUFFIX)]) {
    if (existsSync(candidate)) return resolve(candidate);
  }
  return null;
}

/**
 * Find a runnable DSH CLI.
 *
 * `spawnSync('dsh', …, { shell: false })` cannot execute npm's Windows shims:
 * `dsh` and `dsh.ps1` are scripts, and `dsh.cmd` needs cmd.exe. Resolve the real
 * JavaScript entry instead and run it with the current Node binary.
 */
function resolveDsh() {
  if (process.env.DSH_CLI) {
    return { command: process.env.DSH_CLI, prefixArgs: [], shell: false };
  }
  if (process.platform !== 'win32') return { command: 'dsh', prefixArgs: [], shell: false };

  const prefixes = [];
  // npx passes its --prefix down as npm_config_prefix.
  if (process.env.npm_config_prefix) prefixes.push(process.env.npm_config_prefix);
  if (process.env.APPDATA) prefixes.push(join(process.env.APPDATA, 'npm'));
  const located = spawnSync('where', ['dsh'], { encoding: 'utf8', shell: false });
  for (const line of String(located.stdout ?? '').split(/\r?\n/)) {
    const found = line.trim();
    if (found) prefixes.push(dirname(found));
  }
  for (const prefix of prefixes) {
    const entry = entryUnder(prefix);
    if (entry) return { command: process.execPath, prefixArgs: [entry], shell: false };
  }
  // Last resort: let cmd.exe interpret the shim.
  return { command: 'dsh.cmd', prefixArgs: [], shell: true };
}

function runDsh(args) {
  const { command, prefixArgs, shell } = resolveDsh();
  const result = shell
    ? spawnSync(
      [command, ...prefixArgs, ...args]
        .map((part) => (/[\s"]/u.test(part) ? `"${part.replaceAll('"', '\\"')}"` : part))
        .join(' '),
      { cwd: tmpdir(), stdio: 'inherit', shell: true },
    )
    : spawnSync(command, [...prefixArgs, ...args], {
      cwd: tmpdir(),
      stdio: 'inherit',
      shell: false,
    });
  if (result.error?.code === 'ENOENT') {
    throw new Error('找不到 dsh，请先安装 DeepSeek Harness，并把 dsh 加入 PATH 或设置 DSH_CLI。');
  }
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`dsh 退出，状态码 ${result.status ?? 1}`);
}

async function directProfilePackages(profile) {
  const dshHome = process.env.DSH_HOME || join(homedir(), '.dsh');
  const profilePackage = join(dshHome, 'profiles', profile, 'package.json');
  try {
    const manifest = JSON.parse(await readFile(profilePackage, 'utf8'));
    const bundles = new Set(manifest.dsh?.profile?.bundles ?? []);
    const dependencies = manifest.dependencies ?? {};
    return new Set(LEGACY_PACKAGES.filter((name) => dependencies[name] || bundles.has(name)));
  } catch (error) {
    if (error?.code === 'ENOENT') return new Set();
    throw new Error(`无法读取 Harness 配置 ${profilePackage}：${error.message}`);
  }
}

const args = process.argv.slice(2);
const command = args.shift();

if (!command || command === '--help' || command === '-h') {
  usage();
  process.exit(0);
}

try {
  const profile = takeOption(args, '--profile', 'web');
  if (command === 'install') {
    const requested = takeOption(args, '--source', DEFAULT_SOURCE);
    const source = requested === '.' || requested === '..'
      || requested.startsWith('./') || requested.startsWith('../')
      ? resolve(process.cwd(), requested)
      : (isAbsolute(requested) ? requested : requested);
    if (args.length > 0) throw new Error(`无法识别的参数：${args.join(' ')}`);

    const legacy = await directProfilePackages(profile);
    runDsh(['plugin', '--profile', profile, 'add', '--save-exact', source]);
    for (const packageName of legacy) {
      runDsh(['plugin', '--profile', profile, 'remove', packageName]);
    }
    console.log('\nIM 机器人插件已安装。请重启 dsh web、刷新浏览器，然后打开「设置 → IM机器人」。');
    if (legacy.size > 0) {
      console.log('已用 dsh-im 替换独立飞书/微信/钉钉插件；原有凭据和扫码绑定保持不变。');
    }
  } else if (command === 'uninstall') {
    if (args.length > 0) throw new Error(`无法识别的参数：${args.join(' ')}`);
    runDsh(['plugin', '--profile', profile, 'remove', PACKAGE_NAME]);
    console.log('\nIM 机器人插件已卸载。请重启 dsh web。');
  } else {
    throw new Error(`无法识别的命令：${command}`);
  }
} catch (error) {
  console.error(`dsh-im: ${error.message}`);
  process.exit(1);
}
