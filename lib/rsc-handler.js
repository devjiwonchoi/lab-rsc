import sanitizeFilename from 'sanitize-filename'
import { createServer } from 'http'
import { readFile, readdir } from 'fs/promises'
import { stringifyJSX } from './utils.js'
import { Router } from '../router.js'

export const rscHandler = async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)

    if (url.searchParams.has('_rsc')) {
      // Keep the url passed to the <Router> clean
      url.searchParams.delete('_rsc')
    }

    const clientJSX = await renderJSXToClientJSX(<Router url={url} />)
    const clientJSXString = JSON.stringify(clientJSX, stringifyJSX)
    res.setHeader('Content-Type', 'application/json')
    res.end(clientJSXString)
  } catch (err) {
    console.error(err)
    res.statusCode = err.statusCode ?? 500
    res.end()
  }
}

async function renderJSXToClientJSX(jsx) {
  if (
    typeof jsx === 'string' ||
    typeof jsx === 'number' ||
    typeof jsx === 'boolean' ||
    jsx == null
  ) {
    // Don't need to do anything special with these types.
    return jsx
  } else if (Array.isArray(jsx)) {
    // Process each item in an array.
    return Promise.all(jsx.map((child) => renderJSXToClientJSX(child)))
  } else if (jsx != null && typeof jsx === 'object') {
    if (jsx.$$typeof === Symbol.for('react.transitional.element')) {
      if (typeof jsx.type === 'string') {
        // This is a component like <div />.
        // Go over its props to make sure they can be turned into JSON.
        return {
          ...jsx,
          props: await renderJSXToClientJSX(jsx.props),
        }
      } else if (typeof jsx.type === 'function') {
        // This is a custom React component (like <Footer />).
        // Call its function, and repeat the procedure for the JSX it returns.
        const Component = jsx.type
        const props = jsx.props
        const returnedJsx = await Component(props)
        return renderJSXToClientJSX(returnedJsx)
      } else if (jsx.type === Symbol.for('react.fragment')) {
        return {
          ...jsx,
          props: await renderJSXToClientJSX(jsx.props),
        }
      } else {
        throw new Error('Not implemented.')
      }
    } else {
      // This is an arbitrary object (for example, props, or something inside of them).
      // Go over every value inside, and process it too in case there's some JSX in it.
      return Object.fromEntries(
        await Promise.all(
          Object.entries(jsx).map(async ([propName, value]) => [
            propName,
            await renderJSXToClientJSX(value),
          ])
        )
      )
    }
  } else throw new Error('Not implemented')
}
