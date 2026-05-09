

const {
  sendEmail,
  sendWelcomeEmail,
  sendTaskAssignedEmail,
  sendPasswordResetEmail,
  sendProjectInviteEmail,
} = require('../services/email.service');
const logger = require('../utils/logger');


const HANDLERS = {
  
  raw: async (data) => {
    await sendEmail({ to: data.to, subject: data.subject, html: data.html });
  },

  
  welcome: async (data) => {
    
    
    
    const { sendEmail: _send } = require('../services/email.service');
    const welcomeTemplate = require('../utils/emailTemplates/welcome.template');
    await _send({
      to:      data.user.email,
      subject: 'Welcome to DevFlow! 🚀',
      html:    welcomeTemplate(data.user.name),
    });
  },

  
  taskAssigned: async (data) => {
    const taskAssignedTemplate = require('../utils/emailTemplates/taskAssigned.template');
    const { sendEmail: _send } = require('../services/email.service');
    await _send({
      to:      data.assignedUser.email,
      subject: `📋 New task assigned: "${data.task.title}"`,
      html:    taskAssignedTemplate(data.task, data.assignerUser.name, data.taskUrl),
    });
  },

  
  passwordReset: async (data) => {
    const passwordResetTemplate = require('../utils/emailTemplates/passwordReset.template');
    const { sendEmail: _send } = require('../services/email.service');
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${data.resetToken}`;
    await _send({
      to:      data.user.email,
      subject: '🔐 DevFlow Password Reset Request',
      html:    passwordResetTemplate(data.user.name, resetUrl),
    });
  },

  
  projectInvite: async (data) => {
    const projectInviteTemplate = require('../utils/emailTemplates/projectInvite.template');
    const { sendEmail: _send } = require('../services/email.service');
    const projectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/projects/${data.project._id}`;
    await _send({
      to:      data.invitedUser.email,
      subject: `🤝 You've been invited to "${data.project.name}" on DevFlow`,
      html:    projectInviteTemplate(
        data.invitedUser.name,
        data.project.name,
        data.inviterUser.name,
        data.role,
        projectUrl
      ),
    });
  },
};


const emailProcessor = async (job) => {
  const handler = HANDLERS[job.data.emailType];

  if (!handler) {
    throw new Error(`Unknown email job type: "${job.data.emailType}"`);
  }

  logger.info(`[Email Processor] Sending "${job.data.emailType}" email (job id: ${job.id})`);
  await handler(job.data);
  logger.info(`[Email Processor] Successfully sent "${job.data.emailType}" (job id: ${job.id})`);
};

module.exports = emailProcessor;
