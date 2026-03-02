"""
Email Service using SendGrid for sending revision reminder emails.
"""

import os
import logging
import traceback
from typing import List, Dict
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "noreply@coderecall.com")
SENDGRID_FROM_NAME = os.getenv("SENDGRID_FROM_NAME", "CodeRecall")
SENDGRID_REPLY_TO_EMAIL = os.getenv("SENDGRID_REPLY_TO_EMAIL", SENDGRID_FROM_EMAIL)


def is_email_configured() -> bool:
    """Check if email service is properly configured."""
    return bool(SENDGRID_API_KEY and SENDGRID_FROM_EMAIL)


def send_revision_reminder_email(
    to_email: str,
    user_name: str,
    questions: List[Dict]
) -> bool:
    """Build and send an HTML revision reminder email via SendGrid. Returns True on success."""
    if not is_email_configured():
        logger.warning("Email service not configured. Skipping email send.")
        return False
    
    if not questions:
        logger.info(f"No questions to remind for {to_email}, skipping email.")
        return True
    
    try:
        question_rows = ""
        for i, q in enumerate(questions, 1):
            if not isinstance(q, dict):
                logger.warning(f"Question {i} is not a dictionary: {type(q)} - {q}")
                continue
                
            tags_str = ", ".join(q.get("tags", [])) if q.get("tags") else "No tags"
            question_rows += f"""
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 8px; color: #374151;">{i}</td>
                <td style="padding: 12px 8px;">
                    <a href="{q.get('link', '#')}" style="color: #2563eb; text-decoration: none; font-weight: 500;">
                        {q.get('title', 'Untitled')}
                    </a>
                </td>
                <td style="padding: 12px 8px; color: #6b7280;">{q.get('platform', 'Unknown')}</td>
                <td style="padding: 12px 8px; color: #6b7280; font-size: 12px;">{tags_str}</td>
            </tr>
            """
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">CodeRecall</h1>
                    <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 14px;">Daily Revision Reminder</p>
                </div>
                
                <!-- Content -->
                <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <p style="color: #374151; font-size: 16px; margin: 0 0 20px 0;">
                        Hi <strong>{user_name}</strong>,
                    </p>
                    
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px 0;">
                        You have <strong style="color: #2563eb;">{len(questions)} question{"s" if len(questions) > 1 else ""}</strong> due for revision today. 
                        Consistent practice is key to mastering algorithms and data structures.
                    </p>
                    
                    <!-- Questions Table -->
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <thead>
                            <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                                <th style="padding: 12px 8px; text-align: left; color: #374151; font-size: 12px; text-transform: uppercase;">#</th>
                                <th style="padding: 12px 8px; text-align: left; color: #374151; font-size: 12px; text-transform: uppercase;">Question</th>
                                <th style="padding: 12px 8px; text-align: left; color: #374151; font-size: 12px; text-transform: uppercase;">Platform</th>
                                <th style="padding: 12px 8px; text-align: left; color: #374151; font-size: 12px; text-transform: uppercase;">Tags</th>
                            </tr>
                        </thead>
                        <tbody>
                            {question_rows}
                        </tbody>
                    </table>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/" 
                           style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                            Start Revision →
                        </a>
                    </div>
                    
                    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 20px 0 0 0;">
                        Keep up the great work!
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
                    <p style="margin: 0 0 8px 0;">
                        You're receiving this email because you enabled revision reminders.
                    </p>
                    <p style="margin: 0;">
                        <a href="{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/settings" style="color: #6b7280;">
                            Manage notification settings
                        </a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        plain_text_content = f"""
CodeRecall - Daily Revision Reminder

Hi {user_name},

You have {len(questions)} question{"s" if len(questions) > 1 else ""} due for revision today:

"""
        for i, q in enumerate(questions, 1):
            if isinstance(q, dict):
                plain_text_content += f"{i}. {q.get('title', 'Untitled')} ({q.get('platform', 'Unknown')})\n   Link: {q.get('link', 'N/A')}\n\n"
        
        plain_text_content += f"""
Start your revision now: {os.getenv('FRONTEND_URL', 'http://localhost:5173')}/

Keep up the great work!

---
You're receiving this because you enabled revision reminders.
Manage settings: {os.getenv('FRONTEND_URL', 'http://localhost:5173')}/settings
"""
        
        message = Mail()
        message.from_email = Email(SENDGRID_FROM_EMAIL, SENDGRID_FROM_NAME)
        message.subject = f"CodeRecall: {len(questions)} question{'s' if len(questions) > 1 else ''} to revise today"
        message.to = To(to_email)
        
        message.content = [
            Content("text/plain", plain_text_content),
            Content("text/html", html_content)
        ]
        
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        
        if response.status_code in [200, 201, 202]:
            logger.info(f"Email sent successfully to {to_email}")
            return True
        else:
            logger.error(f"Failed to send email to {to_email}. Status: {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending email to {to_email}: {str(e)}\n{traceback.format_exc()}")
        return False


