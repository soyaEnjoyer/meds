import type { NotFoundRouteProps } from '@tanstack/react-router';
import { createRouter } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

function NotFound(props: NotFoundRouteProps) {
  console.log('not found', props);
  return null;
}

export function getRouter() {
  const router = createRouter({
    defaultNotFoundComponent: NotFound,
    defaultViewTransition: true,
    routeTree,
    scrollRestoration: true,
  });

  return router;
}
