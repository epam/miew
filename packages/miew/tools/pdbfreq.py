import sys
import os
import re
from collections import defaultdict

tag_props = {
  'ATOM': {
    'name':    (13, 16),
    'altLoc':  (17, 17),
    'resName': (18, 20),
    'chainID': (22, 22),
    'iCode':   (27, 27),
    'element': (77, 78),
    'charge':  (79, 80),
  },
  'HELIX': {
    'class':   (39, 40),
  },
}

tag_props['HETATM'] = tag_props['ATOM']

elements = set(['C','N','O'])
resNamesAmino = set([
  'ALA','ARG','ASN','ASP','CYS','GLY','GLU','GLN','HIS','ILE',
  'LEU','LYS','MET','PHE','PRO','SEC','SER','THR','TRP','TYR','VAL',
])
resNamesNucleic = set([
  '  A','  C','  G','  I','  T','  U',
  ' DA',' DC',' DG',' DI',' DT',' DU',
  ' +A',' +C',' +G',' +I',' +T',' +U',
])
resNames = resNamesAmino | resNamesNucleic

tag_stats = defaultdict(lambda: defaultdict(lambda: defaultdict(set)))
files = []

def process_file(filename):
  print 'Processing %s...' % filename
  stats = defaultdict(int)
  stats_props = defaultdict(set)
  with open(filename) as f:
    for line in f:
      tag = line[0:6].strip().upper()
      if tag == 'REMARK':
        num = line[7:10].strip()
        if line[10] == ' ' and re.match(r'\d+', num):
          tag = '%s %s' % (tag, num)
      stats[tag] += 1
      if tag in tag_props:
        props = tag_props[tag]
        for key in props:
          left, right = props[key]
          value = line[left-1:right]
          tag_stats[tag][key][value].add(os.path.splitext(os.path.basename(filename))[0])
          stats_props['%s %s' % (tag, key)].add(value)
          if key == 'resName':
            if tag == 'ATOM':
              if value not in resNames:
                stats_props['%s %s_OTHER' % (tag, key)].add(value)
              elif value in resNamesNucleic:
                stats_props['%s %s_NUCLEIC' % (tag, key)].add(value)
              else:
                stats_props['%s %s_AMINO' % (tag, key)].add(value)
            elif tag == 'HETATM' and value in resNames:
              if value in resNamesNucleic:
                stats_props['%s %s_NUCLEIC' % (tag, key)].add(value)
              elif value in resNamesAmino:
                stats_props['%s %s_AMINO' % (tag, key)].add(value)
          elif key == 'element':
            if value.strip() not in elements:
              stats['%s %s_%s' % (tag, key, value.strip())] += 1
          elif key == 'charge':
            if value.strip():
              stats['%s %s_%s' % (tag, key, value.strip())] += 1
      if tag == 'COMPND':
        content = line[10:]
        if re.match(r'\s*MOL_ID: ', content):
          stats['COMPND MOL_ID'] += 1
      if tag.startswith('REMARK '):
        content = line[11:]
        if tag == 'REMARK 350':
          if re.match(r'\s*BIOMT\d ', content):
            stats['REMARK 350 BIOMTn'] += 1
          elif re.match(r'\s*BIOMOLECULE:', content):
            stats['REMARK 350 BIOMOLECULE'] += 1
        if tag == 'REMARK 290':
          if re.match(r'\s*SMTRY\d ', content):
            stats['REMARK 290 SMTRYn'] += 1
        
  files.append((os.path.basename(filename), stats, stats_props))

def process_dir(dirname):
  for name in os.listdir(dirname):
    if name.lower().endswith('.pdb'):
      process_file(os.path.join(dirname, name))

def write_csv():
  # create subtotals
  stats_total = defaultdict(int)
  stats_props_total = defaultdict(set)
  for filename, stats, stats_props in files:
    for tag, count in stats.items():
      stats_total[tag] = max(stats_total[tag], count)
    for prop, values in stats_props.items():
      stats_props_total[prop] = stats_props_total[prop].union(values)
  files.append(('.ALL', stats_total, stats_props_total))
  
  # add unique properties to stats
  for filename, stats, stats_props in files:
    for prop, values in stats_props.items():
      stats[prop] = len(values)

  with open('pdbfreq_tags.csv', 'w') as f:
    keys = sorted(stats_total.keys())
    f.write('filename,%s\n' % ','.join(keys))
    for filename, stats, stats_props in sorted(files, key = lambda x: x[0]):
      if 'REMARK 350 BIOMTn' in stats.keys():
        stats['REMARK 350 BIOMTn'] /= 3
      if 'REMARK 290 SMTRYn' in stats.keys():
        stats['REMARK 290 SMTRYn'] /= 3
      f.write('%s,%s\n' % (filename, ','.join(str(stats[key]) for key in keys)))

  hrule = '-' * 78 + '\n'
  with open('pdbfreq_fields.txt', 'w') as f:
    tags = sorted(tag_stats.keys())
    for tag in tags:
      props = tag_props[tag]
      for key in sorted(props.keys()):
        f.write(hrule)
        f.write('%s.%s\n' % (tag, key))
        f.write(hrule)
        values_dict = tag_stats[tag][key]
        values = sorted(values_dict.keys())
        for value in values:
          f.write('%-5s : %s\n' % (value, ', '.join(sorted(values_dict[value]))))

if __name__ == '__main__':
  if len(sys.argv) < 2:
    print 'usage: %s (<pdbfile> | <dir>)' % os.path.basename(__file__)
    sys.exit()

  arg = sys.argv[1]
  if os.path.isdir(arg):
    process_dir(arg)
  elif os.path.isfile(arg):
    process_file(arg)
  else:
    print('ERROR: not file or directory (%s)' % arg)
    sys.exit()

  write_csv()
