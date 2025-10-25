import nodemailer from "nodemailer";
import Contract from "../models/Contract.js";
import { logBillingActivity } from "../utils/logBillingActivity.js"; // ✅ Import

export const sendBillEmail = async (req, res) => {
  try {
    const { contractNo, filePaths, cardPaths } = req.body;

    if (!filePaths || filePaths.length === 0) {
      return res.status(400).json({ success: false, msg: "Bill file(s) missing" });
    }

    const contract = await Contract.findOne({ contractNo });
    if (!contract) {
      return res.status(404).json({ success: false, msg: "Contract not found" });
    }

    const contact = contract.billToContact1;
    if (!contact || !contact.email) {
      console.error("Client email missing:", contact);
      return res.status(400).json({ success: false, msg: "Client email missing or not configured for this contract." });
    }

    const { name, email } = contact;

    const emailBody = `
Respected ${name || "Sir/Madam"},

Thank you for choosing us for your Pest Control Services.

Kindly find attached the E-invoice and Service Report for Contract No.: ${contractNo}.

For service or billing discussion, connect: 022-61386600.

Thanks & Regards,
Billing Dept.,
Express Pesticides
022-61386600
`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const billAttachments = filePaths.map(p => ({
      filename: p.split("/").pop(),
      path: p
    }));

    const cardAttachments = cardPaths?.map(p => ({
      filename: p.split("/").pop(),
      path: p
    })) || [];
    
    const attachments = [...billAttachments, ...cardAttachments];

    await transporter.sendMail({
      from: `"Express Pesticides Billing" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Invoice & Service Report for Contract ${contractNo}`,
      text: emailBody,
      attachments,
    });

    // ✅ Log email sent
    if (req.user?._id) {
      await logBillingActivity({
        userId: req.user._id,
        actionType: "sendEmail",
        additionalInfo: `Sent email for contract ${contractNo} with ${filePaths.length} bill files and ${cardPaths?.length || 0} card files`
      });
    }

    res.status(200).json({ success: true, msg: `Email sent successfully to ${email}` });

  } catch (err) {
    console.error("❌ Error in sendBillEmail:", err);
    res.status(500).json({ success: false, msg: "Error sending email", error: err.message });
  }
};
