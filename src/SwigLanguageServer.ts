import * as vscode from 'vscode';
import * as vscodeTextmate from 'vscode-textmate';
import * as fs from 'fs';
import * as path from 'path';
import { loadWASM, OnigScanner, OnigString } from 'vscode-oniguruma';

interface ExtendedToken extends vscodeTextmate.IToken {
    line: number;
    type: number;
}

class SwigLanguageServer {
    private grammar: vscodeTextmate.IGrammar | null = null;
    private grammarLoaded: Promise<void>;

    constructor() {
        this.grammarLoaded = this.loadGrammar();
    }

    private async loadGrammar(): Promise<void> {
        const wasmPath = path.resolve(__dirname, '../node_modules/vscode-oniguruma/release/onig.wasm');

        // Ensure the WASM file exists
        if (!fs.existsSync(wasmPath)) {
            throw new Error(`WASM file not found at ${wasmPath}`);
        }

        // Load the WASM file
        const wasmBuffer = fs.readFileSync(wasmPath);
        await loadWASM(wasmBuffer);

        const grammarPath = path.resolve(__dirname, '../swig.tmLanguage.json');

        // Ensure the grammar file exists
        if (!fs.existsSync(grammarPath)) {
            throw new Error(`Grammar file not found at ${grammarPath}`);
        }

        const grammarContent = fs.readFileSync(grammarPath, 'utf-8');

        const registry = new vscodeTextmate.Registry({
            onigLib: Promise.resolve({
                createOnigScanner: (sources) => new OnigScanner(sources),
                createOnigString: (str) => new OnigString(str),
            }),
            loadGrammar: () => Promise.resolve(JSON.parse(grammarContent)),
        });

        this.grammar = await registry.loadGrammar('source.swig');
    }

    
    public async tokenizeDocument(document: vscode.TextDocument): Promise<ExtendedToken[]> {
        await this.grammarLoaded; // Ensure grammar is loaded

        if (!this.grammar) {
            throw new Error('Grammar not loaded');
        }

        const lines = document.getText().split('\n');

        const tokens: ExtendedToken[] = [];

        lines.forEach((line, lineNumber) => {
            const lineTokens = this.grammar!.tokenizeLine(line, null).tokens;
            lineTokens.forEach((token) => {
                tokens.push({
                    ...token,
                    line: lineNumber,
                    type: token.scopes.length, // Use the number of scopes as the type
                } as ExtendedToken);
            });
        });

        return tokens;
    }
}

export { SwigLanguageServer };