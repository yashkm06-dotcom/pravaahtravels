import nodemailer from 'nodemailer';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin lazily
let adminDb: any = null;

try {
  if (getApps().length === 0) {
    initializeApp();
  }
  adminDb = getFirestore();
  console.log('[DEBUG] Firebase Admin initialized successfully for automated email system.');
} catch (err) {
  console.warn('[WARNING] Firebase Admin could not be initialized. Operating in local mode with console logs.', err);
}

// SMTP Transport Config
const getSMTPTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }
  return null;
};

// Generates customized, visually-stunning responsive HTML email templates with Pravaah branding
export function generateEmailHtml(trigger: string, metadata: any): { subject: string; html: string } {
  const brandTeal = '#008080';
  const accentCoral = '#FF7F50';
  const textDark = '#1c1917';
  const bgLight = '#f8f7f4';

  const headerHtml = `
    <div style="background-color: #1f2937; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="color: #ffffff; font-family: 'Georgia', serif; font-style: italic; margin: 0; font-size: 26px; font-weight: normal; letter-spacing: 1px;">Pravaah Travels</h1>
      <p style="color: ${accentCoral}; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 6px 0 0 0;">Flow into the Sacred Mountains</p>
    </div>
  `;

  const footerHtml = `
    <div style="background-color: #f5f5f4; border-top: 1px solid #e7e5e4; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-family: 'Helvetica Neue', Arial, sans-serif;">
      <p style="color: #78716c; font-size: 11px; line-height: 1.6; margin: 0;">
        This is an automated system notification from <strong>Pravaah Travels Private Limited</strong>.<br/>
        For immediate ground assistance or trip adjustments, please coordinate directly via our WhatsApp support.
      </p>
      <div style="margin-top: 12px;">
        <a href="https://wa.me/919999999999" style="background-color: #16a34a; color: #ffffff; font-size: 10px; font-weight: bold; text-decoration: none; padding: 6px 12px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">Chat on WhatsApp</a>
      </div>
    </div>
  `;

  let subject = '';
  let contentHtml = '';

  switch (trigger) {
    case 'booking-received':
      subject = 'Booking Request Logged Successfully - Pravaah Travels';
      contentHtml = `
        <h2 style="color: ${brandTeal}; font-family: 'Georgia', serif; font-style: italic; font-size: 20px; margin-top: 0;">Namaste ${metadata.customerName || 'Traveler'},</h2>
        <p style="color: ${textDark}; font-size: 14px; line-height: 1.6; font-family: Arial, sans-serif;">
          We have successfully received your booking request for the curated holiday package: <strong>${metadata.packageTitle}</strong>.
        </p>
        <div style="background-color: ${bgLight}; border-left: 4px solid ${brandTeal}; padding: 16px; margin: 20px 0; font-family: Arial, sans-serif; font-size: 13px;">
          <p style="margin: 0 0 8px 0;"><strong>• Requested Travel Date:</strong> ${metadata.travelDate}</p>
          <p style="margin: 0 0 8px 0;"><strong>• Travelers:</strong> ${metadata.adults || 2} Adults ${metadata.children ? `, ${metadata.children} Children` : ''}</p>
          <p style="margin: 0 0 8px 0;"><strong>• Est. Budget Limit:</strong> ${metadata.budget || 'Customised'}</p>
          <p style="margin: 0 0 8px 0;"><strong>• Pickup City:</strong> ${metadata.pickupCity || 'Not specified'}</p>
          <p style="margin: 0;"><strong>• Special Requests:</strong> ${metadata.specialRequests || 'None submitted'}</p>
        </div>
        <p style="color: ${textDark}; font-size: 13px; line-height: 1.6; font-family: Arial, sans-serif;">
          An expert Himalayan itinerary specialist is already analyzing your preferences to draft a personalized schedule. No immediate payment or credit card is required. We will contact you on the provided number (<strong style="color: ${brandTeal};">${metadata.customerPhone}</strong>) or via WhatsApp within 2-4 business hours to finalize.
        </p>
      `;
      break;

    case 'booking-confirmed':
      subject = 'Your Booking is CONFIRMED! 🎉 - Pravaah Travels';
      contentHtml = `
        <h2 style="color: #15803d; font-family: 'Georgia', serif; font-style: italic; font-size: 20px; margin-top: 0;">Congratulations, ${metadata.customerName || 'Traveler'}!</h2>
        <p style="color: ${textDark}; font-size: 14px; line-height: 1.6; font-family: Arial, sans-serif;">
          Your travel package <strong>${metadata.packageTitle}</strong> scheduled for <strong>${metadata.travelDate}</strong> is now <strong>OFFICIALLY CONFIRMED</strong>!
        </p>
        <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0; font-family: Arial, sans-serif; font-size: 13px; color: #14532d;">
          <p style="margin: 0 0 8px 0;"><strong>• Confirmed Booking ID:</strong> ${metadata.bookingId}</p>
          <p style="margin: 0 0 8px 0;"><strong>• Package Title:</strong> ${metadata.packageTitle}</p>
          <p style="margin: 0 0 8px 0;"><strong>• Departure Date:</strong> ${metadata.travelDate}</p>
          <p style="margin: 0;"><strong>• Payment Status:</strong> Fully Settled & Confirmed</p>
        </div>
        <p style="color: ${textDark}; font-size: 13px; line-height: 1.6; font-family: Arial, sans-serif;">
          Your high-resolution vouchers, hotel booking references, and vehicle operator contact codes have been uploaded to your <strong>Confidential Private Vault</strong> in your Customer Portal. Please download them at your convenience before departure.
        </p>
      `;
      break;

    case 'booking-cancelled':
      subject = 'Booking Request Cancelled - Pravaah Travels';
      contentHtml = `
        <h2 style="color: #b91c1c; font-family: 'Georgia', serif; font-style: italic; font-size: 20px; margin-top: 0;">Booking Notice,</h2>
        <p style="color: ${textDark}; font-size: 14px; line-height: 1.6; font-family: Arial, sans-serif;">
          We are writing to confirm that your booking request for <strong>${metadata.packageTitle}</strong> has been cancelled as per request or operational limits.
        </p>
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; font-family: Arial, sans-serif; font-size: 13px; color: #7f1d1d;">
          <p style="margin: 0 0 8px 0;"><strong>• Booking ID Reference:</strong> ${metadata.bookingId}</p>
          <p style="margin: 0 0 8px 0;"><strong>• Package Details:</strong> ${metadata.packageTitle}</p>
          <p style="margin: 0;"><strong>• Status:</strong> Cancelled / Refunded (if applicable)</p>
        </div>
        <p style="color: ${textDark}; font-size: 13px; line-height: 1.6; font-family: Arial, sans-serif;">
          If this was done in error or if you wish to explore alternative travel corridors, please contact our helpline immediately so we can re-route you on a suitable plan.
        </p>
      `;
      break;

    case 'enquiry-received':
      subject = 'We Have Received Your Holiday Enquiry - Pravaah Travels';
      contentHtml = `
        <h2 style="color: ${brandTeal}; font-family: 'Georgia', serif; font-style: italic; font-size: 20px; margin-top: 0;">Hello ${metadata.name},</h2>
        <p style="color: ${textDark}; font-size: 14px; line-height: 1.6; font-family: Arial, sans-serif;">
          Thank you for exploring destinations with Pravaah Travels! We have received your holiday enquiry regarding <strong>${metadata.destination}</strong>.
        </p>
        <div style="background-color: ${bgLight}; border-left: 4px solid ${brandTeal}; padding: 16px; margin: 20px 0; font-family: Arial, sans-serif; font-size: 13px;">
          <p style="margin: 0 0 8px 0;"><strong>• Target Destination:</strong> ${metadata.destination}</p>
          <p style="margin: 0 0 8px 0;"><strong>• Target Date:</strong> ${metadata.travelDate || 'flexible'}</p>
          <p style="margin: 0 0 8px 0;"><strong>• Est. Travelers:</strong> ${metadata.travelers || 2}</p>
          <p style="margin: 0;"><strong>• Custom Enquiry Message:</strong> ${metadata.message || 'Interested in curated plans'}</p>
        </div>
        <p style="color: ${textDark}; font-size: 13px; line-height: 1.6; font-family: Arial, sans-serif;">
          Our destination curators are drafting a scenic draft plan matching your profile. A dedicated manager will respond to you shortly on <strong style="color: ${brandTeal};">${metadata.phone}</strong> or by email.
        </p>
      `;
      break;

    case 'new-booking':
      subject = '🚨 ALERT: New Booking Request Logged!';
      contentHtml = `
        <h2 style="color: ${accentCoral}; font-family: Arial, sans-serif; font-size: 18px; margin-top: 0;">New Custom Booking Request Received</h2>
        <p style="color: ${textDark}; font-size: 13px; line-height: 1.6; font-family: Arial, sans-serif;">
          A new booking request has been submitted by a customer through the portal.
        </p>
        <div style="background-color: ${bgLight}; border-top: 3px solid ${accentCoral}; padding: 16px; margin: 20px 0; font-family: Arial, sans-serif; font-size: 12px;">
          <p style="margin: 0 0 6px 0;"><strong>• Customer Name:</strong> ${metadata.customerName}</p>
          <p style="margin: 0 0 6px 0;"><strong>• Email Address:</strong> ${metadata.customerEmail}</p>
          <p style="margin: 0 0 6px 0;"><strong>• Mobile Number:</strong> ${metadata.customerPhone}</p>
          <p style="margin: 0 0 6px 0;"><strong>• WhatsApp Number:</strong> ${metadata.customerWhatsApp || 'Not provided'}</p>
          <p style="margin: 0 0 6px 0;"><strong>• Selected Package:</strong> ${metadata.packageTitle}</p>
          <p style="margin: 0 0 6px 0;"><strong>• Travel Date:</strong> ${metadata.travelDate}</p>
          <p style="margin: 0 0 6px 0;"><strong>• Adults / Children:</strong> ${metadata.adults} / ${metadata.children || 0}</p>
          <p style="margin: 0 0 6px 0;"><strong>• Pickup City:</strong> ${metadata.pickupCity}</p>
          <p style="margin: 0 0 6px 0;"><strong>• Est. Budget Limit:</strong> ${metadata.budget}</p>
          <p style="margin: 0;"><strong>• Special Requests:</strong> ${metadata.specialRequests || 'None'}</p>
        </div>
        <p style="color: ${textDark}; font-size: 12px; font-family: Arial, sans-serif;">
          Please log into the <strong>Admin Dashboard</strong>, assign a coordinator, draft the custom itinerary, and contact the client within 2 hours.
        </p>
      `;
      break;

    case 'new-enquiry':
      subject = '📩 ALERT: New Holiday Enquiry Received';
      contentHtml = `
        <h2 style="color: ${brandTeal}; font-family: Arial, sans-serif; font-size: 18px; margin-top: 0;">New Lead / Enquiry Alert</h2>
        <p style="color: ${textDark}; font-size: 13px; line-height: 1.6; font-family: Arial, sans-serif;">
          A new customer enquiry has been submitted from the web portal.
        </p>
        <div style="background-color: ${bgLight}; border-top: 3px solid ${brandTeal}; padding: 16px; margin: 20px 0; font-family: Arial, sans-serif; font-size: 12px;">
          <p style="margin: 0 0 6px 0;"><strong>• Client Name:</strong> ${metadata.name}</p>
          <p style="margin: 0 0 6px 0;"><strong>• Email Address:</strong> ${metadata.email}</p>
          <p style="margin: 0 0 6px 0;"><strong>• Mobile Number:</strong> ${metadata.phone}</p>
          <p style="margin: 0 0 6px 0;"><strong>• Target Destination:</strong> ${metadata.destination}</p>
          <p style="margin: 0 0 6px 0;"><strong>• Travel Date:</strong> ${metadata.travelDate}</p>
          <p style="margin: 0 0 6px 0;"><strong>• Total Travelers:</strong> ${metadata.travelers}</p>
          <p style="margin: 0 0 6px 0;"><strong>• Target Budget:</strong> ${metadata.budget || 'Flexible'}</p>
          <p style="margin: 0;"><strong>• Custom Query:</strong> ${metadata.message || 'None'}</p>
        </div>
        <p style="color: ${textDark}; font-size: 12px; font-family: Arial, sans-serif;">
          Please review the details in your CRM leads workspace and follow up with the customer.
        </p>
      `;
      break;

    case 'new-review':
      subject = '★ ALERT: New Verified Customer Review Added';
      contentHtml = `
        <h2 style="color: #ca8a04; font-family: Arial, sans-serif; font-size: 18px; margin-top: 0;">New Verified Customer Review</h2>
        <p style="color: ${textDark}; font-size: 13px; line-height: 1.6; font-family: Arial, sans-serif;">
          A customer has submitted a verified trip review through their portal.
        </p>
        <div style="background-color: ${bgLight}; border-top: 3px solid #ca8a04; padding: 16px; margin: 20px 0; font-family: Arial, sans-serif; font-size: 12px;">
          <p style="margin: 0 0 6px 0;"><strong>• Author Name:</strong> ${metadata.customerName || 'Anonymous'}</p>
          <p style="margin: 0 0 6px 0;"><strong>• Destination Visited:</strong> ${metadata.destination}</p>
          <p style="margin: 0 0 6px 0;"><strong>• Rating Score:</strong> ${metadata.rating} / 5 Stars</p>
          <p style="margin: 0 0 6px 0;"><strong>• Review Comment:</strong> "${metadata.comment}"</p>
          <p style="margin: 0;"><strong>• Attachment Present:</strong> ${metadata.imageUrl ? 'Yes (Photo Attached)' : 'No'}</p>
        </div>
        <p style="color: ${textDark}; font-size: 12px; font-family: Arial, sans-serif;">
          The review is currently marked as <strong>Pending Approval</strong>. Approve or reject it in the Reviews CMS of your Admin Dashboard.
        </p>
      `;
      break;

    default:
      subject = 'Notification from Pravaah Travels';
      contentHtml = `
        <h2 style="color: ${brandTeal}; font-family: 'Georgia', serif; font-style: italic; font-size: 20px; margin-top: 0;">Notice</h2>
        <p style="color: ${textDark}; font-size: 14px; line-height: 1.6; font-family: Arial, sans-serif;">
          ${metadata.message || 'System Notification'}
        </p>
      `;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="background-color: #f5f5f4; margin: 0; padding: 20px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e7e5e4; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
          ${headerHtml}
          <div style="padding: 30px; font-family: Arial, sans-serif;">
            ${contentHtml}
          </div>
          ${footerHtml}
        </div>
      </body>
    </html>
  `;

  return { subject, html };
}

// Main Dispatch Function
export async function triggerSystemEmail(trigger: string, recipientEmail: string, metadata: any) {
  const { subject, html } = generateEmailHtml(trigger, metadata);
  console.log(`[EMAIL SYSTEM] Trigger: "${trigger}" | To: "${recipientEmail}" | Subject: "${subject}"`);

  let emailStatus = 'simulated';
  let emailError = '';

  const transporter = getSMTPTransporter();
  if (transporter) {
    try {
      const fromAddr = process.env.SMTP_FROM || '"Pravaah Travels" <no-reply@pravaahtravels.com>';
      await transporter.sendMail({
        from: fromAddr,
        to: recipientEmail,
        subject,
        html
      });
      console.log(`[EMAIL SYSTEM] Real email sent successfully via SMTP to ${recipientEmail}`);
      emailStatus = 'sent';
    } catch (err: any) {
      console.error(`[EMAIL SYSTEM] Real SMTP sending failed. Defaulting to Firestore log only.`, err);
      emailStatus = 'failed';
      emailError = err.message || String(err);
    }
  } else {
    console.log(`[EMAIL SYSTEM] No SMTP details in env. Email simulated and logged to Firestore.`);
  }

  // Always write a robust record to the 'sent_emails' collection in Firestore for real-time verification logs
  if (adminDb) {
    try {
      await adminDb.collection('sent_emails').add({
        trigger,
        to: recipientEmail,
        subject,
        body: html,
        status: emailStatus,
        error: emailError || null,
        metadata,
        createdAt: new Date().toISOString()
      });
      console.log(`[EMAIL SYSTEM] Email transaction successfully logged in Firestore sent_emails collection.`);
    } catch (err) {
      console.error(`[EMAIL SYSTEM] Failed to write record to Firestore sent_emails.`, err);
    }
  }

  return { subject, status: emailStatus, error: emailError || null };
}
