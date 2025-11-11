# Certificate Generation System

This system provides bulk certificate generation capabilities for the Quizzy platform.

## Features

- **Bulk Certificate Generation**: Generate certificates for multiple students at once
- **Customizable Templates**: Use PNG templates with customizable text fields
- **QR Code Verification**: Add QR codes for certificate verification
- **Email Integration**: Send certificates via email (requires SMTP configuration)
- **Multiple Formats**: Generate both PNG and PDF certificates
- **Web Interface**: User-friendly React component for admins

## Installation

### Python Dependencies

Install the required Python packages:

```bash
pip install -r requirements.txt
```

Required packages:
- Pillow (PIL) - Image processing
- pandas - Data manipulation
- qrcode - QR code generation
- tqdm - Progress bars
- openpyxl - Excel file support
- reportlab - PDF generation

## Usage

### 1. Create Certificate Template

Run the template creation script:

```bash
python create_template.py
```

This creates a basic certificate template (`certificate_template.png`).

### 2. Prepare Participant Data

Create a JSON, Excel, or CSV file with participant data. Example format:

```json
[
  {
    "Name": "John Doe",
    "Course": "Mathematics Fundamentals",
    "Date": "2025-11-11",
    "Grade": "A",
    "Email": "john@student.com"
  }
]
```

### 3. Generate Certificates

Use the command-line interface:

```bash
python certificate_generator.py sample_participants.json certificate_template.png --output certificates_output
```

Or use the test script:

```bash
python test_certificates.py
```

### 4. Web Interface

Access the bulk certificate generator through the admin panel in the Quizzy web application:

1. Log in as an admin
2. Navigate to "Bulk Certificates" in the sidebar
3. Select an exam with completed participants
4. Click "Generate Certificates"
5. Download certificates or send via email

## API Endpoints

### Generate Bulk Certificates

```
POST /api/certificates/generate-bulk
```

Request body:
```json
{
  "examId": "exam_id",
  "participants": [
    {
      "studentId": "student_id",
      "score": 85
    }
  ]
}
```

## Configuration

### Field Configuration

Customize certificate fields in the `field_config` dictionary:

```python
field_config = {
    'Name': {
        'position': (400, 500),  # (x, y) coordinates
        'font_size': 80,
        'color': (0, 0, 0),     # RGB tuple
        'center': True           # Center align text
    }
}
```

### Email Configuration

Set environment variables for email functionality:

```bash
export SMTP_USER="your_email@gmail.com"
export SMTP_PASS="your_app_password"
export SMTP_SERVER="smtp.gmail.com"
export SMTP_PORT="587"
```

## File Structure

```
backend/
├── certificate_generator.py      # Main generator class
├── create_template.py           # Template creation script
├── test_certificates.py         # Test script
├── requirements.txt             # Python dependencies
├── sample_participants.json     # Sample data
└── certificate_template.png     # Generated template
```

## Integration with Quizzy

The certificate generation system integrates with the existing Quizzy platform:

- Certificates are stored in the database with verification codes
- QR codes link to verification endpoints
- Bulk generation is available through the admin interface
- Individual certificates can be downloaded by students

## Security Features

- Certificate verification via unique codes
- QR code validation
- Secure file generation
- Admin-only bulk operations

## Troubleshooting

### Common Issues

1. **Font not found**: Install system fonts or use default fonts
2. **Template not found**: Run `create_template.py` first
3. **Email not sending**: Check SMTP configuration
4. **Permission errors**: Ensure write permissions for output directory

### Logs

Check the console output for detailed error messages and generation statistics.