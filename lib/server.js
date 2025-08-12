import { createServer } from 'http'
import { readFile, writeFile } from 'fs/promises'
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

    if (url.pathname === '/utils.js') {
      res.setHeader('Content-Type', 'text/javascript')
      res.end(await readFile('./lib/utils.js', 'utf8'))
      return
    }

    if (url.searchParams.has('_rsc')) {
      await rscHandler(req, res)
      return
    }

    // Server Actions
    if (url.pathname.startsWith('/_sa/') && req.method === 'POST') {
      const body = await new Promise((resolve) => {
        let data = ''
        req.on('data', (chunk) => (data += chunk))
        req.on('end', () => resolve(data))
      })

      // Parse form data
      const formData = new URLSearchParams(body)
      const comment = formData.get('comment')

      // Read existing comments or create empty array
      let comments = []
      try {
        const existingComments = await readFile('./app/comments.json', 'utf8')
        comments = JSON.parse(existingComments)
      } catch (err) {
        comments = []
      }

      // Add new comment
      comments.push(comment)

      // Write back to file
      await writeFile('./app/comments.json', JSON.stringify(comments, null, 2))

      // Redirect back to the referrer
      res.statusCode = 302
      res.setHeader('Location', req.headers.referer || '/')
      res.end()
      return
    }

    await ssrHandler(req, res)
  } catch (err) {
    console.error(err)
    res.statusCode = err.statusCode ?? 500
    res.end()
  }
}).listen(3000)
