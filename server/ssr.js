import { createServer } from 'http'
import { readFile, readdir } from 'fs/promises'
import { renderToString } from 'react-dom/server'
import sanitizeFilename from 'sanitize-filename'

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)

    if (url.pathname === '/favicon.ico') {
      res.setHeader('Content-Type', 'image/x-icon')
      res.end(await readFile('./app/favicon.ico'))
      return
    }

    if (url.pathname === '/client.js') {
      await sendScript(res, './client.js')
    } else {
      await sendHTML(res, url)
    }
  } catch (err) {
    console.error(err)
    res.statusCode = err.statusCode ?? 500
    res.end()
  }
}).listen(3000)

async function sendScript(res, filename) {
  const content = await readFile(filename, 'utf8')
  res.setHeader('Content-Type', 'text/javascript')
  res.end(content)
}

function stringifyJSX(key, value) {
  if (value === Symbol.for('react.transitional.element')) {
    return '$RE'
  } else if (typeof value === 'string' && value.startsWith('$')) {
    return '$' + value
  } else {
    return value
  }
}

async function sendHTML(res, url) {
  const clientJSX = await fetchClientJSX(url)
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

async function fetchClientJSX(url) {
  const response = await fetch('http://localhost:3001' + url.pathname)
  const jsx = await response.text()
  return JSON.parse(jsx, parseJSX)
}

function parseJSX(key, value) {
  if (value === '$RE') {
    // This is our special marker we added on the server.
    // Restore the Symbol to tell React that this is valid JSX.
    return Symbol.for('react.transitional.element')
  } else if (typeof value === 'string' && value.startsWith('$$')) {
    // This is a string starting with $. Remove the extra $ added by the server.
    return value.slice(1)
  } else {
    return value
  }
}
