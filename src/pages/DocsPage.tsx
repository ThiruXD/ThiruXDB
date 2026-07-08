import { useLocation, useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { RootProvider as BaseRootProvider } from 'fumadocs-ui/provider/base';
import { FrameworkProvider } from 'fumadocs-core/framework';
import { useMemo } from 'react';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { DocsPage as FumaDocsPage, DocsBody, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const markdownFiles = import.meta.glob('../docs/*.md', { query: '?raw', import: 'default', eager: true });

const DOCS_PAGES = [
  { id: 'getting-started', title: 'Getting Started' },
  { id: 'architecture', title: 'Architecture & Stack' },
  { id: 'api-gateway', title: 'API Gateway' },
  { id: 'sync-engine', title: 'Sync Engine' },
  { id: 'security', title: 'Security' },
  { id: 'development', title: 'Development & Contributing' },
];

const pageTree = {
  name: 'Docs',
  children: DOCS_PAGES.map((page) => ({
    type: 'page' as const,
    name: page.title,
    url: `/docs/${page.id}`,
  })),
};

export function DocsPage() {
  const location = useLocation();
  const currentPath = location.pathname.split('/').pop() || 'getting-started';
  const page = DOCS_PAGES.find((p) => p.id === currentPath) || DOCS_PAGES[0];

  const markdownContent =
    (markdownFiles[`../docs/${page.id}.md`] as string) || '# 404 Not Found\n\nThe requested documentation page could not be found.';

  const contentWithoutH1 = markdownContent.replace(/^#\s+.*$/m, '');

  const navigate = useNavigate();
  const params = useParams();
  
  const router = useMemo(() => ({
    push: (url: string) => navigate(url),
    refresh: () => {},
  }), [navigate]);

  return (
    <FrameworkProvider
      usePathname={() => location.pathname}
      useRouter={() => router}
      useParams={() => params as any}
      Link={({ href, ...props }: any) => <RouterLink to={href || ''} {...props} />}
    >
      <BaseRootProvider>
        <DocsLayout 
          tree={pageTree}
          nav={{
            title: 'ThiruXDB',
            url: '/',
          }}
        >
          <FumaDocsPage toc={[]}>
            <DocsTitle>{page.title}</DocsTitle>
            <DocsBody>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {contentWithoutH1}
              </ReactMarkdown>
            </DocsBody>
          </FumaDocsPage>
        </DocsLayout>
      </BaseRootProvider>
    </FrameworkProvider>
  );
}
