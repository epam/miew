#!python3

import sys
import os
import umsgpack
import json

class BinaryEncoder(json.JSONEncoder):
  def default(self, obj):
    if isinstance(obj, bytes):
      return 'BINARY: ' + ' '.join(map(lambda x: '%02X' % x, obj))
    return json.JSONEncoder.default(self, obj)

def process_file(filename):
  with open(filename, 'rb') as fi:
    with open(filename + '.json', 'w') as fo:
      fo.write(json.dumps(umsgpack.unpack(fi), indent=2, sort_keys=True, cls=BinaryEncoder))

if __name__ == '__main__':
  if len(sys.argv) < 2 or not os.path.isfile(sys.argv[1]):
    print('usage: %s <mmtf_file>' % os.path.basename(__file__))
    sys.exit()

  process_file(sys.argv[1])
