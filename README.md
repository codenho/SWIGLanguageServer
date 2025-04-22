# swig-language-server README

The `swig-language-server` extension provides a language server for SWIG interface files, offering essential tools to enhance your development experience. It includes a linter, syntax highlighting, code completion, and other features for `.i` or `.swig` files.

## Features

This extension provides the following features for SWIG interface files:

### Language Server
- **Code Completion**: Provides autocompletion for SWIG directives like `%module`, `%include`, `%typemap`, and more.
- **Hover Information**: Displays documentation for SWIG directives (e.g., `%module`, `%include`) when hovering over them.
- **Document Symbols**: Displays an outline of the SWIG file, including modules, includes, and typedefs.
- **Folding Ranges**: Supports folding for `%{ ... %}` blocks and multi-line comments.

### Linter
- **Diagnostics**: Highlights potential issues in your SWIG interface files, such as:
  - Unmatched `%{` and `%}` blocks.
  - Missing semicolons for non-block directives.
  - Unsupported data types like `long double`.
  - Incorrect usage of SWIG directives like `%rename` or `%apply`.
- **Real-Time Validation**: Automatically validates SWIG files when they are opened or edited.

### Syntax Highlighting
- **SWIG-Specific Constructs**: Highlights SWIG directives like `%module`, `%include`, `%typemap`, and more.

### Semantic Tokens
- **Tokenization**: Tokenizes SWIG files and provides semantic tokens for better syntax understanding.
- **Custom Scopes**: Highlights SWIG-specific constructs differently from standard C/C++ code.

### Auto-Indentation and Bracket Matching
- **Indentation Rules**: Automatically adjusts indentation for blocks and directives.
- **Bracket Matching**: Supports auto-closing and matching for `{}`, `[]`, `()`, and `%{ %}`.

### Commands
- **Lint SWIG File**: Manually run the linter on the current SWIG file using the `swig-language-server.swigValidate` command.
- **Tokenize SWIG File**: Tokenize the current SWIG file and display the tokens in an output channel using the `swig-language-server.tokenize` command.

### Additional Features
- **Hover Documentation**: Provides detailed descriptions for SWIG directives.
- **Output Channel**: Displays tokenized output for debugging purposes.

## Requirements

This extension requires the following:
- A working knowledge of SWIG interface files.
- Works without any configured swig executable.

## Extension Settings

This extension contributes the following settings:
- `swigLanguageServer.enable`: Enable/disable the SWIG Language Server.
- `swigLanguageServer.lintOnSave`: Enable/disable linting on file save.

## Known Issues

- Some advanced SWIG features may not be fully supported.
- The linter might produce false positives in complex scenarios.
- Syntax highlighting for inline C/C++/Perl/Python code may not be fully accurate.

## Release Notes

### 0.0.1
- Initial release of `swig-language-server`.
- Added basic linter, syntax highlighting, and code completion for SWIG interface files.
- Added hover documentation for SWIG constructs like `%apply`, `%rename`, etc.
- Added auto-closing of brackets and `%{ %}` blocks.
- Added diagnostics for unsupported data types like `long double`.

---

## For more information

- [SWIG Documentation](http://www.swig.org/)
- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy coding with SWIG!**