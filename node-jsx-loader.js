import { transform } from 'esbuild'
import { fileURLToPath } from 'url'

export async function resolve(specifier, context, defaultResolve) {
  // Handle .jsx files by setting format to module
  if (specifier.endsWith('.jsx')) {
    const resolved = await defaultResolve(specifier, context)
    return {
      ...resolved,
      format: 'module'
    }
  }
  return defaultResolve(specifier, context)
}

export async function load(url, context, defaultLoad) {
  // Only process file URLs
  if (!url.startsWith('file:')) {
    return defaultLoad(url, context, defaultLoad)
  }
  
  // Only transform .jsx and .js files that might contain JSX
  if (url.endsWith('.jsx') || url.endsWith('.js')) {
    const result = await defaultLoad(url, context, defaultLoad)
    
    // Only transform if format is 'module'
    if (result.format === 'module') {
      try {
        const source = typeof result.source === 'string' 
          ? result.source 
          : Buffer.from(result.source).toString('utf8')
          
        const transformed = await transform(source, {
          loader: url.endsWith('.jsx') ? 'jsx' : 'jsx', // Use jsx loader for both
          jsx: 'automatic',
          format: 'esm',
          target: 'node18'
        })
        
        return { source: transformed.code, format: 'module' }
      } catch (error) {
        console.error('JSX transformation error:', error)
        // If transformation fails, return original
        return result
      }
    }
  }
  
  return defaultLoad(url, context, defaultLoad)
}
