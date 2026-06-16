import zipfile
import pathlib
import xml.etree.ElementTree as ET
from collections import defaultdict
path = pathlib.Path(r'C:/Users/eboluecc/Downloads/Equipment_Analytics_2026 Capacity Coordination.xlsx')

def load_shared_strings(z):
    try:
        tree = ET.parse(z.open('xl/sharedStrings.xml'))
    except KeyError:
        return []
    root = tree.getroot()
    strings = []
    for si in root.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si'):
        text = ''.join([t.text or '' for t in si.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t')])
        strings.append(text)
    return strings

with zipfile.ZipFile(path, 'r') as z:
    strings = load_shared_strings(z)
    sheet = ET.parse(z.open('xl/worksheets/sheet1.xml')).getroot()
    ns = {'x':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    rows = []
    for row in sheet.findall('.//x:row', ns):
        values = []
        for c in row.findall('x:c', ns):
            cell_type = c.attrib.get('t')
            v = c.find('x:v', ns)
            if v is None:
                values.append('')
            elif cell_type == 's':
                values.append(strings[int(v.text)])
            else:
                values.append(v.text)
        rows.append(values)
    for i, row in enumerate(rows[:20], 1):
        print(i, row)
    print('total rows', len(rows))
