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

BASE_64               [_A-Z0-9\/\+]+\=\=
NUM                   \-?(?:[1-9][0-9]+|[0-9])
IDENTIFIER            [_A-Z0-9]+
STRING                (?:\"([^"]*)\"|\'([^']*)\')

%%

\s+                   /* ignore whitespace */
[#].*                 return '';
\/\/.*                return '';


{BASE_64}                 return 'BASE_64';
\-?[0-9]+("."[0-9]+)?\b   return 'NUMBER';
0[xX][0-9A-F]+\b          return 'HEX';
false                     return 'BOOL';
true                      return 'BOOL';

all                   return 'ALL';

reset                 return 'RESET';
clear                 return 'CLEAR';
build                 return 'BUILD';
help                  return 'HELP';

load                  return 'LOAD';
script                return 'SCRIPT';
get                   return 'GET'
set                   return 'SET'
set_save              return 'SET_SAVE'
set_restore           return 'SET_RESTORE'
set_reset             return 'SET_RESET'
preset                return 'PRESET'

add                   return 'ADD'
rep                   return 'REP'

remove                return 'REMOVE'
hide                  return 'HIDE'
show                  return 'SHOW'

list                  return 'LIST'

select                return 'SELECT'
within                return 'WITHIN'
selector              return 'SELECTOR'
mode                  return 'MODE'
color                 return 'COLOR'
material              return 'MATERIAL'

view                  return 'VIEW'
unit                  return 'UNIT'
line                  return 'LINE'
listobj               return 'LISTOBJ'
removeobj             return 'REMOVEOBJ'

rotate                return 'ROTATE'
translate             return 'TRANSLATE'
scale                 return 'SCALE'

url                   return 'URL'
screenshot            return 'SCREENSHOT';

dssp                  return 'DSSP'

file_list             return 'FILE_LIST'
file_register         return 'FILE_REGISTER'
file_delete           return 'FILE_DELETE'
preset_add            return 'PRESET_ADD'
preset_delete         return 'PRESET_DELETE'
preset_update         return 'PRESET_UPDATE'
preset_rename         return 'PRESET_RENAME'
preset_open           return 'PRESET_OPEN'

create_scenario       return 'CREATE_SCENARIO'
reset_scenario        return 'RESET_SCENARIO'
delete_scenario       return 'DELETE_SCENARIO'
add_scenario_item     return 'ADD_SCENARIO_ITEM'
list_scenario         return 'LIST_SCENARIO'

s                     return 'DESC_KEY'
mt                    return 'DESC_KEY'
m                     return 'DESC_KEY_OPTS'
c                     return 'DESC_KEY_OPTS'

x                     return 'DESC_KEY_AXES'
y                     return 'DESC_KEY_AXES'
z                     return 'DESC_KEY_AXES'

as                    return 'AS'
of                    return 'OF'

"pdb"                 return 'PDB_KEY'
"delay"               return 'DELAY_KEY'
"prst"                return 'PRST_KEY'
'desc'                return 'DESCRIPTION_KEY'

{STRING}              yytext = yytext.substr(1,yyleng-2); return 'STRING';
{IDENTIFIER}          return 'IDENTIFIER';
<<EOF>>               return 'EOF';
"."                   return '.';
"/"                   return '/';
"\\"                  return '\\';
"-e"                  return 'EXPAND_KEY'
"-f"                  return 'FILE_KEY'
"-s"                  return 'SELECTOR_KEY'
'-v'                  return 'VIEW_KEY'
"="                   return '='

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
    : Command EOF                   { return $1; }
    | EOF
    ;

Command
    : RESET                               -> yy.miew.reset(false); yy.ClearContext(); yy.miew.resetReps("empty")
    | BUILD                               -> yy.miew.rebuild()
    | BUILD ALL                           -> yy.miew.rebuildAll(); yy.miew.rebuild()
    | HELP                                -> yy.echo(yy.utils.help().toString())
    | HELP Path                           -> yy.echo(yy.utils.help($2).toString())
    | OneArgCommand
    | GET Path                            -> yy.utils.propagateProp($2); yy.echo(yy.miew.get($2).toString())
    | GET STRING                          -> yy.utils.propagateProp($2); yy.echo(yy.miew.get($2).toString())
    | SET Path Value                      -> yy.miew.set($2, yy.utils.propagateProp($2, $3));
    | SET STRING Value                    -> yy.miew.set($2, yy.utils.propagateProp($2, $3));
    | SET_SAVE                            -> yy.miew.saveSettings();
    | SET_RESTORE                         -> yy.miew.restoreSettings();
    | SET_RESET                           -> yy.miew.resetSettings();
    | PRESET                              -> yy.miew.resetReps()
    | PRESET Value                        -> yy.miew.applyPreset($2)
    | AddRepresentation
    | EditRepresentation
    | REMOVE RepresentationReference      -> yy.miew.repRemove($2); yy.representations.remove($2)
    | HIDE RepresentationReference        -> yy.miew.repHide($2)
    | SHOW RepresentationReference        -> yy.miew.repHide($2, false)
    | LIST RepresentationReference        -> yy.echo(yy.utils.listRep(yy.miew, yy.representations, $2, '-e'))
    | LIST                                -> yy.echo(yy.utils.list(yy.miew, yy.representations))
    | LIST EXPAND_KEY                     -> yy.echo(yy.utils.list(yy.miew, yy.representations, $2))
    | LIST SELECTOR_KEY                   -> yy.echo(yy.utils.listSelector(yy.miew, yy.Context))
    | SELECT STRING                       -> yy.miew.select(yy.utils.checkArg($1.toLowerCase(), $2, true))
    | SELECT STRING AS WordAll            -> yy.Context[$4.toLowerCase()] = yy.utils.checkArg($1.toLowerCase(), $2, true); yy.miew.select(yy.Context[$4.toLowerCase()])
    | SELECTOR STRING                     -> yy.miew.rep(yy.miew.repCurrent(), {selector : yy.utils.checkArg($1.toLowerCase(), $2)})

    | WITHIN NUMBER OF STRING AS WordAll  -> yy.Context[$6.toLowerCase()] = yy.miew.within(yy.utils.checkArg("select", $4, true), Number($2))

    | MATERIAL IDENTIFIER                 -> yy.miew.rep(yy.miew.repCurrent(), {material : yy.utils.checkArg($1.toLowerCase(), $2.toUpperCase())})
    | ModeCMD
    | ColorCMD
    | VIEW                                -> yy.echo(yy.miew.view())
    | VIEW STRING                         -> yy.miew.view($2)
    | VIEW BASE_64                        -> yy.miew.view($2)
    | UNIT                                -> yy.echo(yy.miew.changeUnit())
    | UNIT NUMBER                         -> yy.echo(yy.miew.changeUnit($2))
    | DSSP                                -> yy.miew.dssp()
    | SCALE NUMBER                        -> yy.miew.scale($2)
    | ROTATE AxesList                     { for (var i = 0, n = $2.length; i < n; i++) {yy.miew.rotate($2[i]['x'] * Math.PI / 180.0, $2[i]['y'] * Math.PI / 180.0, $2[i]['z'] * Math.PI / 180.0)} }
    | TRANSLATE AxesList                  { for (var i = 0, n = $2.length; i < n; i++) {yy.miew.translate($2[i]['x'] || 0, $2[i]['y'] || 0, $2[i]['z'] || 0)} }
    | GetURLBranch
    | Screenshot
    | SrvCMD
    | SrvScenarioCMD
    | LINE STRING STRING                  -> yy.miew.addObject({type: 'line', params: [$2, $3]}, true)
    | LINE Path Path                      -> yy.miew.addObject({type: 'line', params: [$2, $3]}, true)
    | LINE STRING STRING ArgList          -> yy.miew.addObject({type: 'line', params: [$2, $3], opts:$4.toJSO(yy.utils, 'objects', 'line')}, true)
    | LINE Path Path ArgList              -> yy.miew.addObject({type: 'line', params: [$2, $3], opts:$4.toJSO(yy.utils, 'objects', 'line')}, true)
    | LISTOBJ                             -> yy.echo(yy.utils.listObjs(yy.miew))
    | REMOVEOBJ NUMBER                    -> yy.miew.removeObject($2)
    ;

GetURLBranch
    : URL                                 -> yy.echo(yy.miew.getURL({view: false, settings: false}))
    | URL SELECTOR_KEY                    -> yy.echo(yy.miew.getURL({view: false, settings: true}))
    | URL VIEW_KEY                        -> yy.echo(yy.miew.getURL({view: true,  settings: false}))
    | URL SELECTOR_KEY VIEW_KEY           -> yy.echo(yy.miew.getURL({view: true,  settings: true}))
    | URL VIEW_KEY SELECTOR_KEY           -> yy.echo(yy.miew.getURL({view: true,  settings: true}))
    ;

Screenshot
    : SCREENSHOT                          -> yy.miew.screenshotSave()
    | SCREENSHOT NUMBER                   -> yy.miew.screenshotSave('', Number($2))
    | SCREENSHOT NUMBER NUMBER            -> yy.miew.screenshotSave('', Number($2), Number($3))
    ;

SrvCMD
    : FILE_LIST                            -> yy.srv.fileList(yy.miew, yy.echo, yy.error)
    | FILE_LIST FILE_KEY STRING            -> yy.srv.fileList(yy.miew, yy.echo, yy.error, "", $3)
    | FILE_LIST NUMBER                     -> yy.srv.fileList(yy.miew, yy.echo, yy.error, $2)
    | FILE_LIST NUMBER FILE_KEY STRING     -> yy.srv.fileList(yy.miew, yy.echo, yy.error, $2, $4)
    | FILE_LIST PresetPath                 -> yy.srv.coroutineWithFileName(yy.miew, yy.echo, yy.error, $2, yy.srv.fileList, yy.srv, yy.miew, yy.echo, yy.error)
    | FILE_LIST PresetPath FILE_KEY STRING -> yy.srv.coroutineWithFileName(yy.miew, yy.echo, yy.error, $2, yy.srv.fileList, yy.srv, yy.miew, yy.echo, yy.error, $4)
    | FILE_LIST STRING                     -> yy.srv.coroutineWithFileName(yy.miew, yy.echo, yy.error, $2, yy.srv.fileList, yy.srv, yy.miew, yy.echo, yy.error)
    | FILE_LIST STRING FILE_KEY STRING     -> yy.srv.coroutineWithFileName(yy.miew, yy.echo, yy.error, $2, yy.srv.fileList, yy.srv, yy.miew, yy.echo, yy.error, $4)

    | FILE_REGISTER                        -> yy.srv.callSrvFunc(yy.miew, yy.echo, yy.error, "srvTopologyRegister")

    | FILE_DELETE NUMBER                   -> yy.srv.callSrvFunc(yy.miew, yy.echo, yy.error, "srvTopologyDelete", $2, false)
    | FILE_DELETE STRING                   -> yy.srv.coroutineWithFileName(yy.miew, yy.echo, yy.error, $2, yy.miew.srvTopologyDelete, false)
    | FILE_DELETE PresetPath               -> yy.srv.coroutineWithFileName(yy.miew, yy.echo, yy.error, $2, yy.miew.srvTopologyDelete, false)

    | FILE_DELETE NUMBER FILE_KEY          -> yy.srv.callSrvFunc(yy.miew, yy.echo, yy.error, "srvTopologyDelete", $2, true)
    | FILE_DELETE STRING FILE_KEY          -> yy.srv.coroutineWithFileName(yy.miew, yy.echo, yy.error, $2, yy.miew.srvTopologyDelete, true)
    | FILE_DELETE PresetPath FILE_KEY      -> yy.srv.coroutineWithFileName(yy.miew, yy.echo, yy.error, $2, yy.miew.srvTopologyDelete, true)

    | PRESET_ADD STRING                    -> yy.srv.callSrvFunc(yy.miew, yy.echo, yy.error, "srvPresetCreate", $2)
    | PRESET_ADD Word                      -> yy.srv.callSrvFunc(yy.miew, yy.echo, yy.error, "srvPresetCreate", $2)

    | PRESET_DELETE NUMBER                 -> yy.srv.callSrvFunc(yy.miew, yy.echo, yy.error, "srvPresetDelete", $2)
    | PRESET_DELETE STRING                 -> yy.srv.coroutineWithPresetPath(yy.miew, yy.echo, yy.error, $2, yy.miew.srvPresetDelete)
    | PRESET_DELETE PresetPath             -> yy.srv.coroutineWithPresetPath(yy.miew, yy.echo, yy.error, $2, yy.miew.srvPresetDelete)

    | PRESET_UPDATE NUMBER                 -> yy.srv.callSrvFunc(yy.miew, yy.echo, yy.error, "srvPresetUpdate", $2)
    | PRESET_UPDATE STRING                 -> yy.srv.coroutineWithPresetPath(yy.miew, yy.echo, yy.error, $2, yy.miew.srvPresetUpdate)
    | PRESET_UPDATE PresetPath             -> yy.srv.coroutineWithPresetPath(yy.miew, yy.echo, yy.error, $2, yy.miew.srvPresetUpdate)

    | PRESET_RENAME NUMBER STRING          -> yy.srv.callSrvFunc(yy.miew, yy.echo, yy.error, "srvPresetRename", $2, $3)
    | PRESET_RENAME STRING STRING          -> yy.srv.coroutineWithPresetPath(yy.miew, yy.echo, yy.error, $2, yy.miew.srvPresetRename, $3)
    | PRESET_RENAME PresetPath STRING      -> yy.srv.coroutineWithPresetPath(yy.miew, yy.echo, yy.error, $2, yy.miew.srvPresetRename, $3)

    | PRESET_OPEN NUMBER                   -> yy.srv.callSrvFunc(yy.miew, yy.echo, yy.error, "srvPresetApply", $2); yy.representations.clear()
    | PRESET_OPEN STRING                   -> yy.srv.coroutineWithPresetPath(yy.miew, yy.echo, yy.error, $2, yy.miew.srvPresetApply); yy.representations.clear()
    | PRESET_OPEN PresetPath               -> yy.srv.coroutineWithPresetPath(yy.miew, yy.echo, yy.error, $2, yy.miew.srvPresetApply); yy.representations.clear()
    ;

SrvScenarioCMD
    : CREATE_SCENARIO STRING               -> yy.srv.createScenario($2)
    | CREATE_SCENARIO Word                 -> yy.srv.createScenario($2)
    | RESET_SCENARIO                       -> yy.srv.resetScenario()
    | DELETE_SCENARIO STRING               -> yy.srv.deleteScenario(yy.miew, yy.echo, yy.error, $2)
    | DELETE_SCENARIO Word                 -> yy.srv.deleteScenario(yy.miew, yy.echo, yy.error, $2)
    | DELETE_SCENARIO NUMBER               -> yy.srv.deleteScenario(yy.miew, yy.echo, yy.error, Number($2))
    | LIST_SCENARIO                        -> yy.srv.listScenario(yy.miew, yy.echo, yy.error)
    | LIST_SCENARIO EXPAND_KEY             -> yy.srv.listScenario(yy.miew, yy.echo, yy.error, $2)
    | LIST_SCENARIO EXPAND_KEY NUMBER      -> yy.srv.listScenario(yy.miew, yy.echo, yy.error, $3)
    | LIST_SCENARIO EXPAND_KEY Word        -> yy.srv.listScenario(yy.miew, yy.echo, yy.error, $3)
    | LIST_SCENARIO EXPAND_KEY STRING      -> yy.srv.listScenario(yy.miew, yy.echo, yy.error, $3)

    | ADD_SCENARIO_ITEM DELAY_KEY '=' NUMBER DESCRIPTION_KEY '=' STRING                                          ->yy.srv.addScenarioItem(yy.miew, yy.echo, yy.error, Number($4), $7)
    | ADD_SCENARIO_ITEM PDB_KEY '=' NUMBER PRST_KEY '=' NUMBER DELAY_KEY '=' NUMBER DESCRIPTION_KEY '=' STRING           ->yy.srv.addScenarioItem(yy.miew, yy.echo, yy.error, Number($4), Number($7), Number($10), $13)
    | ADD_SCENARIO_ITEM PDB_KEY '=' IDENTIFIER PRST_KEY '=' NUMBER DELAY_KEY '=' NUMBER DESCRIPTION_KEY '=' STRING       ->yy.srv.addScenarioItem(yy.miew, yy.echo, yy.error, $4, Number($7), Number($10), $13)
    | ADD_SCENARIO_ITEM PDB_KEY '=' NUMBER PRST_KEY '=' PresetPath DELAY_KEY '=' NUMBER DESCRIPTION_KEY '=' STRING       ->yy.srv.addScenarioItem(yy.miew, yy.echo, yy.error, Number($4), $7, Number($10), $13)
    | ADD_SCENARIO_ITEM PDB_KEY '=' IDENTIFIER PRST_KEY '=' PresetPath DELAY_KEY '=' NUMBER DESCRIPTION_KEY '=' STRING   ->yy.srv.addScenarioItem(yy.miew, yy.echo, yy.error, $4, $7, Number($10), $13)
    ;

OneArgCommand
    : LOAD Url                            -> yy.utils.load(yy.miew, $2); yy.representations.clear()
    | LOAD IDENTIFIER                     -> yy.utils.load(yy.miew, $2); yy.representations.clear()
    | LOAD FILE_KEY                       -> yy.utils.load(yy.miew, $2); yy.representations.clear()
    | SCRIPT Url                          -> yy.notimplemented()
    ;

AddRepresentation
    : ADD                            -> yy.echo(yy.representations.add(yy.miew.repAdd()))
    | ADD IDENTIFIER                 -> yy.echo(yy.representations.add($2, yy.miew.repAdd()))
    | ADD Description                -> yy.echo(yy.representations.add(yy.miew.repAdd($2)))
    | ADD IDENTIFIER Description     -> yy.echo(yy.representations.add($2, yy.miew.repAdd($3)))
    ;

EditRepresentation
    : REP RepresentationReference                 -> yy.miew.rep($2); yy.miew.repCurrent($2)
    | REP RepresentationReference Description     -> yy.miew.rep($2, $3); yy.miew.repCurrent($2)
    ;

ModeCMD
    : MODE IDENTIFIER            -> yy.miew.rep(yy.miew.repCurrent(), {mode : yy.utils.checkArg($1.toLowerCase(), $2.toUpperCase())})
    | MODE IDENTIFIER  ArgList   -> yy.miew.rep(yy.miew.repCurrent(), {mode : new Array(yy.utils.checkArg($1.toLowerCase(), $2.toUpperCase()), $3.toJSO(yy.utils, $1, $2.toUpperCase()))})
    ;

ColorCMD
    : COLOR IDENTIFIER            -> yy.miew.rep(yy.miew.repCurrent(), {colorer : yy.utils.checkArg($1.toLowerCase(), $2.toUpperCase())})
    | COLOR IDENTIFIER  ArgList   -> yy.miew.rep(yy.miew.repCurrent(), {colorer : new Array(yy.utils.checkArg($1.toLowerCase(), $2.toUpperCase()), $3.toJSO(yy.utils, $1, $2.toUpperCase()))})
    ;

RepresentationReference
    : IDENTIFIER  -> Number(yy.representations.get($1))
    | NUMBER      -> Number($1)
    ;

Description
    : Descriptor                                  -> $1
    | Descriptor Descriptor                       -> yy._.assign($1, $2)
    | Descriptor Descriptor Descriptor            -> yy._.assign($1, $2, $3)
    | Descriptor Descriptor Descriptor Descriptor -> yy._.assign($1, $2, $3, $4)
    ;

Descriptor
    : RepresentationOwnProperty               -> yy.CreateObjectPair($1.key, $1.val)
    | RepresentationOwnPropertyOpts           -> yy.CreateObjectPair($1.key, $1.val)
    | RepresentationOwnPropertyOpts ArgList   -> yy.CreateObjectPair($1.key, new Array($1.val, $2.toJSO(yy.utils, $1.key, $1.val)))
    ;

RepresentationOwnProperty
  : DESC_KEY '=' Value    -> Object.create({'key': yy.keyRemap($1), 'val': yy.utils.checkArg($1, $3)})
  ;

RepresentationOwnPropertyOpts
  : DESC_KEY_OPTS '=' Value    -> Object.create({'key': yy.keyRemap($1), 'val': yy.utils.checkArg($1, $3)})
  ;

AxesList
  : AxesArg               -> [$1]
  | AxesList AxesArg      -> $1.concat($2)
  ;

AxesArg
  : DESC_KEY_AXES NUMBER  -> yy.CreateObjectPair($1.toLowerCase(), Number($2))
  ;

ArgList
	: Arg                   -> new yy.ArgList($1)
	| ArgList Arg           -> $1.append($2)
	;

Arg
	: PathWoDescKey '=' Value           -> new yy.Arg($1, $3)
	;

Value
  : NUMBER                  -> Number($1)
  | HEX                     -> parseInt($1)
  | BOOL                    -> JSON.parse($1)
  | IDENTIFIER              -> String($1)
  | STRING                  -> String($1)
  ;

Word
  : IDENTIFIER
  | CommandSetWoDESC_KEY
  ;

WordAll
  : Word
  | DescKeys
  ;

CommandSetWoDESC_KEY
  : RESET
  | CLEAR
  | BUILD
  | HELP
  | LOAD
  | SCRIPT
  | GET
  | SET
  | SET_SAVE
  | SET_RESTORE
  | SET_RESET
  | ADD
  | REP
  | REMOVE
  | HIDE
  | SHOW
  | LIST
  | SELECTOR
  | MODE
  | COLOR
  | MATERIAL
  | PRESET
  | VIEW
  | UNIT
  | ROTATE
  | SCALE
  | URL
  | SCREENSHOT
  | FILE_LIST
  | FILE_REGISTER
  | FILE_DELETE
  | PRESET_ADD
  | PRESET_DELETE
  | PRESET_UPDATE
  | PRESET_RENAME
  | PRESET_OPEN
  | LINE
  | LISTOBJ
  | REMOVEOBJ
  | SELECT
  | WITHIN
  | CREATE_SCENARIO
  | RESET_SCENARIO
  | DELETE_SCENARIO
  | ADD_SCENARIO_ITEM
  | LIST_SCENARIO
  ;

DescKeys
  : DESC_KEY
  | DESC_KEY_OPTS
  | DESC_KEY_AXES
  | PDB_KEY
  | DELAY_KEY
  | PRST_KEY
  | DESCRIPTION_KEY
  ;

CommandSet
  : DescKeys
  | CommandSetWoDESC_KEY
  ;

PathWoDescKey
  : Word
  | PathWoDescKey '.' Word -> $1 + $2 + $3 //cause of could be color word in path
  | PathWoDescKey '.' NUMBER -> $1 + $2 + $3 //cause of could be color word in path
  ;

Path
  : Word
  | DescKeys
  | Path '.' Word -> $1 + $2 + $3 //cause of could be color word in path
  | Path '.' NUMBER -> $1 + $2 + $3 //cause of could be color word in path
  | Path '.' DescKeys -> $1 + $2 + $3 //cause of could be color word in path
  ;

Url
  : STRING
  ;

PresetPath
  : Path
  | PresetPath '/' Path       -> $1 = $1 + $2 + $3
  ;

HexOrNumber
  : NUMBER
  | HEX
  ;

//////////////////////////////////////////////////////////////////////////////
//  User code
//////////////////////////////////////////////////////////////////////////////

%%
