import * as vscode from 'vscode';

class SwigParser {
    tokenize(text: string): Token[] {
        const lexer = new Lexer(text);
        const tokens: Token[] = [];
        let token: Token | null;

        while ((token = lexer.nextToken()) !== null) {
            tokens.push(token);
        }

        return tokens;
    }

    parse(text: string): ParsedDocument {
        const tokens = this.tokenize(text);
        const parsedDocument = new ParsedDocument();

        tokens.forEach((token) => {
            parsedDocument.addToken(token);
        });

        return parsedDocument;
    }

    getTokenAtPosition(document: vscode.TextDocument, position: vscode.Position): Token | null {
        const tokens = this.tokenize(document.getText());
        return tokens.find((token) => token.range.contains(position)) || null;
    }
}

class Lexer {
    private text: string;
    private position: number;

    constructor(text: string) {
        this.text = text;
        this.position = 0;
    }

    nextToken(): Token | null {
        const token = this.matchToken();
        if (token === null) {
            this.position++; // Move position forward to avoid infinite loop
            if (this.position >= this.text.length) {
                return null; // End of text reached
            }
            return this.nextToken(); // Retry for the next character
        }

        this.position += token.length;
        return token;
    }

    private matchToken(): Token | null {
        const text = this.text.substring(this.position);

        // Define token patterns in order of priority
        const tokenPatterns: { regex: RegExp; type: string }[] = [
            { regex: /^(%module)/, type: 'module' },
            { regex: /^(%include)/, type: 'include' },
            { regex: /^(%apply)/, type: 'apply' },
            { regex: /^(%template)/, type: 'template' },
            { regex: /^(%rename)/, type: 'rename' },
            { regex: /^(%ignore)/, type: 'ignore' },
            { regex: /^(%extend)/, type: 'extend' },
            { regex: /^(%pragma)/, type: 'pragma' },
            { regex: /^(%typemap)/, type: 'typemap' },
            { regex: /^(%exception)/, type: 'exception' },
            { regex: /^(%feature)/, type: 'feature' },
            { regex: /^(%shared_ptr)/, type: 'shared_ptr' },
            { regex: /^(%newobject)/, type: 'newobject' },
            { regex: /^(%\{)/, type: 'codeblock' },
            { regex: /^(%\})/, type: 'endcodeblock' },
            { regex: /^#include\s+("[^"]+"|<[^>]+>)/, type: 'include_directive' },
            { regex: /^\/\/.*/, type: 'comment_line' },
            { regex: /^\/\*[\s\S]*?\*\//, type: 'comment_block' },
            { regex: /^(\w+)/, type: 'identifier' },
            { regex: /^(\d+)/, type: 'literal' },
            { regex: /^(\W)/, type: 'symbol' },
        ];

        for (const { regex, type } of tokenPatterns) {
            const match = text.match(regex);
            if (match) {
                return new Token(type, match[0], this.position, match[0].length);
            }
        }

        return null; // No match found
    }
}

class Token {
    public type: string;
    public value: string;
    public range: vscode.Range;
    public length: number;

    constructor(type: string, value: string, start: number, length: number) {
        this.type = type;
        this.value = value;
        this.range = new vscode.Range(start, start + length, start, start + length);
        this.length = length;
    }
}

class ParsedDocument {
    private tokensByType: Map<string, Token[]>;

    constructor() {
        this.tokensByType = new Map<string, Token[]>();
    }

    addToken(token: Token): void {
        if (!this.tokensByType.has(token.type)) {
            this.tokensByType.set(token.type, []);
        }
        this.tokensByType.get(token.type)!.push(token);
    }

    getTokensByType(type: string): Token[] {
        return this.tokensByType.get(type) || [];
    }

    getAllTokens(): Token[] {
        return Array.from(this.tokensByType.values()).flat();
    }
}

export { SwigParser, Token, ParsedDocument };