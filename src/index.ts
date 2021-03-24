import {commands, CodeActionProvider, ExtensionContext, LanguageClient, LanguageClientOptions, languages, ProviderResult, ServerOptions, services, window, workspace} from 'coc.nvim';
import {CancellationToken, CodeAction, CodeActionContext, CodeActionKind, Command, Range} from 'vscode-languageserver-protocol';
import {TextDocument} from 'vscode-languageserver-textdocument';

export async function activate(context: ExtensionContext): Promise<void> {
    const config = workspace.getConfiguration('isabelle')
    const isEnabled = config.get<boolean>('enable', true)
    if (!isEnabled) {
        return
    }

    const serverOptions: ServerOptions = {
        command: 'isabelle',
        args: ['vscode_server', '-v', '-L', '/tmp/coc-isa'],
    }

    const clientOptions: LanguageClientOptions = {
        documentSelector: ['isabelle'],
        progressOnInitialization: true,
    }

    const client = new LanguageClient(
        'isabelle',
        'Isabelle language server',
        serverOptions,
        clientOptions,
    )
    const defaultHandler = client.onNotification

    const isaBuffer = await workspace.nvim.createNewBuffer(false, true)
    isaBuffer.setName("isabelle-output")

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
                            isaBuffer.getLines({start: 0, end: -1}).then((lines) => {
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
        client.onNotification("PIDE/dynamic_output", (params) => {
            client.info('got dynamic output')
            isaBuffer.setLines(params.content.split('\n'), {start: 0, end: -1, strictIndexing: false})
            defaultHandler("PIDE/dynamic_output", params)
        })
        workspace.registerAutocmd({
            event: 'CursorMoved',
            request: true,
            pattern: "*.thy",
            arglist: ['bufname("%")'],
            callback: sendCaretUpdate,
        })
        workspace.registerAutocmd({
            event: 'CursorMovedI',
            request: true,
            pattern: "*.thy",
            arglist: ['bufname("%")'],
            callback: sendCaretUpdate,
        })
        workspace.document.then((doc) => doc.buffer.name.then((name) => sendCaretUpdate(name)))
    })

    context.subscriptions.push(
        commands.registerCommand('isabelle.openOutput', () => {
            workspace.nvim.command('vsplit').then(() => {
                workspace.nvim.setBuffer(isaBuffer).then(() => {
                    workspace.nvim.input('Lh')
                })
            })
        }),
        services.registLanguageClient(client),
    )
}
