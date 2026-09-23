package com.compas.api.email;

/**
 * Service contract for sending transactional emails in Compas.
 */
public interface EmailService {

    /**
     * Sends an email verification link to a registered nutritionist.
     *
     * @param recipientEmail    the target email address
     * @param recipientName     the display name of the nutritionist
     * @param verificationToken the single-use verification token
     */
    void sendVerificationEmail(String recipientEmail, String recipientName, String verificationToken);

    /**
     * Sends a password reset link to a nutritionist.
     *
     * @param recipientEmail the target email address
     * @param recipientName  the display name of the nutritionist
     * @param resetToken     the password reset token
     */
    void sendPasswordResetEmail(String recipientEmail, String recipientName, String resetToken);

    /**
     * Sends an operational alert email to an administrator.
     *
     * @param recipientEmail the target administrator email address
     * @param subject        the alert email subject line
     * @param alertMessage   the description or details of the operational event
     */
    void sendAdminAlertEmail(String recipientEmail, String subject, String alertMessage);
}
