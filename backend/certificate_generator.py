#!/usr/bin/env python3
"""
Certificate Generator for Quizzy Platform
Generates personalized certificates from templates and participant data
"""

import pandas as pd
import os
from PIL import Image, ImageDraw, ImageFont  # type: ignore
from datetime import datetime
import qrcode
from io import BytesIO
import argparse
import json
from tqdm import tqdm
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from email.mime.text import MIMEText

class CertificateGenerator:
    """
    Professional certificate generator for bulk certificate creation
    """

    def __init__(self, template_path, output_folder='certificates_output'):
        self.template_path = template_path
        self.output_folder = output_folder
        self.stats = {'success': 0, 'failed': 0, 'errors': []}

        # Create output folder
        os.makedirs(output_folder, exist_ok=True)

        # Validate template
        if not os.path.exists(template_path):
            raise FileNotFoundError(f"Template not found: {template_path}")

    def load_data(self, data_source):
        """
        Load participant data from Excel, CSV, or JSON
        """
        ext = os.path.splitext(data_source)[1].lower()

        if ext in ['.xlsx', '.xls']:
            return pd.read_excel(data_source)
        elif ext == '.csv':
            return pd.read_csv(data_source)
        elif ext == '.json':
            with open(data_source, 'r') as f:
                data = json.load(f)
            return pd.DataFrame(data)
        else:
            raise ValueError(f"Unsupported file format: {ext}")

    def validate_data(self, df, required_columns=['Name']):
        """
        Validate that dataframe has required columns
        """
        missing = set(required_columns) - set(df.columns)
        if missing:
            raise ValueError(f"Missing required columns: {missing}")
        return True

    def generate_batch(self, data_source, field_config, generate_qr=True, send_email=False):
        """
        Generate certificates for all participants in batch

        Args:
            data_source: Path to Excel/CSV/JSON file
            field_config: Dict with field positions and styling
            generate_qr: Whether to add QR codes for verification
            send_email: Whether to send certificates via email
        """
        # Load and validate data
        df = self.load_data(data_source)
        self.validate_data(df, field_config.keys())

        print(f"Generating {len(df)} certificates...")

        # Generate each certificate
        for index, row in tqdm(df.iterrows(), total=len(df), desc="Generating Certificates"):
            try:
                certificate_path = self._generate_single(row, field_config, generate_qr)

                # Send email if requested
                if send_email and 'Email' in row:
                    self._send_certificate_email(
                        row['Email'],
                        certificate_path,
                        row.get('Name', 'Student')
                    )

                self.stats['success'] += 1
                print(f"✓ Generated certificate for {row.get('Name', f'Row {index}')}")
            except Exception as e:
                self.stats['failed'] += 1
                self.stats['errors'].append({
                    'name': row.get('Name', f'Row {index}'),
                    'error': str(e)
                })
                print(f"✗ Failed for {row.get('Name', f'Row {index}')}: {e}")

        self._print_summary()
        return self.stats

    def _generate_single(self, data, field_config, generate_qr=True):
        """
        Generate a single certificate
        """
        # Load template
        img = Image.open(self.template_path)
        draw = ImageDraw.Draw(img)

        # Draw each field
        for field_name, config in field_config.items():
            text = str(data.get(field_name, ''))
            if pd.isna(text) or text == 'nan':
                text = ''

            position = config['position']
            font_size = config.get('font_size', 60)
            color = config.get('color', (0, 0, 0))
            font_path = config.get('font', 'arial.ttf')

            # Load font
            try:
                font = ImageFont.truetype(font_path, font_size)
            except:
                font = ImageFont.load_default()

            # Center text if specified
            if config.get('center', False):
                try:
                    text_width = draw.textlength(text, font=font)
                    position = ((img.width - text_width) / 2, position[1])
                except:
                    # Fallback for older PIL versions
                    position = ((img.width - len(text) * font_size * 0.6) / 2, position[1])

            # Draw text
            draw.text(position, text, fill=color, font=font)

        # Add QR code if requested
        if generate_qr:
            certificate_id = data.get('CertificateID', f"CERT-{datetime.now().strftime('%Y%m%d')}-{data.name}")
            img = self._add_qr_code(img, certificate_id)

        # Generate filename
        name = data.get('Name', f'certificate_{data.name}')
        # Sanitize filename
        safe_name = "".join(c for c in name if c.isalnum() or c in (' ', '_', '-')).strip()

        # Save as PNG
        png_path = os.path.join(self.output_folder, f'{safe_name}.png')
        img.save(png_path)

        # Also save as PDF
        pdf_path = os.path.join(self.output_folder, f'{safe_name}.pdf')
        img.save(pdf_path, 'PDF', resolution=100.0)

        return png_path

    def _add_qr_code(self, img, certificate_id, position=(50, 50)):
        """
        Add QR code to certificate for verification
        """
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=2)
        qr.add_data(f"https://quizzy-platform.com/verify/{certificate_id}")
        qr.make(fit=True)

        qr_img = qr.make_image(fill_color="black", back_color="white")

        # Resize and paste onto certificate
        qr_img = qr_img.resize((100, 100))
        img.paste(qr_img, position)

        return img

    def _send_certificate_email(self, recipient_email, certificate_path, recipient_name):
        """
        Send certificate via email
        """
        try:
            # Email configuration (should be loaded from environment variables)
            sender_email = os.getenv('SMTP_USER', 'noreply@quizzy-platform.com')
            password = os.getenv('SMTP_PASS', '')
            smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
            smtp_port = int(os.getenv('SMTP_PORT', '587'))

            if not password:
                print(f"⚠️  Email not sent to {recipient_email} - SMTP credentials not configured")
                return

            msg = MIMEMultipart()
            msg['From'] = sender_email
            msg['To'] = recipient_email
            msg['Subject'] = f"Your Certificate - {recipient_name}"

            # Email body
            body = f"""
Dear {recipient_name},

Congratulations! Your certificate has been generated and is attached to this email.

Certificate Details:
- Issued: {datetime.now().strftime('%Y-%m-%d')}
- Platform: Quizzy Learning Platform

Please keep this certificate for your records.

Best regards,
Quizzy Team
            """
            msg.attach(MIMEText(body, 'plain'))

            # Attach certificate
            with open(certificate_path, 'rb') as file:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(file.read())
                encoders.encode_base64(part)
                part.add_header('Content-Disposition', f'attachment; filename={os.path.basename(certificate_path)}')
                msg.attach(part)

            # Send email
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(sender_email, password)
                server.send_message(msg)

        except Exception as e:
            print(f"⚠️  Failed to send email to {recipient_email}: {e}")

    def _print_summary(self):
        """Print generation summary"""
        print("\n" + "="*60)
        print("Certificate Generation Summary")
        print("="*60)
        print(f"✓ Successful: {self.stats['success']}")
        print(f"✗ Failed: {self.stats['failed']}")

        if self.stats['errors']:
            print("\nErrors:")
            for error in self.stats['errors']:
                print(f"  - {error['name']}: {error['error']}")
        print("="*60)


