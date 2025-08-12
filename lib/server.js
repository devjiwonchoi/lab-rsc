import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { rscHandler } from './rsc-handler.js'
import { ssrHandler } from './ssr-handler.js'

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)

    if (url.pathname === '/favicon.ico') {
      res.setHeader('Content-Type', 'image/x-icon')
      res.end(await readFile('./app/favicon.ico'))
      return
    }

    if (url.pathname === '/client.js') {
      res.setHeader('Content-Type', 'text/javascript')
      res.end(await readFile('./lib/client.js', 'utf8'))
      return
    }

    if (url.searchParams.has('_rsc')) {
      await rscHandler(req, res)
    } else {
      await ssrHandler(req, res)
    }
  } catch (err) {
    console.error(err)
    res.statusCode = err.statusCode ?? 500
    res.end()
  }
}).listen(3000)
