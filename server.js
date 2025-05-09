const { createConnection, ProposedFeatures, TextDocuments } = require('vscode-languageserver/node');
const { TextDocument } = require('vscode-languageserver-textdocument');

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager
const documents = new TextDocuments(TextDocument);

// Handle the initialization request

connection.onInitialize(() => {
    return {
        capabilities: {
            textDocumentSync: documents.syncKind,
            hoverProvider: true,
            documentSymbolProvider: true, // Enable document symbol support
        }
    };
});
// Handle hover requests
connection.onHover((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return null;
    }

    const text = document.getText();
    const lines = text.split('\n');
    const line = lines[params.position.line];

    // Find the word under the cursor
    const wordRange = getWordRangeAtPosition(line, params.position.character);
    if (!wordRange) {
        return null;
    }

    const word = line.substring(wordRange.start, wordRange.end);

    // Match SWIG directives
    if (word.startsWith('%')) {
        const directive = word.substring(1); // Remove the '%' prefix
        const hoverText = getHoverTextForDirective(directive);
        if (hoverText) {
            return {
                contents: { kind: 'markdown', value: hoverText }
            };
        }
    }

    return null;
});

// Helper function to get the range of the word under the cursor
function getWordRangeAtPosition(line, character) {
    const regex = /%?\w+/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
        if (character >= match.index && character <= match.index + match[0].length) {
            return { start: match.index, end: match.index + match[0].length };
        }
    }
    return null;
}

connection.onDocumentSymbol((params) => {
    const document = documents.get(params.textDocument.uri);
    if (!document) return [];

    const text = document.getText();
    const lines = text.split('\n');
    const symbols = [];

    lines.forEach((line, index) => {
        const tokens = line.trim().split(/\s+/);
        const keyword = tokens[0];
        const nextWord = tokens[1] || ''; // Get the next word after the keyword

        const keywordToSymbol = {
            '%module': { name: 'Module', kind: 2 }, // Module
            '%include': { name: 'Include', kind: 14 }, // File
            '%define': { name: 'Define', kind: 5 }, // Macro
            '%typemap': { name: 'Typemap', kind: 6 }, // Typemap
            '%pragma': { name: 'Pragma', kind: 15 }, // Instruction
            '%extend': { name: 'Extend', kind: 7 }, // Class
            '%apply': { name: 'Apply', kind: 8 }, // Typemap Application
            '%exception': { name: 'Exception', kind: 9 }, // Exception Handling
            '%feature': { name: 'Feature', kind: 10 }, // Feature
            '%rename': { name: 'Rename', kind: 11 }, // Rename
            '%ignore': { name: 'Ignore', kind: 12 }, // Ignore
            '%template': { name: 'Template', kind: 3 }, // Template
            '%insert': { name: 'Insert', kind: 13 }, // Code Insertion
            '%warn': { name: 'Warn', kind: 16 }, // Warning
            '%newobject': { name: 'NewObject', kind: 17 }, // New Object
            '%shared_ptr': { name: 'SharedPtr', kind: 18 }, // Shared Pointer
        };

        if (keywordToSymbol[keyword]) {
            symbols.push({
                name: `${keywordToSymbol[keyword].name} ${nextWord}`, // Include the next word in the symbol name
                kind: keywordToSymbol[keyword].kind,
                location: {
                    uri: params.textDocument.uri,
                    range: {
                        start: { line: index, character: 0 },
                        end: { line: index, character: line.length }
                    }
                }
            });
        }
    });

    return symbols;
});

