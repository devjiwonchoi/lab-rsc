import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { renderToString } from 'react-dom/server'
import sanitizeFilename from 'sanitize-filename'
import { fetchClientJSX, stringifyJSX } from './utils.js'

export const ssrHandler = async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    await sendHTML(res, url)
  } catch (err) {
    console.error(err)
    res.statusCode = err.statusCode ?? 500
    res.end()
  }
}

async function sendHTML(res, url) {
  const clientJSX = await fetchClientJSX(url.pathname)
  let html = await renderToString(clientJSX)
  const clientJSXString = JSON.stringify(clientJSX, stringifyJSX)
  html += `<script>window.__INITIAL_CLIENT_JSX_STRING__ = `
  html += JSON.stringify(clientJSXString).replace(/</g, '\\u003c')
  html += `</script>`
  html += `
    <script type="importmap">
      {
        "imports": {
          "react": "https://esm.sh/react@19.1.0",
          "react-dom/client": "https://esm.sh/react-dom@19.1.0/client"
        }
      }
    </script>
    <script type="module" src="/client.js"></script>
  `
  res.setHeader('Content-Type', 'text/html')
  res.end(html)
}

