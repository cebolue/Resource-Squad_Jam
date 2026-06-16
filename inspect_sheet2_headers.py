import zipfile
import pathlib
import xml.etree.ElementTree as ET
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
    sheet = ET.parse(z.open('xl/worksheets/sheet2.xml')).getroot()
    ns = {'x':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    for row in sheet.findall('.//x:row', ns):
        if row.attrib.get('r') in ('22','23','24','25'):
            print('ROW', row.attrib.get('r'))
            for c in row.findall('x:c', ns):
                ref = c.attrib.get('r')
                cell_type = c.attrib.get('t')
                v = c.find('x:v', ns)
                if v is None:
                    value = ''
                elif cell_type == 's':
                    value = strings[int(v.text)]
                else:
                    value = v.text
                print(ref, value)
            print('---')
