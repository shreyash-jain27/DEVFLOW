const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const welcomeTemplate       = require('../utils/emailTemplates/welcome.template');
const taskAssignedTemplate  = require('../utils/emailTemplates/taskAssigned.template');
const passwordResetTemplate = require('../utils/emailTemplates/passwordReset.template');
const projectInviteTemplate = require('../utils/emailTemplates/projectInvite.template');



const getEmailQueue = () => require('../config/queues').emailQueue;
const { EMAIL_JOB_OPTIONS } = require('../config/queues');




let _transporter = null;


const createTransporter = async () => {
  if (_transporter) return _transporter;

  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !process.env.EMAIL_HOST) {
    
    const testAccount = await nodemailer.createTestAccount();
    logger.info(`[Email] Using Ethereal test account: ${testAccount.user}`);

    _transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return _transporter;
  }

  
  _transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST,
    port:   Number(process.env.EMAIL_PORT) || 587,
    secure: Number(process.env.EMAIL_PORT) === 465, 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  return _transporter;
};



const sendEmail = async ({ to, subject, html }) => {
  const transporter = await createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"DevFlow" <noreply@devflow.app>',
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);

  
  if (process.env.NODE_ENV === 'development' || !process.env.EMAIL_HOST) {
    logger.info(`[Email] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }

  logger.info(`[Email] Sent "${subject}" → ${to} (id: ${info.messageId})`);
  return info;
};



const sendEmailAsync = (options) => {
  sendEmail(options).catch((err) => {
    logger.error(`[Email] Failed to send "${options.subject}" → ${options.to}: ${err.message}`);
  });
};




const sendWelcomeEmail = (user) => {
  getEmailQueue()
    .add('email', { emailType: 'welcome', user }, EMAIL_JOB_OPTIONS)
    .catch((err) => logger.error(`[Email] Failed to queue welcome email: ${err.message}`));
};


const sendTaskAssignedEmail = (task, assignedUser, assignerUser, taskUrl) => {
  getEmailQueue()
    .add('email', { emailType: 'taskAssigned', task, assignedUser, assignerUser, taskUrl }, EMAIL_JOB_OPTIONS)
    .catch((err) => logger.error(`[Email] Failed to queue taskAssigned email: ${err.message}`));
};


const sendPasswordResetEmail = (user, resetToken) => {
  getEmailQueue()
    .add('email', { emailType: 'passwordReset', user, resetToken }, EMAIL_JOB_OPTIONS)
    .catch((err) => logger.error(`[Email] Failed to queue passwordReset email: ${err.message}`));
};


const sendProjectInviteEmail = (invitedUser, project, inviterUser, role) => {
  getEmailQueue()
    .add('email', { emailType: 'projectInvite', invitedUser, project, inviterUser, role }, EMAIL_JOB_OPTIONS)
    .catch((err) => logger.error(`[Email] Failed to queue projectInvite email: ${err.message}`));
};

module.exports = {
  sendEmail,
  sendEmailAsync,
  sendWelcomeEmail,
  sendTaskAssignedEmail,
  sendPasswordResetEmail,
  sendProjectInviteEmail,
  
  get _transporter() { return _transporter; },
};
