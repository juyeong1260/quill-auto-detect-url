import esbuild from 'esbuild'

const build = async () => {
  const ctxs = await Promise.all([
    esbuild.context({
      entryPoints: ['src/index.ts'],
      bundle: true,
      outfile: 'lib/index.mjs',
      format: 'esm',
      packages: 'external',
      logLevel: 'debug',
      target: ['esnext'],
    }),
    esbuild.context({
      entryPoints: ['src/index.ts'],
      bundle: true,
      outfile: 'lib/index.js',
      format: 'cjs',
      packages: 'external',
      logLevel: 'debug',
      target: ['esnext'],
    }),
  ])

  await Promise.all(ctxs.map((ctx) => ctx.watch()))

  // await Promise.all(ctxs.map((ctx) => ctx.rebuild().then(() => ctx.dispose())))
}

build()
