#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
send_email.py  —  Email sender for RODCHAOMAHACHAI
เรียกใช้โดย C server ผ่าน popen():
  python3 send_email.py <to> <refCode> <fname> <lname> <car> <start> <end> <total>
"""

import sys
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text      import MIMEText
from email.header         import Header
from datetime             import datetime

# ══════════════════════════════
#  CONFIG  ← แก้ที่นี่
# ══════════════════════════════
GMAIL_USER = 'tapatauto9898@gmail.com'
GMAIL_PASS = 'uqub ngtj puvi ycjv'   # App Password 16 หลัก
FROM_NAME  = 'รถเช่ามหาชัย'
# ══════════════════════════════

def build_html(to_email, ref, fname, lname, car, start, end, total):
    """สร้าง HTML body สำหรับอีเมลยืนยันการจอง"""
    return f"""<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Sarabun',sans-serif;background:#0a0a0f;color:#f0f0f0;">
  <div style="background:#13131a;max-width:600px;margin:24px auto;border-radius:16px;
              border:1px solid rgba(232,197,71,0.25);overflow:hidden;">

    <!-- Header -->
    <div style="padding:36px;text-align:center;background:#1a1a25;
                border-bottom:1px solid rgba(232,197,71,0.15);">
      <h1 style="color:#e8c547;margin:0;font-size:28px;letter-spacing:2px;">
        🎉 BOOKING SUCCESS!
      </h1>
      <p style="color:#888;margin:8px 0 0;">รหัสการจอง</p>
      <div style="color:#e8c547;font-size:24px;font-weight:700;
                  letter-spacing:4px;">#{ref}</div>
    </div>

    <!-- Ref Code -->
    <div style="padding:24px 30px 0;">
      <div style="background:#1a1a25;padding:18px 20px;border-radius:12px;
                  border-left:4px solid #e8c547;margin-bottom:20px;">
        <div style="color:#e8c547;font-size:26px;font-weight:700;
                    letter-spacing:4px;">ขอขอบคุณที่ไว้ใจเรา</div>
      </div>

      <!-- Details -->
      <table style="width:100%;border-collapse:collapse;font-size:15px;">
        <tr>
          <td style="padding:10px 0;color:#888;width:40%;">👤 ชื่อลูกค้า</td>
          <td style="padding:10px 0;font-weight:600;">{fname} {lname}</td>
        </tr>
        <tr style="border-top:1px solid rgba(255,255,255,0.06);">
          <td style="padding:10px 0;color:#888;">🚗 รถยนต์</td>
          <td style="padding:10px 0;font-weight:600;">{car}</td>
        </tr>
        <tr style="border-top:1px solid rgba(255,255,255,0.06);">
          <td style="padding:10px 0;color:#888;">📅 วันเริ่มต้น</td>
          <td style="padding:10px 0;font-weight:600;">{start}</td>
        </tr>
        <tr style="border-top:1px solid rgba(255,255,255,0.06);">
          <td style="padding:10px 0;color:#888;">📅 วันสิ้นสุด</td>
          <td style="padding:10px 0;font-weight:600;">{end}</td>
        </tr>
        <tr style="border-top:1px solid rgba(255,255,255,0.06);">
          <td style="padding:10px 0;color:#888;">💰 ยอดชำระ</td>
          <td style="padding:10px 0;font-size:20px;font-weight:700;color:#ff6b35;">
            {int(float(total or 0)):,} ฿
          </td>
        </tr>
      </table>
    </div>

    <!-- Note -->
    <div style="padding:20px 30px;">
      <div style="background:rgba(255,107,53,0.08);border:1px solid rgba(255,107,53,0.25);
                  border-radius:10px;padding:14px 16px;font-size:13px;color:#ff6b35;">
        ⚠️ กรุณาเก็บประวัติการจองไว้เพื่อใช้ตรวจสอบหรือยกเลิกการจอง
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:20px 30px;border-top:1px solid rgba(255,255,255,0.06);
                text-align:center;font-size:12px;color:#555;">
      อีเมลนี้ถูกส่งอัตโนมัติจากระบบจองรถ RODCHAOMAHACHAI<br>
      ส่งเมื่อ {datetime.now().strftime('%d/%m/%Y %H:%M')} น.
    </div>
  </div>
