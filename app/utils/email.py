"""Mock email service for escalation notifications."""

import logging

logger = logging.getLogger(__name__)


def send_escalation_email(
    to_email: str,
    escalation_id: str,
    property_id: str,
    guest_message: str,
    ai_answer: str,
    confidence: float,
    reason: str,
):
    """Send an escalation notification email to the property manager.

    Currently a mock/stub that logs the email content.
    Replace with Resend/SendGrid integration for production.
    """
    logger.info(
        "[MOCK EMAIL] Escalation notification\n"
        f"  To: {to_email}\n"
        f"  Subject: [Checkmate] Guest question needs attention - {property_id}\n"
        f"  ---\n"
        f"  Escalation ID: {escalation_id}\n"
        f"  Property: {property_id}\n"
        f"  Reason: {reason}\n"
        f"  Confidence: {confidence:.2f}\n"
        f"  \n"
        f"  Guest asked: {guest_message}\n"
        f"  AI answered: {ai_answer}\n"
        f"  \n"
        f"  Reply to this escalation via API:\n"
        f"  POST /escalations/{escalation_id}/reply\n"
        f"  ---"
    )
