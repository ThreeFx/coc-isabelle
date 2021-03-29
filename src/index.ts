import {commands, CodeActionProvider, ExtensionContext, LanguageClient, LanguageClientOptions, languages, ProviderResult, ServerOptions, services, window, workspace} from 'coc.nvim';
import {CancellationToken, CodeAction, CodeActionContext, CodeActionKind, Command, Range} from 'vscode-languageserver-protocol';
import {TextDocument} from 'vscode-languageserver-textdocument';

export async function activate(context: ExtensionContext): Promise<void> {
    const config = workspace.getConfiguration('isabelle')
    const isEnabled = config.get<boolean>('enable', true)
    if (!isEnabled) {
        return
    }

    const extraArgs = config.get<string[]>('extraArgs', [])

    if (config.get<boolean>('usePideExtensions', true)) {
        extraArgs.push('-o', 'vscode_pide_extensions')
    }

    if (config.get<boolean>('debug', false)) {
        extraArgs.push('-v', '-L', '/tmp/coc-isa')
    }

    const serverOptions: ServerOptions = {
        command: config.get<string>('command', 'isabelle'),
        args: ['vscode_server'].concat(extraArgs),
    }

    const documentSelector = ['isabelle', 'isabelle-ml']
    const clientOptions: LanguageClientOptions = {
        documentSelector: documentSelector,
        progressOnInitialization: true,
    }

    const client = new LanguageClient(
        'isabelle',
        'Isabelle language server',
        serverOptions,
        clientOptions,
    )

    const isaOutputBufferNr = await workspace.nvim.call('bufnr', ['-OUTPUT-'])
    const isaOutputBuffer = workspace.nvim.createBuffer(parseInt(isaOutputBufferNr))

    const isaStateBuffer = await workspace.nvim.createNewBuffer(false, true)
    isaStateBuffer.setName("-STATE-")

    const isaProgressBufferNr = await workspace.nvim.call('bufnr', ['-PROGRESS-'])
    const isaProgressBuffer = workspace.nvim.createBuffer(parseInt(isaProgressBufferNr))
    const isaProgressBufferWidth = (await workspace.nvim.getVar('isabelle_progress_width') as number) ?? 40
    client.info(`width: ${await workspace.nvim.getVar('isabelle_progress_width')}`)

    const sendCaretUpdate = (file: string) => {
        window.getCursorPosition().then((pos) => {
            client.info(`sending caretupdate: ${file} ${pos.line} ${pos.character}`)
            client.sendNotification('PIDE/caret_update', {uri: 'file://' + file, line: pos.line, character: pos.character})
        })
    }

    let isabelleCodeActionProvider = <CodeActionProvider>{
        provideCodeActions: async (
            document: TextDocument,
            range: Range,
            _context: CodeActionContext,
            _token: CancellationToken
        ): Promise<ProviderResult<(Command | CodeAction)[]>> => {
            client.info('code action provider called')
            if (range.start.line != range.end.line) {
                return null
            }
            const linenr = range.start.line
            var line = await workspace.nvim.line
            let lines = await isaOutputBuffer.getLines({start: 0, end: -1})
            for (const method of ['try0', 'try', 'sledgehammer']) {
                const startcol = line.indexOf(method)
                if (startcol != -1) {
                    for (line of lines) {
                        if (line.startsWith('Try this: ')) {
                            line = line.replace(/Try this: /, '')
                            line = line.replace(/\([0-9]+ ms\)/, '')
                            const action: CodeAction = {
                                title: `Replace ${method} with ${line}`,
                                kind: CodeActionKind.QuickFix,
                                edit: {
                                    documentChanges: [{
                                        textDocument: {
                                            uri: document.uri,
                                            version: null,
                                        },
                                        edits: [{
                                            newText: line,
                                            range: {
                                                start: {line: linenr, character: startcol},
                                                end: {line: linenr, character: startcol + method.length},
                                            },
                                        }],
                                    }],
                                },
                            }
                            return [action]
                        }
                    }
                }
            }

            if (line.includes('proof')) {
                var ind = -1
                for (const [i, l] of lines.entries()) {
                    if (l === 'Proof outline with cases:') {
                        ind = i
                        break
                    }
                }

                if (ind == -1) {
                    return []
                }

                const expr: string = line.replace(/proof *\(([^)]*)\)/, '$1')
                lines.splice(0, ind+1)
                const action: CodeAction = {
                    title: `Insert proof outline for \`${expr}\` `,
                    kind: CodeActionKind.QuickFix,
                    edit: {
                        documentChanges: [{
                            textDocument: {
                                uri: document.uri,
                                version: null,
                            },
                            edits: [{
                                newText: lines.join('\n'),
                                range: {
                                    start: {line: linenr+1, character: 0},
                                    end: {line: linenr+1, character: 0},
                                },
                            }],
                        }],
                    },
                }
                return [action]
            }
        }
    }

    languages.registerCodeActionProvider(
        ['isabelle'],
        isabelleCodeActionProvider,
        'isa-proxy',
        [CodeActionKind.Empty, CodeActionKind.QuickFix],
    )

    // We have to use Set<string> because Range is an object and
    // can only be compared for reference equality
    let highlightCache = new Map<string, Set<string>>()

    client.onReady().then(() => {
        client.onNotification("PIDE/dynamic_output", (params: DynamicOutput) => {
            client.info('got dynamic output')
            isaOutputBuffer.setLines(params.content.split('\n'), {start: 0, end: -1, strictIndexing: false})
        })
        client.onNotification("PIDE/decoration", (params: DecorationParams) => {
            client.sendNotification('PIDE/progress_request', null)
            workspace.nvim.call('bufnr', [params.uri.split('/').pop() ?? '']).then((bufnr) => {
                const buf = workspace.nvim.createBuffer(parseInt(bufnr))
                client.info('got decoration request')
                // Create cached set if it does not exist
                if (!highlightCache.has(params.type)) {
                    highlightCache.set(params.type, new Set<string>())
                }
                const set = highlightCache.get(params.type)!

                if (params.content.length == 0) {
                    buf.clearNamespace(params.type, 0, -1)
                    client.info(`cleared group ${toVimHighlightGroup(params.type)}`)
                } else {
                    let toClear = new Set<string>()
                    let newSet = new Set<string>()
                    let toAdd: Range[] = []
                    for (const x of params.content) {
                        let r = <Range>{
                            start: {line: x.range[0], character: x.range[1]},
                            end: {line: x.range[2], character: x.range[3]},
                        }
                        let rs = `${r.start.line}:${r.start.character}:${r.end.line}:${r.end.character}`

                        newSet.add(rs)
                        if (!set.has(rs)) {
                            toAdd.push(r)
                            toClear.add(`${r.start.line}:${r.end.line}`)
                        }
                    }
                    highlightCache.set(params.type, newSet)

                    const stillHighlighted: string[] = [...set].filter(range => !newSet.has(range))
                    for (const range of stillHighlighted) {
                        let [start, _startcol, end, _endcol] = range.split(':')
                        toClear.add(`${start}:${end}`)
                    }

                    for (const range of toClear) {
                        let [start, end] = range.split(':')
                        let nvim_start = parseInt(start)
                        let nvim_end = parseInt(end) + 1  // end is exclusive
                        buf.clearNamespace(params.type, nvim_start, nvim_end)
                    }

                    buf.highlightRanges(
                        params.type,
                        // TODO: define sensible colors
                        // TODO: find out how to package the syntax.vim file
                        toVimHighlightGroup(params.type),
                        toAdd,
                    )
                    client.info(`highlighted with: ${toVimHighlightGroup(params.type)}`)
                }
            })
        })
        client.onNotification("PIDE/progress", (params: Progress) => {
            client.info('got dynamic output')
            var lines: string[] = []
            var errorRanges: Range[] = []
            var doneRanges: Range[] = []
            for (const [i, dict] of params['nodes-status'].entries()) {
                // TODO: prettify
                const name = dict.name.split(/[\\/]/).pop()?.split('.')[0] ?? 'undefined'
                lines.push(name)
                const processed = dict.finished + dict.warned
                const total = processed + dict.unprocessed + dict.running + dict.failed
                const width = isaProgressBufferWidth - 8
                const numDone = Math.floor(processed * width / total)
                const numOther = width - numDone
                lines.push(` [${'#'.repeat(numDone)}${' '.repeat(numOther)}] `)
                let curline = 2*i

                if (dict.failed > 0) {
                    errorRanges.push({
                        start: {
                            line: curline,
                            character: 0,
                        },
                        end: {
                            line: curline+2,
                            character: 0,
                        }
                    })
                } else if (processed == total) {
                    doneRanges.push({
                        start: {
                            line: curline,
                            character: 0,
                        },
                        end: {
                            line: curline+2,
                            character: 0,
                        }
                    })
                }
            }
            isaProgressBuffer.setLines(lines, {start: 0, end: -1})
            isaProgressBuffer.highlightRanges('-PROGRESS-', 'CocListFgRed', errorRanges)
            isaProgressBuffer.highlightRanges('-PROGRESS-', 'CocListFgGreen', doneRanges)
        })
        workspace.registerAutocmd({
            event: 'CursorMoved',
            pattern: "*.thy",
            arglist: [`expand('%:p')`],
            callback: sendCaretUpdate,
        })
        workspace.registerAutocmd({
            event: 'CursorMovedI',
            pattern: "*.thy",
            arglist: [`expand('%:p')`],
            callback: sendCaretUpdate,
        })
        workspace.registerAutocmd({
            event: 'CursorHold',
            pattern: "*.thy",
            callback: () => client.sendNotification('PIDE/progress_request', null),
        })
        workspace.document.then((doc) => doc.buffer.name.then((name) => sendCaretUpdate(name)))
    })

    context.subscriptions.push(
        commands.registerCommand('isabelle.showOutput', () =>
            workspace.nvim.command('wincmd j|b -OUTPUT-|wincmd k'),
        ),
        commands.registerCommand('isabelle.showState', () =>
            workspace.nvim.command('wincmd j|b -STATE-|wincmd k'),
        ),
        commands.registerCommand('isabelle.showProgress', () =>
            workspace.nvim.command('wincmd j|b -PROGRESS-|wincmd k'),
        ),

        commands.registerCommand('isabelle.progressRequest', () =>
            client.sendNotification('PIDE/progress_request', null)
        ),
        services.registLanguageClient(client),
    )
}

function toVimHighlightGroup(isaHighlightGroup: string): string {
    return 'IsaDecoration' + isaHighlightGroup
        .replace(/^[a-z]/, letter => letter.toUpperCase())
        .replace(/_[a-z]/g, letter => letter.toUpperCase())
        .replace('_', '')
}
