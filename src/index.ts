import {commands, CodeActionProvider, ExtensionContext, LanguageClient, LanguageClientOptions, languages, ProviderResult, ServerOptions, services, window, workspace} from 'coc.nvim';
import {CancellationToken, CodeAction, CodeActionContext, CodeActionKind, Command, Range} from 'vscode-languageserver-protocol';
import {TextDocument} from 'vscode-languageserver-textdocument';

interface DynamicOutput {
    content: string,
}

interface TheoryProgress {
    finished: number,
    failed: number,
    consolidated: boolean,
    canceled: boolean,
    terminated: boolean,
    warned: number,
    name: string,
    unprocessed: number,
    initialized: boolean,
    running: number,
}

interface Progress {
    'nodes-status': TheoryProgress[]
}

export async function activate(context: ExtensionContext): Promise<void> {
    const config = workspace.getConfiguration('isabelle')
    const isEnabled = config.get<boolean>('enable', true)
    if (!isEnabled) {
        return
    }

    const extraArgs = config.get<string[]>('extraArgs', [])
    const serverOptions: ServerOptions = {
        command: '/home/bfiedler/programming/isabelle-release/bin/isabelle',
        args: ['vscode_server', '-v', '-L', '/tmp/coc-isa', '-o', 'vscode_pide_extensions'].concat(extraArgs),
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

    const isaOutputBuffer = await workspace.nvim.createNewBuffer(false, true)
    isaOutputBuffer.setName("isabelle-output")

    const isaStateBuffer = await workspace.nvim.createNewBuffer(false, true)
    isaStateBuffer.setName("isabelle-state")

    const isaProgressBuffer = await workspace.nvim.createNewBuffer(false, true)
    isaProgressBuffer.setName("isabelle-progress")

    const sendCaretUpdate = (file: string) => {
        window.getCursorPosition().then((pos) => {
            client.info(`sending caretupdate: ${file} ${pos.line} ${pos.character}`)
            client.sendNotification('PIDE/caret_update', {uri: 'file://' + file, line: pos.line, character: pos.character})
        })
    }

    let isabelleCodeActionProvider = <CodeActionProvider>{
        provideCodeActions: (
            document: TextDocument,
            range: Range,
            _context: CodeActionContext,
            _token: CancellationToken
        ): ProviderResult<(Command | CodeAction)[]> => {
            client.info('code action provider called')
            if (range.start.line != range.end.line) {
                return null
            }
            const linenr = range.start.line
            return new Promise<(Command | CodeAction)[]>(resolve => {
                workspace.nvim.line.then(line => {
                    for (const method of ['try0', 'try', 'sledgehammer']) {
                        const startcol = line.indexOf(method)
                        if (startcol != -1) {
                            isaOutputBuffer.getLines({start: 0, end: -1}).then((lines) => {
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
                                        resolve([action])
                                    }
                                }
                            })
                        }
                    }
                })
            })
        }
    }

    languages.registerCodeActionProvider(
        ['isabelle'],
        isabelleCodeActionProvider,
        'isa-proxy',
        [CodeActionKind.Empty, CodeActionKind.QuickFix],
    )

    client.onReady().then(() => {
        client.onNotification("PIDE/dynamic_output", (params: DynamicOutput) => {
            client.info('got dynamic output')
            isaOutputBuffer.setLines(params.content.split('\n'), {start: 0, end: -1, strictIndexing: false})
        })
        client.onNotification("PIDE/progress", (params: Progress) => {
            client.info('got dynamic output')
            var lines: string[] = []
            for (const dict of params['nodes-status']) {
                // TODO: prettify
                lines.push(dict.name)
                const processed = dict.finished + dict.warned
                const total = processed + dict.unprocessed + dict.running + dict.failed
                lines.push(`progess: ${processed}/${total}`)
                lines.push(`failed: ${dict.failed}`)
                lines.push(`running: ${dict.running}`)
                lines.push('')
            }
            isaProgressBuffer.setLines(lines, {start: 0, end: -1})
        })
        workspace.registerAutocmd({
            event: 'CursorMoved',
            request: true,
            pattern: "*.thy",
            arglist: [`expand('%:p')`],
            callback: sendCaretUpdate,
        })
        workspace.registerAutocmd({
            event: 'CursorMovedI',
            request: true,
            pattern: "*.thy",
            arglist: [`expand('%:p')`],
            callback: sendCaretUpdate,
        })
        workspace.document.then((doc) => doc.buffer.name.then((name) => sendCaretUpdate(name)))
    })

    context.subscriptions.push(
        commands.registerCommand('isabelle.showOutput', () =>
            workspace.nvim.setBuffer(isaOutputBuffer)
        ),
        commands.registerCommand('isabelle.showState', () =>
            workspace.nvim.setBuffer(isaStateBuffer)
        ),
        commands.registerCommand('isabelle.showProgress', () =>
            workspace.nvim.setBuffer(isaProgressBuffer)
        ),
        commands.registerCommand('isabelle.openWindows', () =>
            workspace.nvim.command('vsplit').then(() =>
                workspace.nvim.setBuffer(isaProgressBuffer).then(() =>
                    workspace.nvim.command('split').then(() =>
                        workspace.nvim.setBuffer(isaOutputBuffer).then(() =>
                            workspace.nvim.command('split').then(() =>
                                workspace.nvim.setBuffer(isaStateBuffer).then(() =>
                                    workspace.nvim.input('lH')))))))),

        commands.registerCommand('isabelle.progressRequest', () =>
            client.sendNotification('PIDE/progress_request', null)
        ),
        services.registLanguageClient(client),
    )
}
