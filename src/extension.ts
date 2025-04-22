import * as vscode from 'vscode';
import { validateTextDocument } from './plugin';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { SwigLanguageServer } from './SwigLanguageServer';
import { LanguageClientOptions } from 'vscode-languageclient';
import { LanguageClient } from 'vscode-languageclient/node';
import { TransportKind } from 'vscode-languageclient/node';
import { ServerOptions } from 'vscode-languageclient/node';


export function activate(context: vscode.ExtensionContext) {
  // Register the linter plugin
  context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider(
    { language: 'swig', scheme: 'file' },
    {
      provideDocumentSemanticTokens(document) {
        return null; // Replace with actual token provider logic if needed
      }
    },
    new vscode.SemanticTokensLegend(['type'], ['modifier'])
  ));

  // Set up the language configuration
  context.subscriptions.push(vscode.languages.setLanguageConfiguration('swig', {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/']
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
      ['%{','%}']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
      { open: "%{", close: "%}" }
    ],
  }));

  // Set up the indentation rules
  context.subscriptions.push(vscode.languages.setLanguageConfiguration('swig', {
    indentationRules: {
      increaseIndentPattern: /^.*\{[^}]*$/,
      decreaseIndentPattern: /^.*\}$/,
      indentNextLinePattern: /^.*\{[^}]*$/,
      unIndentedLinePattern: /^.*\}$/
    }
  }));

  // Set up the onEnter rules
  context.subscriptions.push(vscode.languages.setLanguageConfiguration('swig', {
    onEnterRules: [
      {
        beforeText: /\b(if|else|for|while|switch|case|default)\b/,
        afterText: /\b(if|else|for|while|switch|case|default)\b/,
        action: {
          indentAction: vscode.IndentAction.Indent,
          appendText: ' ',
          removeText: 0
        }
      }
    ]
  }));

const fileLint = vscode.commands.registerCommand('swig-language-server.swigValidate', async () => {
  
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const document = editor.document;
    vscode.window.showInformationMessage(`Linting SWIG interface file: ${document.fileName}`);
    if (document.languageId === 'swig') {
      const convertedDocument = TextDocument.create(
        document.uri.toString(),
        document.languageId,
        document.version,
        document.getText()
      );
      const rawResults: vscode.Diagnostic[] = await validateTextDocument(convertedDocument);
      const results = rawResults.map((diagnostic) => ({
        messages: [{
          message: diagnostic.message,
          line: diagnostic.range.start.line,
          column: diagnostic.range.start.character
        }]
      }));
      results.forEach((result) => {
        result.messages.forEach((message) => {
          vscode.window.showErrorMessage(`${message.message} (Line: ${message.line}, Column: ${message.column})`);
        });
      });
    } else {
      vscode.window.showErrorMessage('The active file is not a SWIG file.');
    }
  } else {
    vscode.window.showErrorMessage('No active editor found.');
  }
});

context.subscriptions.push(fileLint);

const server = new SwigLanguageServer();

    // Listen for document open events
    vscode.workspace.onDidOpenTextDocument(async (document) => {
        if (document.languageId === 'swig') {
            const tokens = await server.tokenizeDocument(document);
            console.log('Tokens:', tokens);
            const outputChannel = vscode.window.createOutputChannel('Tokenized Tokens');
            outputChannel.appendLine('Tokens:');
            tokens.forEach(token => outputChannel.appendLine(JSON.stringify(token)));
            outputChannel.show();
        }
    });

    // Listen for document change events
    vscode.workspace.onDidChangeTextDocument((event) => {
        const document = event.document;
        if (document.languageId === 'swig') {
            const tokens = server.tokenizeDocument(document);
            console.log('Updated Tokens:', tokens);
        }
    });

    // Register a command to manually tokenize the current document
    const disposable = vscode.commands.registerCommand('swig-language-server.tokenize', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document.languageId === 'swig') {
            const tokens = await server.tokenizeDocument(editor.document);
            vscode.window.showInformationMessage(`Tokenized ${tokens.length} tokens.`);
            const outputChannel = vscode.window.createOutputChannel('Tokenized Tokens');
            outputChannel.appendLine('Tokens:');
            (await tokens).forEach(token => outputChannel.appendLine(JSON.stringify(token)));
            outputChannel.show();

        } else {
            vscode.window.showErrorMessage('No active SWIG file to tokenize.');
        }
    });

    context.subscriptions.push(disposable);
    const serverOptions: ServerOptions = {
      run: { module: context.asAbsolutePath('server.js'), transport: TransportKind.ipc },
      debug: { module: context.asAbsolutePath('server.js'), transport: TransportKind.ipc, options: { execArgv: ['--nolazy', '--inspect=6009'] } }
    };

    const clientOptions: LanguageClientOptions = {
      documentSelector: [{ scheme: 'file', language: 'swig' }],
      synchronize: {
        fileEvents: vscode.workspace.createFileSystemWatcher('**/*.swig')
      }
    };

    const client = new LanguageClient(
      'swigLanguageServer',
      'Swig Language Server',
      serverOptions,
      clientOptions
    );

    context.subscriptions.push({
        dispose: () => {
            if (client && client.needsStop()) {
                client.stop();
            }
        }
    });
    try {
      client.start();
    } catch (error) {
        if (error instanceof Error) {
            vscode.window.showErrorMessage(`Failed to start Swig Language Server: ${error.message}`);
        } else {
            vscode.window.showErrorMessage('Failed to start Swig Language Server: Unknown error');
        }
        console.error('Swig Language Server start error:', error);
    }
}
export function deactivate() {
  // Clean up resources if needed
  console.log('Swig Language Server is deactivating...');
}