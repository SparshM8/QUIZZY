#!/usr/bin/env python3
"""
Test script for certificate generation
"""

import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from certificate_generator import CertificateGenerator

def test_certificate_generation():
    """Test the certificate generation functionality"""

    # Create template if it doesn't exist
    template_path = 'certificate_template.png'
    if not os.path.exists(template_path):
        print("Creating certificate template...")
        exec(open('create_template.py').read())

    # Initialize generator
    generator = CertificateGenerator(template_path, 'test_certificates')

    # Field configuration
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

    # Generate certificates
    print("Generating test certificates...")
    results = generator.generate_batch('sample_participants.json', field_config)

    print("Test completed!")
    return results

if __name__ == "__main__":
    test_certificate_generation()