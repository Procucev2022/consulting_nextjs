/**
 * Navigation methods used by page-level code. The Next.js App Router satisfies this shape, and so does the
 * window.location fallback that pages use when the router hook is unavailable.
 */
export interface AppRouterLike {
  push: (url: string) => void;
  replace: (url: string) => void;
}
