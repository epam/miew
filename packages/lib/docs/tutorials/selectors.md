# Selection Language

Miew allows to view different molecule parts (subsets of atoms) using specific visualizations.
To select these subsets one should use a _Selection Language_; find the description of its syntax below.

## Quick Examples

  - `chain A and not hetatm`  
    select all atoms in chain A except for HETATM PDB records.
  - `residue ALA`  
    select all residues named `ALA` (alanine).
  - `serial 1:10, 20:30 and type C, N`  
    select Carbon and Nitrogen atoms with atom indices in range 1 through 10 or
    20 through 30 inclusively. 

## Syntax

An _Expression_ in Miew selection language consists of a _Selector_ or a set of _Expressions_
joined with logical operations `AND`, `OR`, `NOT` and brackets for grouping.

    Expression ::=
      Selector |
      Expression 'AND' Expression |
      Expression 'OR' Expression |
      'NOT' Expression |
      '(' Expression ')'

_Selector_ consists of a keyword followed by an optional comma separated parameter list.
Some keywords accept integer parameters (e.g. atom or residue indices), others accept strings
(e.g. atom or residue names). Keywords are **case insensitive**.

Integer parameter can be a single value or range of values, where colon delimits range borders.
Example: `3:7` defines an integer range: 3, 4, 5, 6, and 7).

There should be quotation marks for string parameters unless the string consists of letters,
digits and underscores only.

    Selector ::=
      Keyword |
      Keyword IntegerList |
      Keyword StringList

    IntegerList ::= Range | IntegerList ',' Range
    Range ::= Number | Number ':' Number

    StringList ::= String | StringList ',' String
    String ::= AlphaNumericString | QuotedString

## Keywords list

Keyword            |Description                            |Example
---                |---                                    |---
**all**            |all atoms                              |all
**none**           |empty subset                           |none
**hetatm**         |atoms defined as HETATM in PDB-file    |not hetatm
**water**          |water residues (WAT, HOH, H2O)         |hetatm and not water
**serial** _int_   |atoms by serial numbers                |serial 1:10, 13, 25:37
**name** _str_     |atoms by names                         |name CA, CB
**elem** _str_     |atoms by chemical elements             |elem O, N, H
**type** _str_     |_deprecated!_ superseded by **elem**   | 
**altloc** _str_   |atoms by alternative location (conformation) |altloc " ", A
**residue** _str_  |residues by names                      |residue ALA, CYS
**sequence** _int_ |residues by indices in a sequence      |sequence 35:37
**residx** _int_   |residues by ordinal index              |residx 1327
**icode** _str_    |residues by insertion code             |sequence 409 and icode B
**protein**        |one of 22 common amino acid residues   |
**basic**          |basic amino acid residue: ARG, HIS, LYS|
**acidic**         |acidic amino acid residue: ASP, GLU    |
**charged**        |basic or acidic residue                |
**polar**          |polar amino acid residue: ASN, CYS, GLN, SER, THR, TYR|
**nonpolar**       |non-polar amino acid residue: ALA, ILE, LEU, MET, PHE, PRO, TRP, VAL|
**aromatic**       |aromatic amino acid residue: PHE, TRP, TYR|
**nucleic**        |nucleic residue                        |
**purine**         |purine nucleic residue: A, G, I and variations|
**pyrimidine**     |pyrimidine nucleic residue: C, T, U and variations|
**polarh**         |polar hydrogens are hydrogens that are boud to anything other than carbon, e.g. nitrogen, oxygen, sulphur|
**nonpolarh**      |non-polar hydrogens are hydrogens that are bonded to carbon|
**chain** _str_    |chain by name                          |chain A, C, E
