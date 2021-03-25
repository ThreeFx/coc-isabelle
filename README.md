# coc-isabelle

Because PIDE is not my editor.

## Install

This plugin (sadly) only works together with [neovim](https://neovim.io) and
[`coc.nvim`](https://github.com/neoclide/coc.nvim). Install it using
`:CocInstall coc-isabelle` as usual.

If you are looking for a (far less feature-complete) and even more alpha
version, you are invited to use my [earlier Go-based
version](https://github.com/ThreeFx/isabelle-lsp). Note that it is still
neovim-exclusive.

## Configuration

|Name|Type|Description|
|----|----|-----------|
| `isabelle.enable` | boolean | En/disables coc-isabelle. Requires a restart if changed |
| `isabelle.usePideExtensions` | boolean | Whether to use the VSCode PIDE extensions. This is used mainly to get good syntax highlighting of ML code. |
| `isabelle.debug` | boolean | Produce debug output. The output of the language server can be found under `/tmp/coc-isa`. |
| `isabelle.extraArgs` | string[] | Additional arguments to pass to the underlying `isabelle` process. |

## Commands

|Name|Description|
|----|-----------|
| `isabelle.openOutput` | Opens the isabelle output window. |


## License

MIT

---

> This extension was built with [create-coc-extension](https://github.com/fannheyward/create-coc-extension)
