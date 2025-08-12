import { readFile } from 'fs/promises'

function throwNotFound(cause) {
  const notFound = new Error('Not found.', { cause })
  notFound.statusCode = 404
  throw notFound
}

export default async function BlogPostPage({ postSlug }) {
  let content
  try {
    content = await readFile('./app/posts/' + postSlug + '.txt', 'utf8')
  } catch (err) {
    // TODO: render 404 page
    // throwNotFound(err)
  }
  return (
    <section>
      <h2>
        <a href={'/' + postSlug}>{postSlug}</a>
      </h2>
      <article>{content}</article>
    </section>
  )
}
