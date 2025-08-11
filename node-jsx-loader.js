import { transform } from 'esbuild'

export async function load(url, context, defaultLoad) {
  const result = await defaultLoad(url, context, defaultLoad)
  if (result.format === 'module') {
    // Transform JSX with esbuild
    try {
      const transformed = await transform(
        typeof result.source === 'string' 
          ? result.source 
          : Buffer.from(result.source).toString('utf8'),
        {
          loader: 'jsx',
          jsx: 'automatic',
          format: 'esm',
          target: 'node18'
        }
      )
      return { source: transformed.code, format: 'module' }
    } catch (error) {
      // If transformation fails, return original
      return result
    }
  }
  return defaultLoad(url, context, defaultLoad)
}
