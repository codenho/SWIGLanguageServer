# swig-language-server README

The `swig-language-server` extension provides a language server for SWIG interface files, offering essential tools to enhance your development experience. It includes a basic linter, syntax highlighting, and code completion for `.i` or `.swig` files.

## Features

This extension provides the following features for SWIG interface files:

- **Language Server**: Offers intelligent features like code completion and error checking.
- **Basic Linter**: Highlights potential issues in your SWIG interface files.
- **Syntax Highlighting**: Improves readability with proper syntax coloring.

## Requirements

This extension requires the following:

- A working knowledge of SWIG interface files.

## Extension Settings

This extension contributes the following settings:

* `swigLanguageServer.enable`: Enable/disable the SWIG Language Server.
* `swigLanguageServer.lintOnSave`: Enable/disable linting on file save.

## Known Issues

- Some advanced SWIG features may not be fully supported.
- Linter might produce false positives in complex scenarios.
- Syntax highlighting for inline C/C++/Perl/Python code may not be correct.

## Release Notes

### 0.0.1

- Initial release of `swig-language-server`.
- Added basic linter, syntax highlighting, and code completion for SWIG interface files.
- It checks for unsupported data types like `long double`, or incorrect usage of %rename, %apply etc.
- Other minor features include auto-closing of brackets, hover to reveal documentation for swig constructs like %apply, %rename etc.

---

## For more information

* [SWIG Documentation](http://www.swig.org/)
* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy coding with SWIG!**
