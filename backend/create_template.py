#!/usr/bin/env python3
"""
Create a basic certificate template
"""

from PIL import Image, ImageDraw, ImageFont  # type: ignore
import os

def create_certificate_template():
    """Create a basic certificate template"""

    # Create image (landscape A4 size: 297x210mm at 100 DPI = 1169x826 pixels)
    width, height = 1169, 826
    img = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(img)

    # Colors
    gold = (184, 134, 11)
    dark_blue = (0, 51, 102)
    gray = (128, 128, 128)

    # Border
    border_width = 10
    draw.rectangle([border_width, border_width, width-border_width, height-border_width],
                   outline=gold, width=border_width)

    # Inner border
    inner_border = 30
    draw.rectangle([inner_border, inner_border, width-inner_border, height-inner_border],
                   outline=dark_blue, width=3)

    # Title
    try:
        title_font = ImageFont.truetype('arial.ttf', 72)
    except:
        title_font = ImageFont.load_default()

    title_text = "CERTIFICATE OF ACHIEVEMENT"
    try:
        title_width = draw.textlength(title_text, font=title_font)
    except:
        title_width = len(title_text) * 72 * 0.6

    draw.text(((width - title_width) / 2, 150), title_text,
              fill=dark_blue, font=title_font)

    # Subtitle
    try:
        subtitle_font = ImageFont.truetype('arial.ttf', 36)
    except:
        subtitle_font = ImageFont.load_default()

    subtitle_text = "This certifies that"
    try:
        subtitle_width = draw.textlength(subtitle_text, font=subtitle_font)
    except:
        subtitle_width = len(subtitle_text) * 36 * 0.6

    draw.text(((width - subtitle_width) / 2, 250), subtitle_text,
              fill=gray, font=subtitle_font)

    # Name placeholder (will be replaced)
    name_text = "[STUDENT NAME]"
    try:
        name_font = ImageFont.truetype('arial.ttf', 60)
    except:
        name_font = ImageFont.load_default()

    try:
        name_width = draw.textlength(name_text, font=name_font)
    except:
        name_width = len(name_text) * 60 * 0.6

    draw.text(((width - name_width) / 2, 350), name_text,
              fill=(0, 0, 0), font=name_font)

    # Course completion text
    course_text = "has successfully completed the course"
    try:
        course_font = ImageFont.truetype('arial.ttf', 36)
    except:
        course_font = ImageFont.load_default()

    try:
        course_width = draw.textlength(course_text, font=course_font)
    except:
        course_width = len(course_text) * 36 * 0.6

    draw.text(((width - course_width) / 2, 450), course_text,
              fill=gray, font=course_font)

    # Course name placeholder
    course_name_text = "[COURSE NAME]"
    try:
        course_name_width = draw.textlength(course_name_text, font=name_font)
    except:
        course_name_width = len(course_name_text) * 60 * 0.6

    draw.text(((width - course_name_width) / 2, 520), course_name_text,
              fill=dark_blue, font=name_font)

    # Date
    date_text = "Date: [DATE]"
    try:
        date_font = ImageFont.truetype('arial.ttf', 32)
    except:
        date_font = ImageFont.load_default()

    try:
        date_width = draw.textlength(date_text, font=date_font)
    except:
        date_width = len(date_text) * 32 * 0.6

    draw.text(((width - date_width) / 2, 620), date_text,
              fill=gray, font=date_font)

    # Grade
    grade_text = "Grade: [GRADE]"
    try:
        grade_width = draw.textlength(grade_text, font=date_font)
    except:
        grade_width = len(grade_text) * 32 * 0.6

    draw.text(((width - grade_width) / 2, 670), grade_text,
              fill=dark_blue, font=date_font)

    # Signature line
    signature_y = 720
    draw.line([200, signature_y, 400, signature_y], fill=gray, width=2)
    draw.line([width-400, signature_y, width-200, signature_y], fill=gray, width=2)

    # Signature labels
    signature_font = ImageFont.load_default()
    draw.text((250, signature_y + 10), "Instructor", fill=gray, font=signature_font)
    draw.text((width-350, signature_y + 10), "Director", fill=gray, font=signature_font)

    # Save template
    template_path = 'certificate_template.png'
    img.save(template_path)
    print(f"Certificate template created: {template_path}")

    return template_path

if __name__ == "__main__":
    create_certificate_template()