"""
Test script to verify SendGrid email configuration is working.
Run this script to send a test email and verify your setup.
"""

import os
from dotenv import load_dotenv
from email_service import send_test_email, is_email_configured

load_dotenv()


def main():
    print("=" * 50)
    print("CodeRecall Email Service Test")
    print("=" * 50)
    
    # Check configuration
    print("\n1. Checking email configuration...")
    
    api_key = os.getenv("SENDGRID_API_KEY")
    from_email = os.getenv("SENDGRID_FROM_EMAIL")
    from_name = os.getenv("SENDGRID_FROM_NAME")
    
    print(f"   SENDGRID_API_KEY: {'✓ Set' if api_key else '✗ Not set'}")
    print(f"   SENDGRID_FROM_EMAIL: {from_email or '✗ Not set'}")
    print(f"   SENDGRID_FROM_NAME: {from_name or '✗ Not set'}")
    
    if not is_email_configured():
        print("\n❌ Email service is not properly configured.")
        print("   Please ensure SENDGRID_API_KEY and SENDGRID_FROM_EMAIL are set in .env")
        return
    
    print("\n✓ Email configuration looks good!")
    
    # Prompt for test email
    print("\n2. Send test email...")
    test_email = input("   Enter your email address to receive a test email: ").strip()
    
    if not test_email:
        print("   No email entered. Exiting.")
        return
    
    test_name = input("   Enter your name (optional, press Enter to skip): ").strip() or "Test User"
    
    print(f"\n3. Sending test email to {test_email}...")
    
    success = send_test_email(test_email, test_name)
    
    if success:
        print("\n✅ SUCCESS! Test email sent successfully.")
        print(f"   Check your inbox at {test_email}")
        print("   (Don't forget to check your spam folder)")
    else:
        print("\n❌ FAILED to send test email.")
        print("   Please check:")
        print("   - Your SendGrid API key is valid")
        print("   - Your sender email is verified in SendGrid")
        print("   - Check the console for any error messages")


if __name__ == "__main__":
    main()
