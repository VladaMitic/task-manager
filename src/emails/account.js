const sgMail = require("@sendgrid/mail"); //requiruje s einstaliran sendgrid modul
sgMail.setApiKey(process.env.SENDGRID_API_KEY); // kopira se key nakon generisanja u setapu sendgrida u env varijablu a ovde se setuje  api key

const sendWelcomeEmail = async (email, name) => {
  try {
    await sgMail.send({
      to: email,
      from: "rokagresor@gmail.com",
      subject: "Welcome to task manager",
      text: `Welcome to task manager application ${name}.`,
    });
  } catch (error) {
    throw Error("Cant send message" + error);
  }
};

const sendCancelationEmail = async (email, name) => {
  try {
    await sgMail.send({
      to: email,
      from: "rokagresor@gmail.com",
      subject: "Goodbye",
      text: `${name}, we are soory you arent with us`,
    });
  } catch (error) {
    throw Error("Cant send message" + error);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendCancelationEmail,
};
