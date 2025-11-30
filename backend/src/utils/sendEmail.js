import nodemailer from 'nodemailer'
import 'dotenv/config'

const sendEmail = async (options) => {
  // 1. Create a Transporter
  // This config depends on your provider (Gmail, SendGrid, Mailtrap, etc.)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, // e.g., 'gmail'
    port: process.env.EMAIL_PORT, // e.g., 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use App Password for Gmail
    },
  })

  // 2. Define Email Options
  const mailOptions = {
    from: `Project Management Tool <${process.env.EMAIL_FROM}>`, // Sender address
    to: options.email, // Receiver address
    subject: options.subject, // Subject line
    html: options.message, // HTML body
    // text: options.text // Plain text body (optional backup)
  }

  // 3. Send the Email
  try {
    const info = await transporter.sendMail(mailOptions)
    console.log(`Email sent: ${info.messageId}`)
    return info
  } catch (error) {
    console.error('Error sending email:', error)
    throw new Error('Email could not be sent')
  }
}

export default sendEmail
