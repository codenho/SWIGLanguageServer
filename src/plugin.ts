import * as vscode from 'vscode';
import { TextDocument } from 'vscode-languageserver-textdocument';
import * as path from 'path';
import * as fs from 'fs';

export function validateTextDocument(document: TextDocument): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];
  const code = document.getText();

  // Load the SWIG grammar file
  const grammarPath = path.join(__dirname, '../swig.tmLanguage.json');
  const grammarContent = fs.readFileSync(grammarPath, 'utf-8');
  const grammar = JSON.parse(grammarContent);

  // Extract valid types from the grammar
  const validTypes = new Set<string>();
  let lineCommentPattern: RegExp | null = null;
  let blockCommentStartPattern: RegExp | null = null;
  let blockCommentEndPattern: RegExp | null = null;

  let keywordPattern: RegExp | null = null;
  let includeBlockBeginPattern: RegExp | null = null;
  let includeBlockEndPattern: RegExp | null = null;

  grammar.patterns.forEach((pattern: any) => {
    if (pattern.name === 'keyword.control.swig' && pattern.match) {
      keywordPattern = new RegExp(pattern.match);
      const matches = pattern.match.match(/\b(\w+)\b/g);
      if (matches) {
      matches.forEach((type: string) => validTypes.add(type));
      }
    }
    if (pattern.name === 'include.block.swig' && pattern.begin && pattern.end) {
      includeBlockBeginPattern = new RegExp(pattern.begin);
      includeBlockEndPattern = new RegExp(pattern.end);
    }
    if (pattern.name === 'keyword.control.c' && pattern.match) {
      const matches = pattern.match.match(/\b(\w+)\b/g);
      if (matches) {
      matches.forEach((type: string) => validTypes.add(type));
      }
    }
    if (pattern.name === 'comment.line.double-slash.swig' && pattern.begin) {
      lineCommentPattern = new RegExp(pattern.begin);
    }
    if (pattern.name === 'comment.block.swig' && pattern.begin && pattern.end) {
      blockCommentStartPattern = new RegExp(pattern.begin);
      blockCommentEndPattern = new RegExp(pattern.end);
    }
  });

  const lines = code ? code.split(require('os').EOL) : [];
  const declaredTypes = new Set<string>();
  let insideBlockComment = false;
  let insideIncludeBlock = false;
  let includeInitialized = false;

  lines.forEach((line, index) => {
    line = line.trim();
  
    // Skip empty lines
    if (line === '') {
      return;
    }
    // Skip lines that are comments
    if (lineCommentPattern && lineCommentPattern.test(line)) {
      return;
    }

    // Check for unmatched single or double quotes
    const singleQuoteCount = (line.match(/'/g) || []).length;
    const doubleQuoteCount = (line.match(/"/g) || []).length;
    if (singleQuoteCount % 2 !== 0 || doubleQuoteCount % 2 !== 0) {
      diagnostics.push({
        severity: vscode.DiagnosticSeverity.Error,
        range: new vscode.Range(
          new vscode.Position(index, 0),
          new vscode.Position(index, line.length)
        ),
        message: `Unmatched single or double quotes detected.`,
        source: 'swig.tmLanguage.json'
      });
      return;
    }

    if (blockCommentStartPattern && blockCommentStartPattern.test(line)) {
      insideBlockComment = true;
    }
    if (insideBlockComment) {
      if (blockCommentEndPattern && blockCommentEndPattern.test(line)) {
        insideBlockComment = false;
      }
      return;
    }

    if (includeBlockBeginPattern && includeBlockBeginPattern.test(line)) {
      includeInitialized = true;
      insideIncludeBlock = true;
    }

    // Check for the end of an include block
    if (insideIncludeBlock && includeBlockEndPattern && includeBlockEndPattern.test(line)) {
      insideIncludeBlock = false;
    }

    // Check for keyword.control.swig after an include block
    if (!insideIncludeBlock && includeInitialized) {
      if (/^(%module|%define|%typemap|%pragma|%extend|%apply|%exception|%feature|%rename|%ignore|%insert|%warn|%newobject|%shared_ptr)/.test(line)) {
        diagnostics.push({
          severity: vscode.DiagnosticSeverity.Error,
          range: new vscode.Range(
            new vscode.Position(index, 0),
            new vscode.Position(index, line.length)
          ),
          message: `SWIG control keyword constructs (e.g., %include) must be declared before include blocks (%{ #include ... %}).`,
          source: 'swig.tmLanguage.json'
        });
      }
    }

    // Check if the line starts with "long double"
    if (/^\s*long\s+double\b/.test(line)) {
      diagnostics.push({
      severity: vscode.DiagnosticSeverity.Warning,
      range: new vscode.Range(
        new vscode.Position(index, 0),
        new vscode.Position(index, line.length)
      ),
      message: `Long double is not supported by SWIG.`,
      source: 'swig.tmLanguage.json'
      });
    }

    const typeMatch = line.startsWith('typedef') ? line.match(/typedef\s+.*?\b(\w+)\s*;$/) : null;
    if (typeMatch) {
      declaredTypes.add(typeMatch[1]);
      return;
    }

    // Handle SWIG directives explicitly
    const swigDirectiveMatch = line.match(/^%(\w+)\b/);
    if (swigDirectiveMatch) {
      // If it's a SWIG directive, skip undefined type checks
      return;
    }
    
    // Skip if the first word in the line starts with $ or %
    if (/^\s*[$%]/.test(line)) {
      return;
    }
    const undefinedTypeMatch = line.match(/\b(\w+)\b/);
    if (
      undefinedTypeMatch &&
      !declaredTypes.has(undefinedTypeMatch[1]) &&
      !validTypes.has(undefinedTypeMatch[1]) &&
      !(keywordPattern && keywordPattern.test(undefinedTypeMatch[1]))
    ) {
      
        diagnostics.push({
          severity: vscode.DiagnosticSeverity.Error,
          range: new vscode.Range(
            new vscode.Position(index, 0),
            new vscode.Position(index, line.length)
          ),
          message: `Undefined type: ${undefinedTypeMatch[1]}`,
          source: 'swig.tmLanguage.json'
        });
        }
  });

  return diagnostics;
}