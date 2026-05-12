import { createRouter } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

export function getRouter() {
  const router = createRouter({
    defaultViewTransition: true,
    routeTree,
    scrollRestoration: false,
  });

  return router;
}
