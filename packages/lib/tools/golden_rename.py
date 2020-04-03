import os
import re

for name in os.listdir('.'):
  matched = re.match(r'\d\d\d_(?P<base>\w+\.png)', name)
  if matched:
    basename = matched.group('base')
    if os.path.exists(basename):
      print "SKIPPING %s -> %s, already exists" % (name, basename)
    else:
      os.rename(name, basename)
