import * as vscode from 'vscode';
import { validateTextDocument } from './plugin';
import { SwigParser } from './SwigParser'; // Import SwigParser from the appropriate module
import { TextDocument } from 'vscode-languageserver-textdocument';
import { SwigLanguageServer } from './SwigLanguageServer';


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
// Register the 'swig lint' command
const lintCommand = vscode.commands.registerCommand('swig-language-server.helloWorld', async () => {
	const editor = vscode.window.activeTextEditor;
	if (editor) {
		const document = editor.document;
		if (document.languageId === 'swig') {
			vscode.window.showInformationMessage(`Linting file: ${document.fileName}`);
      const parser = new SwigParser();
      // const tokens = parser.tokenize(document.getText());
      const parsedDocument = parser.parse(document.getText());
      console.log("will display results now"); // Output the parsed document
      // console.log(parsedDocument); // Output the parsed document
      // console.log(parsedDocument.getAllTokens()); // Output: ["const std::string& {std::string* }"]
		} else {
			vscode.window.showErrorMessage('The active file is not a Swig file.');
		}
	} else {
		vscode.window.showErrorMessage('No active editor found.');
	}
});

context.subscriptions.push(lintCommand);

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
}
export function deactivate() {
  // Clean up resources if needed
  console.log('Swig Language Server is deactivating...');
}