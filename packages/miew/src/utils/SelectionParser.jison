//////////////////////////////////////////////////////////////////////////////
//  User code
//////////////////////////////////////////////////////////////////////////////

%{
%}

//////////////////////////////////////////////////////////////////////////////
//  Lexical grammar
//////////////////////////////////////////////////////////////////////////////

%lex
%options case-insensitive

NUM                   \-?(?:[1-9][0-9]+|[0-9])
IDENTIFIER            [_A-Z0-9]+
NAMED_SELECTOR        \@[_A-Z0-9]+
STRING                (?:\"(?:\\.|[^\\"])*\"|\'(?:\\.|[^\\'])*\')
KEYWORD_SIMPLE        ("ALL"|"NONE"|"HETATM"|"PROTEIN"|"BASIC"|"ACIDIC"|"CHARGED"|"POLAR"|"NONPOLAR"|"AROMATIC"|"NUCLEIC"|"PURINE"|"PYRIMIDINE"|"WATER"|"POLARH"|"NONPOLARH")
KEYWORD_NAMED         ("NAME"|"ELEM"|"TYPE"|"RESIDUE"|"ICODE"|"CHAIN"|"ALTLOC")
KEYWORD_RANGED        ("SERIAL"|"SEQUENCE"|"RESIDX")

%%

\s+                   /* skip whitespace */
{NUM}\b               return 'NUMBER';

OR                    return 'OR';
AND                   return 'AND';
NOT                   return 'NOT';

{KEYWORD_SIMPLE}\b    return 'SELECTOR';
{KEYWORD_NAMED}\b     return 'SELECTOR_NAMED';
{KEYWORD_RANGED}\b    return 'SELECTOR_RANGED';

"("                   return '(';
")"                   return ')';
","                   return ',';
":"                   return ':';
"<="                  return '<=';
">="                  return '>=';
"<"                   return '<';
">"                   return '>';
{STRING}              yytext = yytext.substr(1,yyleng-2); return 'STRING';
{NAMED_SELECTOR}      return 'NAMED_SELECTOR';
{IDENTIFIER}          return 'IDENTIFIER';
<<EOF>>               return 'EOF';
.                     return 'INVALID';

/lex

//////////////////////////////////////////////////////////////////////////////
//  Operator associations and precedence
//////////////////////////////////////////////////////////////////////////////

%left 'OR'
%left 'AND'
%left 'NOT'

%start Program

//////////////////////////////////////////////////////////////////////////////
//  Language grammar
//////////////////////////////////////////////////////////////////////////////

%%

Program
    : Expression EOF                   { return $1; }
    ;

Expression
    : Selector
    | Expression OR Expression      -> yy.keyword('or')($1, $3)
    | Expression AND Expression     -> yy.keyword('and')($1, $3)
    | NOT Expression                -> yy.keyword('not')($2)
    | '(' Expression ')'            -> $2
    ;

Selector
    : SELECTOR                           -> yy.keyword($1)()
    | NAMED_SELECTOR                     -> yy.GetSelector($1.toLowerCase().slice(1, $1.length))
//  | SELECTOR_RANGED CompareOp NUMBER   -> [$1, $2, $3]
    | SELECTOR_RANGED RangeList          -> yy.keyword($1)($2)
    | SELECTOR_NAMED NameList            -> yy.keyword($1)($2)
    ;

/*
CompareOp
    : '<'
    | '>'
    | '<='
    | '>='
    ;
*/

RangeList
	: Range                         -> new yy.RangeList($1)
	| RangeList ',' Range           -> $1.append($3)
	;

Range
	: NUMBER                        -> new yy.Range(Number($1))
	| NUMBER ':' NUMBER             -> new yy.Range(Number($1), Number($3))
	;

NameList
	: Name                          -> new yy.ValueList($1)
	| NameList ',' Name             -> $1.append($3)
	;

Name
  : IDENTIFIER
  | STRING
  | NUMBER
  ;

//////////////////////////////////////////////////////////////////////////////
//  User code
//////////////////////////////////////////////////////////////////////////////

%%