// Provide hover text for SWIG directives
function getHoverTextForDirective(directive) {
    const directiveDocumentation = {
        'module': 'Defines the name of the module being generated. This directive is used to specify the name of the module that SWIG will generate for the target language. The module name is typically used as the name of the generated wrapper file or library.\n\nExample:\n```swig\n%module example\n```',
        'include': 'Includes another SWIG interface file or header file. This directive allows you to include additional SWIG interface files or C/C++ header files into the current interface file. It is similar to the `#include` directive in C/C++.\n\nExample:\n```swig\n%include "header.h"\n```',
        'define': 'Defines a macro or reusable block of code. This directive is used to define reusable blocks of code or macros that can be used throughout the SWIG interface file. It is often paired with `%enddef` to mark the end of the definition.\n\nExample:\n```swig\n%define MY_MACRO\n  int x;\n%enddef\n```',
        'typemap': 'Specifies how data is converted between C/C++ and the target language. Typemaps are a powerful feature in SWIG that allow you to customize how data is marshaled between C/C++ and the target language. They can be applied to function arguments, return values, and variables.\n\nExample:\n```swig\n%typemap(in) int {\n  $1 = atoi($input);\n}\n```',
        'pragma': 'Provides additional instructions to the SWIG compiler. Pragmas are used to give special instructions to the SWIG compiler for specific target languages or to customize the generated code.\n\nExample:\n```swig\n%pragma(java) jniclasscode "public void customMethod() {}"\n```',
        'extend': 'Adds additional methods or functionality to a class or type. This directive allows you to extend existing C++ classes or types by adding new methods or functionality that will be available in the target language.\n\nExample:\n```swig\n%extend MyClass {\n  int newMethod() { return 42; }\n}\n```',
        'apply': 'Applies a typemap to a specific type or set of types. This directive is used to apply a previously defined typemap to specific types or function arguments.\n\nExample:\n```swig\n%apply int *OUTPUT { int *result };\n```',
        'exception': 'Specifies how exceptions are handled in the target language. This directive allows you to define custom exception handling logic for functions or methods wrapped by SWIG.\n\nExample:\n```swig\n%exception {\n  try {\n    $function\n  } catch (std::exception &e) {\n    SWIG_exception(SWIG_RuntimeError, e.what());\n  }\n}\n```',
        'feature': 'Enables or disables specific SWIG features. This directive is used to enable or disable specific features in SWIG, such as director support or custom behaviors for classes and methods.\n\nExample:\n```swig\n%feature("director") MyClass;\n```',
        'rename': 'Renames a function, variable, or type in the target language. This directive allows you to change the name of a function, variable, or type in the generated wrapper code.\n\nExample:\n```swig\n%rename(newName) oldName;\n```',
        'ignore': 'Ignores a function, variable, or type during wrapping. This directive is used to exclude specific functions, variables, or types from being wrapped by SWIG.\n\nExample:\n```swig\n%ignore MyClass::ignoredMethod;\n```',
        'template': 'Generates wrappers for C++ templates. This directive is used to explicitly instantiate C++ templates and generate wrappers for them in the target language.\n\nExample:\n```swig\n%template(VectorInt) std::vector<int>;\n```',
        'insert': 'Inserts custom code into the generated wrapper. This directive allows you to insert custom code into specific sections of the generated wrapper file, such as headers or implementation files.\n\nExample:\n```swig\n%insert("header") {\n  #include <custom_header.h>\n}\n```',
        'warn': 'Generates a warning during SWIG processing. This directive is used to issue custom warnings during the SWIG compilation process, which can help identify potential issues or provide additional information.\n\nExample:\n```swig\n%warnfilter(321) "Custom warning message";\n```',
        'newobject': 'Indicates that a function returns a newly allocated object. This directive is used to inform SWIG that a function returns a new object that requires memory management in the target language.\n\nExample:\n```swig\n%newobject MyClass::createInstance;\n```',
        'shared_ptr': 'Specifies that a type uses `std::shared_ptr` for memory management. This directive is used to indicate that a class or type should use `std::shared_ptr` for memory management in the generated wrapper code.\n\nExample:\n```swig\n%shared_ptr(MyClass);\n```',
    };

    return directiveDocumentation[directive] || null;
}

// Make the text document manager listen on the connection
documents.listen(connection);

// Listen on the connection
connection.listen();