def main():
    parser = argparse.ArgumentParser(description='Generate certificates from template and data')
    parser.add_argument('data_file', help='Path to Excel/CSV/JSON file with participant data')
    parser.add_argument('template_file', help='Path to certificate template image')
    parser.add_argument('--output', '-o', default='certificates_output', help='Output folder')
    parser.add_argument('--config', '-c', help='JSON file with field configuration')
    parser.add_argument('--no-qr', action='store_true', help='Skip QR code generation')
    parser.add_argument('--send-email', action='store_true', help='Send certificates via email')

    args = parser.parse_args()

    # Default field configuration
    field_config = {
        'Name': {
            'position': (400, 500),
            'font_size': 80,
            'color': (0, 0, 0),
            'center': True
        },
        'Course': {
            'position': (400, 600),
            'font_size': 60,
            'color': (0, 0, 139),
            'center': True
        },
        'Date': {
            'position': (400, 700),
            'font_size': 50,
            'color': (100, 100, 100),
            'center': True
        },
        'Grade': {
            'position': (400, 800),
            'font_size': 60,
            'color': (0, 100, 0),
            'center': True
        }
    }

    # Load custom config if provided
    if args.config:
        with open(args.config, 'r') as f:
            field_config = json.load(f)

    # Initialize generator
    generator = CertificateGenerator(args.template_file, args.output)

    # Generate certificates
    results = generator.generate_batch(
        args.data_file,
        field_config,
        generate_qr=not args.no_qr,
        send_email=args.send_email
    )

    return results


if __name__ == "__main__":
    main()