import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import CIFParser from './CIFParser';

chai.use(dirtyChai);

const MINIMAL_CIF_HEADER = `
data_TEST
#
_entry.id TEST
_struct.title 'TEST TITLE'
_struct_keywords.pdbx_keywords 'TEST PROTEIN'
_entity.id 1
_entity.pdbx_description 'TEST PROTEIN'
`;

const MINIMAL_ATOM_LOOP = `
loop_
_atom_site.group_PDB
_atom_site.id
_atom_site.type_symbol
_atom_site.label_atom_id
_atom_site.label_alt_id
_atom_site.label_comp_id
_atom_site.label_asym_id
_atom_site.label_entity_id
_atom_site.label_seq_id
_atom_site.pdbx_PDB_ins_code
_atom_site.Cartn_x
_atom_site.Cartn_y
_atom_site.Cartn_z
_atom_site.occupancy
_atom_site.B_iso_or_equiv
_atom_site.auth_seq_id
_atom_site.auth_comp_id
_atom_site.auth_asym_id
_atom_site.auth_atom_id
_atom_site.pdbx_PDB_model_num
ATOM 1 C CA . ALA A 1 1 ? 0.000 0.000 0.000 1.00 0.00 1 ALA A CA 1
`;

describe('CIFParser', () => {
  describe('unit cell parsing', () => {
    it('populates complex.unitCell from _cell and _symmetry categories', () => {
      const cifData = `
${MINIMAL_CIF_HEADER}
_cell.entry_id TEST
_cell.length_a 50.000
_cell.length_b 60.000
_cell.length_c 70.000
_cell.angle_alpha 90.000
_cell.angle_beta 95.500
_cell.angle_gamma 90.000
#
_symmetry.entry_id TEST
_symmetry.space_group_name_H-M 'P 1 21 1'
${MINIMAL_ATOM_LOOP}
`;

      const parser = new CIFParser(cifData, {});
      const complex = parser.parseSync();

      expect(complex.unitCell).to.not.be.null();
      expect(complex.unitCell.a).to.equal(50.0);
      expect(complex.unitCell.b).to.equal(60.0);
      expect(complex.unitCell.c).to.equal(70.0);
      expect(complex.unitCell.alpha).to.equal(90.0);
      expect(complex.unitCell.beta).to.equal(95.5);
      expect(complex.unitCell.gamma).to.equal(90.0);
      expect(complex.unitCell.spaceGroup).to.equal('P 1 21 1');
    });

    it('leaves complex.unitCell null when _cell category is absent', () => {
      const cifData = `
${MINIMAL_CIF_HEADER}
${MINIMAL_ATOM_LOOP}
`;

      const parser = new CIFParser(cifData, {});
      const complex = parser.parseSync();

      expect(complex.unitCell).to.be.null();
    });
  });
});
