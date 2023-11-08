# coc-isabelle

Because PIDE is not my editor.

## Installation

This plugin (sadly) only works together with [neovim](https://neovim.io) and
[`coc.nvim`](https://github.com/neoclide/coc.nvim). It will probably not be
uploaded to npm, so `:CocInstall coc-isabelle` doesn't work. Instead install it
the "manual" way (requires `yarn` in your path):

```
Plug 'ThreeFx/coc-isabelle', {'do': 'yarn install --frozen-lockfile'}
```

This plugin requires the
[`isabelle-emacs`](https://github.com/m-fleury/isabelle-emacs) fork of
[Isabelle](https://isabelle.in.tum.de).

Syntax highlighting and window layout is provided by
[`isabelle.vim`](https://github.com/ThreeFx/isabelle.vim). Install it using your
favorite (vim) package manager.

If you are looking for a (far less feature-complete) and even more alpha
version, you are invited to use my [earlier Go-based
version](https://github.com/ThreeFx/isabelle-lsp). Note that it is still
neovim-exclusive. I might come back to this at some time, since I honestly
don't like having heavyweight plugin manager for a relatively simple task.

## Configuration

All of this goes in your `coc-settings.json`.

| Name                         | Type     | Default      | Description                                                                                |
|------------------------------|----------|--------------|--------------------------------------------------------------------------------------------|
| `isabelle.enable`            | boolean  | `true`       | En/disables coc-isabelle. Requires a restart if changed                                    |
| `isabelle.command`           | boolean  | `"isabelle"` | The `isabelle` command to invoke.                                                          |
| `isabelle.usePideExtensions` | boolean  | `true`       | Whether to use the VSCode PIDE extensions. This is used for dynamic syntax highlighting.   |
| `isabelle.debug`             | boolean  | `false`      | Produce debug output. The output of the language server can be found under `/tmp/coc-isa`. |
| `isabelle.extraArgs`         | string[] | `[]`         | Additional arguments to pass to the underlying `isabelle` process.                         |
| `isabelle.useHtmlOutput`     | boolean  | `false`      | Whether to use the HTML output in the `-OUTPUT-` buffer                                    |

## License

MIT

---

> This extension was built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
