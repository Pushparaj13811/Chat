import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import fs from 'fs';
import handlebars from 'handlebars';
import path from 'path';

dotenv.config();

// Create a transporter based on environment
const createTransporter = () => {
    // If SMTP credentials are set, use them
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } 
    // For development/testing - create a test account
    else if (process.env.NODE_ENV === 'development') {
        console.log('SMTP credentials not found, using nodemailer test account');
        // For development, log the OTP instead of actually sending it
        return {
            sendMail: async (mailOptions) => {
                console.log('========== EMAIL NOT SENT (DEV MODE) ==========');
                console.log('To:', mailOptions.to);
                console.log('Subject:', mailOptions.subject);
                console.log('Content:', mailOptions.html.includes('otp-code') 
                    ? 'Email contains OTP' 
                    : 'Email content (not shown)');
                console.log('=================================================');
                return { messageId: 'test-message-id' };
            }
        };
    } else {
        throw new Error('SMTP configuration is missing');
    }
};

// Get transporter
const transporter = createTransporter();

/**
 * Sends an email using a Handlebars template
 * @param {string} to - Receiver's email address
 * @param {string} subject - Email subject
 * @param {string} templateName - Handlebars template file name (without extension)
 * @param {object} data - Dynamic data to inject into the template
 */
export async function sendEmail(to, subject, templateName, data) {
    try {
        // Load Handlebars template
        const templatePath = path.join(process.cwd(), 'src/templates', `${templateName}.hbs`);
        const templateSource = fs.readFileSync(templatePath, 'utf8');
        const template = handlebars.compile(templateSource);

        // Replace placeholders with actual data
        const htmlContent = template(data);

        // Extract OTP for development logging
        let otpValue = null;
        if (templateName === 'otpVerification' && data.otp) {
            otpValue = data.otp;
        }

        // Send email
        let info = await transporter.sendMail({
            from: `"Chat App" <${process.env.SMTP_USER || 'noreply@chatapp.com'}>`,
            to,
            subject,
            html: htmlContent,
        });

        if (otpValue && process.env.NODE_ENV === 'development') {
            console.log(`OTP for ${to}: ${otpValue}`);
        }

        console.log(`Email sent to ${to}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        // Don't throw error, just return false
        return false;
    }
}