</body>
</html>"""


def send(to_email, ref, fname, lname, car, start, end, total):
    msg = MIMEMultipart('alternative')
    msg['From']    = f'{FROM_NAME} <{GMAIL_USER}>'
    msg['To']      = to_email
    msg['Subject'] = Header(f'ยืนยันการจองรถหมายเลข #{ref} — รถเช่ามหาชัย', 'utf-8')

    # plain text fallback
    plain = (f"ยืนยันการจอง #{ref}\n"
             f"ชื่อ: {fname} {lname}\n"
             f"รถ: {car}\n"
             f"วันเช่า: {start} ถึง {end}\n"
             f"ยอด: {total} บาท")

    msg.attach(MIMEText(plain, 'plain', 'utf-8'))
    msg.attach(MIMEText(build_html(to_email, ref, fname, lname, car, start, end, total),
                        'html', 'utf-8'))

    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.ehlo()
        server.starttls()
        server.login(GMAIL_USER, GMAIL_PASS)
        server.sendmail(GMAIL_USER, [to_email], msg.as_string())

    print(f'[EMAIL] sent to {to_email} ref={ref}', flush=True)


# เพิ่มฟังก์ชันนี้ต่อจาก build_html เดิม
def build_cancel_html(to_email, fname, lname, car, start, end):
    """สร้าง HTML body สำหรับอีเมลแจ้งยกเลิกการจอง"""
    return f"""<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Sarabun',sans-serif;background:#0a0a0f;color:#f0f0f0;">
  <div style="background:#13131a;max-width:600px;margin:24px auto;border-radius:16px;
              border:1px solid rgba(255,107,53,0.25);overflow:hidden;">

    <div style="padding:36px;text-align:center;background:#1a1a25;
                border-bottom:1px solid rgba(255,107,53,0.15);">
      <h1 style="color:#ff6b35;margin:0;font-size:28px;letter-spacing:2px;">
        ❌ CANCELLATION SUCCESS
      </h1>
      <p style="color:#888;margin:8px 0 0;">ระบบดำเนินการยกเลิกการจองของท่านเรียบร้อยแล้ว</p>
    </div>

    <div style="padding:24px 30px 0;">
      <div style="background:#1a1a25;padding:18px 20px;border-radius:12px;
                  border-left:4px solid #ff6b35;margin-bottom:20px;">
        <div style="color:#888;font-size:12px;text-transform:uppercase;
                    letter-spacing:1px;margin-bottom:6px;">รหัสการจองที่ถูกยกเลิก</div>
        <div style="color:#ff6b35;font-size:26px;font-weight:700;
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:15px;">
        <tr>
          <td style="padding:10px 0;color:#888;width:40%;">👤 ชื่อลูกค้า</td>
          <td style="padding:10px 0;font-weight:600;">{fname} {lname}</td>
        </tr>
        <tr style="border-top:1px solid rgba(255,255,255,0.06);">
          <td style="padding:10px 0;color:#888;">🚗 รถยนต์</td>
          <td style="padding:10px 0;font-weight:600;">{car}</td>
        </tr>
        <tr style="border-top:1px solid rgba(255,255,255,0.06);">
          <td style="padding:10px 0;color:#888;">📅 ช่วงเวลาเดิม</td>
          <td style="padding:10px 0;font-weight:600;">{start} ถึง {end}</td>
        </tr>
      </table>
    </div>

    <div style="padding:20px 30px;">
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);
                  border-radius:10px;padding:14px 16px;font-size:13px;color:#aaa;text-align:center;">
        หวังว่าเราจะได้มีโอกาสให้บริการท่านอีกครั้งในเร็วๆ นี้
      </div>
    </div>

    <div style="padding:20px 30px;border-top:1px solid rgba(255,255,255,0.06);
                text-align:center;font-size:12px;color:#555;">
      อีเมลนี้ถูกส่งอัตโนมัติจากระบบจองรถ RODCHAOMAHACHAI<br>
      ส่งเมื่อ {datetime.now().strftime('%d/%m/%Y %H:%M')} น.
    </div>
  </div>
</body>
</html>"""

# แก้ไขส่วน main เพื่อแยกประเภทอีเมล
if __name__ == "__main__":
    # เช็คว่ามี argument อย่างน้อย mode, to_email, ref (รวมชื่อไฟล์เป็น 4)
    if len(sys.argv) < 4:
        print("Usage: python send_email.py <mode> <to_email> <ref> ...")
        sys.exit(1)

    # ใช้การดึงค่าแบบปลอดภัย ถ้าไม่มีให้เป็นค่าว่าง ""
    mode     = sys.argv[1] if len(sys.argv) > 1 else "book"
    to_email = sys.argv[2] if len(sys.argv) > 2 else ""
    ref      = sys.argv[3] if len(sys.argv) > 3 else "N/A"
    fname    = sys.argv[4] if len(sys.argv) > 4 else ""
    lname    = sys.argv[5] if len(sys.argv) > 5 else ""
    car      = sys.argv[6] if len(sys.argv) > 6 else "Unknown Car"
    start    = sys.argv[7] if len(sys.argv) > 7 else "-"
    end      = sys.argv[8] if len(sys.argv) > 8 else "-"
    total    = sys.argv[9] if len(sys.argv) > 9 else "0" # ป้องกัน IndexError ตรงนี้

    msg = MIMEMultipart('alternative')
    msg['From'] = f"{FROM_NAME} <{GMAIL_USER}>"
    msg['To'] = to_email

    if mode == "cancel":
        msg['Subject'] = Header(f"แจ้งยกเลิกการจอง #{ref}", 'utf-8')
        html = build_cancel_html(to_email, fname, lname, car, start, end)
    else:
        msg['Subject'] = Header(f"ยืนยันการจองรถ #{ref}", 'utf-8')
        html = build_html(to_email, ref, fname, lname, car, start, end, total)

    msg.attach(MIMEText(html, 'html', 'utf-8'))

    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(GMAIL_USER, GMAIL_PASS)
            server.sendmail(GMAIL_USER, [to_email], msg.as_string())
        print("Email sent successfully")
    except Exception as e:
        print(f"Error: {e}")