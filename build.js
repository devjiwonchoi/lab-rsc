import { fileURLToPath } from 'url'
import { build as esbuild } from 'esbuild'

export async function build() {
  await esbuild({
    bundle: true,
    format: 'esm',
    logLevel: 'error',
    entryPoints: [resolveAppPath('page.jsx')],
    outdir: resolveBuildPath(),
    packages: 'external',
    tsconfigRaw: { compilerOptions: { jsx: 'react-jsx' } },
  })
}

const appDir = new URL('./app/', import.meta.url)
const buildDir = new URL('./build/', import.meta.url)

function resolveAppPath(path = '') {
  return fileURLToPath(new URL(path, appDir))
}

function resolveBuildPath(path = '') {
  return fileURLToPath(new URL(path, buildDir))
}
