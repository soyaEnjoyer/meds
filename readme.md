### Description
I'm making this public to shame myself into doing it.

Self-hosted meds, fitness, and water tracker.  This will be a complete rewrite of my first ever React app, which is quite dated and way beyond refactoring. It's intended to be run on a server (which could just be an old SBC or laptop) in your home, ideally on a private VLAN.

I've barely started right now, but the final project will include a Dockerfile and a `docker:build` script. There will be some kind of native Android notification solution. I currently use [Tasker](https://tasker.joaoapps.com/index.html) and [Termux](https://github.com/termux/termux-app) to run a script for this, but hopefully it will be something a bit less jank.

### Requirements
- [`nvm`](https://www.nvmnode.com/)
- [`pnpm`](https://pnpm.io/)

### Stack
Enthusiastic yes:
- [Drizzle ORM](https://orm.drizzle.team/docs/overview) backed w/ [SQLite](https://sqlite.org/)
- [Tailwind CSS](https://tailwindcss.com/sponsor)
- [Zod](https://zod.dev/) schema validation
- [Tanstack Query](https://tanstack.com/query/latest/docs/framework/react/overview) state management

Probably:
- [Tanstack Start](https://tanstack.com/start/latest/docs/framework/react/overview). I need to stop using anything related to Vercel so I'm trying this. I don't love it so far but hopefully that will change
- [Tanstack Form](https://tanstack.com/form/latest/docs/overview) form management
- [Base UI](https://base-ui.com/) for unstyled UI components

Not sure:
- [Better Auth](https://www.better-auth.com/)