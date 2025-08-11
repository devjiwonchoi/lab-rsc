import { readdir } from 'fs/promises'

async function Post({ slug }) {
  let content
  try {
    const { readFile } = await import('fs/promises')
    content = await readFile('./app/posts/' + slug + '.txt', 'utf8')
  } catch (err) {
    const notFound = new Error('Not found.', { cause: err })
    notFound.statusCode = 404
    throw notFound
  }
  return (
    <section>
      <h2>
        <a href={'/' + slug}>{slug}</a>
      </h2>
      <article>{content}</article>
    </section>
  )
}

export default async function Blog() {
  const postFiles = await readdir('./app/posts')
  const postSlugs = postFiles.map((file) =>
    file.slice(0, file.lastIndexOf('.'))
  )
  return (
    <section>
      <h1>Welcome to my blog</h1>
      <div>
        {postSlugs.map((slug) => (
          <Post key={slug} slug={slug} />
        ))}
      </div>
    </section>
  )
}
