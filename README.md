# coc-isabelle

Because PIDE is not my editor.

## Install

This plugin (sadly) only works together with [neovim](https://neovim.io) and
[`coc.nvim`](https://github.com/neoclide/coc.nvim). Install it using
`:CocInstall coc-isabelle` as usual.

Syntax highlighting and window layout is provided by
[`isabelle.vim`](https://github.com/ThreeFx/isabelle.vim). Install it using your
favorite (vim) package manager.

If you are looking for a (far less feature-complete) and even more alpha
version, you are invited to use my [earlier Go-based
version](https://github.com/ThreeFx/isabelle-lsp). Note that it is still
neovim-exclusive.

## Configuration

|Name|Type|Default|Description|
|----|----|-------|-----------|
| `isabelle.enable` | boolean | `true` | En/disables coc-isabelle. Requires a restart if changed |
| `isabelle.command` | boolean | `"isabelle"` | The `isabelle` command to invoke. |
| `isabelle.openWindowAtStartup` | boolean | `true` | Whether to open the window at startup. |
| `isabelle.usePideExtensions` | boolean | `true` | Whether to use the VSCode PIDE extensions. This is used for dynamic syntax highlighting. |
| `isabelle.debug` | boolean | `false` | Produce debug output. The output of the language server can be found under `/tmp/coc-isa`. |
| `isabelle.extraArgs` | string[] | `[]` | Additional arguments to pass to the underlying `isabelle` process. |

## License

MIT

---

> This extension was built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
