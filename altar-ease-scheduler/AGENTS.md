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

# Notas de desenvolvimento

## Regras da aplicação
- Keep scheduling and liturgical date calculations in a browser-safe pure module, separate from the interface, so distribution rules can be tested independently.
- Persist settings only in browser storage after hydration; the user explicitly requires device-local data, and no backend service is used.
- Keep the three workspace tabs on the index route as views of one scheduling tool, not separate content pages.

## Versionamento
- Never rewrite pushed git history (no force push, rebase, amend or squash of already-pushed commits); keep the branch in a working state.
