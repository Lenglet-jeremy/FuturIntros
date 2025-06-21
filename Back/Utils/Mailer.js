// utils/mailer.js (CommonJS version)

const nodemailer = require("nodemailer");
const dns = require("dns");
const { mainModule } = require("process");

require('dotenv').config(); 

const isNetworkAvailable = async () => {
  return new Promise((resolve) => {
    dns.lookup("smtp.gmail.com", (err) => {
      if (err && err.code === "ENOTFOUND") {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

const transporter = nodemailer.createTransport({
  host: `smtp.gmail.com`,
  service: "gmail",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SEND_MAIL_NAME,
    pass: process.env.SEND_MAIL_PASSWORD,
  },
});

const sendVerificationCodeOnMail = async ({ email, code }) => {
    console.log(email);
    
  try {
    if (!(await isNetworkAvailable())) throw new Error("Pas de réseau");
    await transporter.sendMail({
      from: process.env.SEND_MAIL_NAME,
      to: email,
      subject: "Votre code de vérification",
      html: `<p>Votre code est : <strong>${code}</strong></p>`,
    });
    console.log("Email envoyé à", email);
    return true;
  } catch (err) {
    console.error("Erreur d'envoi mail :", err.message);
    return false;
  }
};

module.exports = { sendVerificationCodeOnMail };
