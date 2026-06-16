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
    count=0
    for row in sheet.findall('.//x:row', ns):
        r=row.attrib.get('r')
        cells=[]
        for c in row.findall('x:c', ns):
            v=c.find('x:v', ns)
            if v is None:
                continue
            if c.attrib.get('t')=='s':
                text=strings[int(v.text)]
            else:
                text=v.text
            if text not in ('', None):
                cells.append((c.attrib.get('r'), text))
        if cells:
            count+=1
            if count<=80:
                print('row', r, cells)
    print('row count with values', count)
