import sanitizeFilename from 'sanitize-filename'

export async function Router({ url }) {
  const { default: Layout } = await import('./app/layout.jsx')
  let page
  if (url.pathname === '/') {
    const { default: BlogPage } = await import('./app/blog.jsx')
    page = <BlogPage />
  } else {
    const postSlug = sanitizeFilename(url.pathname.slice(1))
    const { default: PostPage } = await import('./app/post.jsx')
    page = <PostPage postSlug={postSlug} />
  }
  return <Layout>{page}</Layout>
}