import zipfile
import pathlib
import xml.etree.ElementTree as ET
path = pathlib.Path(r'C:/Users/eboluecc/Downloads/Equipment_Analytics_2026 Capacity Coordination.xlsx')
print('path', path)
with zipfile.ZipFile(path, 'r') as z:
    wb = ET.parse(z.open('xl/workbook.xml')).getroot()
    ns = {'x':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    print('sheets:')
    sheets = []
    for sheet in wb.findall('.//x:sheet', ns):
        name = sheet.attrib.get('name')
        relId = sheet.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')
        sheets.append((name, relId))
        print(name, relId)
    rels = ET.parse(z.open('xl/_rels/workbook.xml.rels')).getroot()
    for name, relId in sheets:
        target = rels.find(f".//{{http://schemas.openxmlformats.org/package/2006/relationships}}Relationship[@Id='{relId}']").attrib['Target']
        print('  path', target)
