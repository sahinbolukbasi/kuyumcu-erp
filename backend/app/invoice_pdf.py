"""Snapshot-only invoice draft rendering; no live profile or estimated amounts."""
import os
from io import BytesIO
from pathlib import Path
from html import escape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether


def font_name():
    name = 'InvoiceUnicode'
    if name not in pdfmetrics.getRegisteredFontNames():
        paths = [os.getenv('INVOICE_FONT_PATH', ''), '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
                 '/System/Library/Fonts/Supplemental/Arial.ttf']
        path = next((p for p in paths if p and Path(p).is_file()), None)
        if not path:
            raise RuntimeError('Türkçe PDF fontu bulunamadı; DejaVu Sans kurunuz.')
        pdfmetrics.registerFont(TTFont(name, path))
    return name


def render_pdf(snapshot):
    stream = BytesIO()
    font = font_name()
    body = ParagraphStyle('Body', fontName=font, fontSize=9, leading=13, spaceAfter=5)
    small = ParagraphStyle('Small', parent=body, fontSize=7, leading=10)
    title = ParagraphStyle('Title', parent=body, fontSize=19, leading=24, textColor=colors.HexColor('#17394d'))
    def p(text, style=body):
        return Paragraph(escape(str(text or '')).replace('\n','<br/>'), style)
    doc = SimpleDocTemplate(stream, pagesize=A4, leftMargin=36, rightMargin=36,
        topMargin=36, bottomMargin=46, title='Fatura Taslağı ' + snapshot['number'], author=snapshot['supplier']['title'])
    story = [p('FATURA TASLAĞI', title), p('MALİ BELGE DEĞİLDİR - GİB / entegratör üzerinden düzenlenmemiştir.', small),
             p(f"Taslak No: {snapshot['number']}   |   Tarih: {snapshot['date']}"),
             p(f"Referans UUID: {snapshot['uuid']}", small),
             p(f"Planlanan belge: {snapshot['document_type']}  |  Alıcı e-Fatura kaydı: {snapshot['recipient_registry']}", small), Spacer(1, 10)]
    supplier, buyer = snapshot['supplier'], snapshot['buyer']
    seller_lines = ['SATICI', supplier['title'], supplier['address'], f"VKN/TCKN: {supplier['tax_number']}",
        f"Vergi dairesi: {supplier['tax_office']}", f"Telefon: {supplier.get('phone', '')}",
        f"E-posta: {supplier.get('email', '')}", f"MERSİS / Sicil: {supplier.get('mersis', '')} / {supplier.get('registry', '')}"]
    buyer_lines = ['ALICI', buyer['title'], buyer['address'], f"VKN/TCKN: {buyer.get('tax_number', '')}",
        f"Vergi dairesi: {buyer.get('tax_office', '')}", f"Telefon: {buyer.get('phone', '')}", f"E-posta: {buyer.get('email', '')}"]
    parties = Table([[p('\n'.join(seller_lines)), p('\n'.join(buyer_lines))]], colWidths=[261, 262])
    parties.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#f1f5f7')),('BOX',(0,0),(-1,-1),0.5,colors.HexColor('#c8d5dc')),('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10)]))
    story += [parties, Spacer(1,12), p(f"Teslim / satış tarihi: {snapshot['delivery_date']}  |  Satış kaydı: {snapshot['sale_reference']}", small)]
    rows = [[p(h, small) for h in ['#','Mal / hizmet','Miktar','Birim fiyat*','KDV matrahı','KDV','Toplam*']]]
    for index, item in enumerate(snapshot['items'], 1):
        rows.append([p(index,small),p(item['name'],small),p(f"{item['quantity']} {item['unit']}",small),
            p(item['unit_price'],small),p(item['taxable'],small),p(f"%{item['rate']} / {item['vat']}",small),p(item['payable'],small)])
    table = Table(rows, colWidths=[21,164,46,73,73,73,73], repeatRows=1, hAlign='LEFT')
    table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('GRID',(0,0),(-1,-1),0.4,colors.HexColor('#c8d5dc')),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e4edf2')),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
    story += [table, p('* Birim fiyat ve toplam KDV dahildir. Para birimi: TRY.', small), Spacer(1,8)]
    totals = snapshot['totals']
    sums = [[p(label),p(totals[key])] for label,key in [('KDV hariç toplam','net'),('Matrah dışında kalan / istisna bedel','excluded'),('KDV matrahı','taxable'),('Hesaplanan KDV','vat'),('Ödenecek toplam (TRY)','payable')]]
    summary = Table(sums, colWidths=[390,133]);summary.setStyle(TableStyle([('LINEABOVE',(0,-1),(-1,-1),1,colors.HexColor('#17394d')),('BACKGROUND',(0,-1),(-1,-1),colors.HexColor('#e4edf2'))]))
    story += [KeepTogether([summary]), Spacer(1,10), p(totals['reason'],small)]
    if snapshot.get('tax_basis_note'): story.append(p('Matrah dayanağı: '+snapshot['tax_basis_note'],small))
    if snapshot.get('notes'): story.append(p('Açıklama: '+snapshot['notes'],small))
    story.append(p('Bu çıktı taslaktır. Resmi fatura numarası, mali mühür/e-imza, alıcı kayıt kontrolü ve ilgili GİB süreçleri resmi düzenleme sırasında tamamlanmalıdır.', small))
    def footer(canvas, document):
        canvas.saveState();canvas.setFont(font,7);canvas.setFillColor(colors.HexColor('#516775'))
        canvas.drawString(36,25,'TASLAK - Mali belge değildir');canvas.drawRightString(A4[0]-36,25,f"Sayfa {document.page}");canvas.restoreState()
    doc.build(story,onFirstPage=footer,onLaterPages=footer)
    return stream.getvalue()
