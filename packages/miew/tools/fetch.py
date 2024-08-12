#!python3

import sys
import os
import urllib.request
import gzip

formats = {
  'pdb':  {'type': '',  'url': 'http://files.rcsb.org/download/%s.pdb.gz', 'postprocess': lambda data: gzip.decompress(data).decode('ascii') },
  'cif':  {'type': '',  'url': 'http://files.rcsb.org/download/%s.cif.gz', 'postprocess': lambda data: gzip.decompress(data).decode('ascii') },
  'ccp4': {'type': 'b', 'url': 'https://www.ebi.ac.uk/pdbe/coordinates/files/%s.ccp4', 'postprocess': lambda data: data },
  'dsn6': {'type': 'b', 'url': 'https://edmaps.rcsb.org/maps/%s_2fofc.dsn6', 'postprocess': lambda data: data },
  'pubchem': {'type': '', 'url': 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/%s/JSON?record_type=3d', 'postprocess': lambda data: data.decode('ascii'), 'ext': 'json'},
}

def download(url):
  print('Requesting', url)
  response = urllib.request.urlopen(url)
  data = response.read()
  info = response.info()
  print(info)
  if info['Content-Encoding'] == 'gzip':
    data = gzip.decompress(data)
  return data

def process_request(args):
  file_format = 'pdb'
  if len(args) > 1:
    file_format = args.pop(0)
  file_id = args.pop(0)

  if file_format in formats:
    format = formats[file_format]
    data = format['postprocess'](download(format['url'] % file_id))
    with open('%s.%s' % (file_id, format.get('ext', file_format)), 'w' + format['type']) as f:
      f.write(data)

if __name__ == '__main__':
  if len(sys.argv) < 2:
    print('usage: %s [<type>:]<id>' % os.path.basename(__file__))
    sys.exit()

  process_request(sys.argv[1].split(':'))
