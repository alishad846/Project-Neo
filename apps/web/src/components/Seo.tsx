// Per-page document metadata. React 19 hoists <title> and <meta> rendered
// anywhere in the tree up into <head> and de-dupes them, so we don't need
// react-helmet-async — just render this at the top of each route. The values
// in index.html act as the default/fallback for the initial paint and for the
// home route (which also renders <Seo> with the same copy for clarity).
//
// BASE_URL is a placeholder until the real domain is known (see progress.md
// "OPEN QUESTIONS"); it's only used to emit an absolute canonical link.

const BASE_URL = "https://neo.example"; // TODO: replace with real deployed domain

interface SeoProps {
  title: string;
  description: string;
  /** Route path (e.g. "/tools") used to build the canonical URL. */
  path: string;
}

export function Seo({ title, description, path }: SeoProps) {
  const canonical = `${BASE_URL}${path}`;
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <link rel="canonical" href={canonical} />
    </>
  );
}
