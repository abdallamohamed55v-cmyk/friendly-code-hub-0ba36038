<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Docs auto-discovery rule

The `/docs` page auto-discovers every file under `src/pages/**` and
`supabase/functions/*/index.ts` via `src/lib/docsRegistry.ts`. Any new page,
edge function, integration, slides template, or skill MUST start with a
`/** @doc Short, human-friendly description. */` comment at the very top
so it appears in the docs with a real description.

Files without a `@doc` tag still appear (with a humanized filename fallback)
so nothing silently disappears, but a real description is required for any
user-facing surface.
