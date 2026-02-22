// ============================================================
// LEXER
// ============================================================
// Depends on: tokens.js (TokenType)

class Lexer {
    constructor(text) {
        this.text = text;
        this.pos = 0;
        this.line = 1;
        this.col = 1;

        this.keywords = new Map([
            ["DECLARE", TokenType.DECLARE],
            ["CONSTANT", TokenType.CONSTANT],
            ["IF", TokenType.IF],
            ["THEN", TokenType.THEN],
            ["ELSE", TokenType.ELSE],
            ["ENDIF", TokenType.ENDIF],
            ["WHILE", TokenType.WHILE],
            ["DO", TokenType.DO],
            ["ENDWHILE", TokenType.ENDWHILE],
            ["FOR", TokenType.FOR],
            ["TO", TokenType.TO],
            ["STEP", TokenType.STEP],
            ["NEXT", TokenType.NEXT],
            ["OUTPUT", TokenType.OUTPUT],
            ["INPUT", TokenType.INPUT],
            ["REPEAT", TokenType.REPEAT],
            ["UNTIL", TokenType.UNTIL],
            ["CASE", TokenType.CASE],
            ["OF", TokenType.OF],
            ["ENDCASE", TokenType.ENDCASE],
            ["OTHERWISE", TokenType.OTHERWISE],
            ["ARRAY", TokenType.ARRAY],
            ["PROCEDURE", TokenType.PROCEDURE],
            ["ENDPROCEDURE", TokenType.ENDPROCEDURE],
            ["FUNCTION", TokenType.FUNCTION],
            ["ENDFUNCTION", TokenType.ENDFUNCTION],
            ["CALL", TokenType.CALL],
            ["RETURN", TokenType.RETURN],
            ["RETURNS", TokenType.RETURNS],
            ["BYREF", TokenType.BYREF],
            ["BYVAL", TokenType.BYVAL],
            ["AND", TokenType.AND],
            ["OR", TokenType.OR],
            ["NOT", TokenType.NOT],
            ["DIV", TokenType.DIV],
            ["MOD", TokenType.MOD],
            ["TYPE", TokenType.TYPE],
            ["ENDTYPE", TokenType.ENDTYPE],
            ["OPENFILE", TokenType.OPENFILE],
            ["READFILE", TokenType.READFILE],
            ["WRITEFILE", TokenType.WRITEFILE],
            ["CLOSEFILE", TokenType.CLOSEFILE],
            ["READ", TokenType.READ],
            ["WRITE", TokenType.WRITE],
            ["APPEND", TokenType.APPEND],
            ["INTEGER", "INTEGER"],
            ["REAL", "REAL"],
            ["STRING", "STRING"],
            ["BOOLEAN", "BOOLEAN"],
            ["CHAR", "CHAR"]
        ]);
    }

    peek() {
        return this.text[this.pos] ?? null;
    }

    advance() {
        const ch = this.peek();
        this.pos++;

        if (ch === "\n") {
            this.line++;
            this.col = 1;
        } else {
            this.col++;
        }

        return ch;
    }

    token(type, lexeme) {
        return { type, lexeme, line: this.line, col: this.col };
    }

    skipWhitespace() {
        while (/\s/.test(this.peek())) this.advance();
    }

    skipComment() {
        if (this.text.startsWith("//", this.pos)) {
            while (this.peek() !== null && this.peek() !== "\n") {
                this.advance();
            }
        }
    }

    // -------------------------------- NUMBERS --------------------------------

    readNumber() {
        let text = "";
        let dot = false;

        while (true) {
            const c = this.peek();
            if (c === null) break;

            if (/[0-9]/.test(c)) {
                text += this.advance();
            } else if (c === "." && !dot) {
                dot = true;
                text += this.advance();
            } else break;
        }

        if (dot) return this.token(TokenType.REAL_LITERAL, text);
        return this.token(TokenType.INTEGER_LITERAL, text);
    }

    // ---------------------------- IDENTIFIERS / KEYWORDS ----------------------------

    readIdentifier() {
        let text = "";

        while (this.peek() !== null && /[A-Za-z0-9_]/.test(this.peek())) {
            text += this.advance();
        }

        const upper = text.toUpperCase();

        if (this.keywords.has(upper)) {
            return this.token(this.keywords.get(upper), upper);
        }

        return this.token(TokenType.IDENTIFIER, text);
    }

    // -------------------------------- STRINGS --------------------------------

    readString(quoteChar) {
        this.advance(); // opening quote

        let out = "";

        while (true) {
            const c = this.peek();

            if (c === null) break;

            if (c === quoteChar) {
                this.advance();
                break;
            }

            if (c === "\\") {
                this.advance();
                const next = this.peek();
                if (next !== null) {
                    out += next;
                    this.advance();
                }
            } else {
                out += this.advance();
            }
        }

        return this.token(TokenType.STRING_LITERAL, out);
    }

    // ---------------------------- MAIN TOKENIZER ----------------------------

    tokenize() {
        const tokens = [];

        while (true) {
            this.skipWhitespace();
            this.skipComment();
            this.skipWhitespace();

            const c = this.peek();
            if (c === null) break;

            // Strings (double or single quotes)
            if (c === '"' || c === "'") {
                tokens.push(this.readString(c));
                continue;
            }

            // Identifiers / Keywords
            if (/[A-Za-z_]/.test(c)) {
                tokens.push(this.readIdentifier());
                continue;
            }

            // Numbers
            if (/[0-9]/.test(c)) {
                tokens.push(this.readNumber());
                continue;
            }

            // Comments - check BEFORE operators
            if (this.text.startsWith("//", this.pos)) {
                while (this.peek() !== null && this.peek() !== "\n") {
                    this.advance();
                }
                continue;
            }

            // Operators (multi-char)
            if (this.text.startsWith("<-", this.pos)) {
                tokens.push(this.token(TokenType.ASSIGN, "<-"));
                this.pos += 2;
                this.col += 2;
                continue;
            }
            if (this.text.startsWith("<=", this.pos)) {
                tokens.push(this.token(TokenType.LE, "<="));
                this.pos += 2;
                this.col += 2;
                continue;
            }
            if (this.text.startsWith(">=", this.pos)) {
                tokens.push(this.token(TokenType.GE, ">="));
                this.pos += 2;
                this.col += 2;
                continue;
            }
            if (this.text.startsWith("<>", this.pos)) {
                tokens.push(this.token(TokenType.NE, "<>"));
                this.pos += 2;
                this.col += 2;
                continue;
            }

            // Operators (single-char)
            const single = {
                "+": TokenType.PLUS,
                "-": TokenType.MINUS,
                "*": TokenType.MULTIPLY,
                "/": TokenType.DIVIDE,
                "^": TokenType.POWER,
                "=": TokenType.EQ,
                "<": TokenType.LT,
                ">": TokenType.GT,
                "(": TokenType.LPAREN,
                ")": TokenType.RPAREN,
                ",": TokenType.COMMA,
                ":": TokenType.COLON,
                "[": TokenType.LBRACKET,
                "]": TokenType.RBRACKET,
                "&": TokenType.AMPERSAND,
                ".": TokenType.DOT
            };

            if (single[c]) {
                tokens.push(this.token(single[c], c));
                this.advance();
                continue;
            }

            throw new Error(`Unknown character '${c}' at ${this.line}:${this.col}`);
        }

        tokens.push(this.token(TokenType.EOF, ""));
        return tokens;
    }
}
