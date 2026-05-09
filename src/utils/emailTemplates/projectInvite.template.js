
const ROLE_COLORS = {
  admin:  { bg: '#1e1b4b', text: '#a5b4fc', label: 'Admin' },
  member: { bg: '#052e16', text: '#4ade80', label: 'Member' },
  viewer: { bg: '#0c1a2e', text: '#38bdf8', label: 'Viewer' },
};

const projectInviteTemplate = (invitedName, projectName, inviterName, role = 'member', projectUrl = '#') => {
  const roleStyle = ROLE_COLORS[role] || ROLE_COLORS.member;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Project Invitation</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#059669,#0ea5e9);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">🤝 You're Invited to a Project</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Invitation from ${inviterName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;color:#f1f5f9;font-size:16px;font-weight:600;">Hi ${invitedName},</p>
              <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.7;">
                <strong style="color:#e2e8f0;">${inviterName}</strong> has invited you to collaborate on the project
                <strong style="color:#e2e8f0;">${projectName}</strong> on DevFlow.
              </p>
              <!-- Role badge -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background-color:#0f172a;border-radius:8px;padding:18px 20px;">
                    <p style="margin:0 0 8px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">You will join as</p>
                    <span style="background-color:${roleStyle.bg};color:${roleStyle.text};font-size:13px;font-weight:600;padding:4px 14px;border-radius:20px;">${roleStyle.label}</span>
                    <p style="margin:12px 0 0;color:#64748b;font-size:12px;line-height:1.6;">
                      ${role === 'admin' ? 'As an admin, you can manage members, tasks, and project settings.' : ''}
                      ${role === 'member' ? 'As a member, you can create and edit tasks within this project.' : ''}
                      ${role === 'viewer' ? 'As a viewer, you can browse project content in read-only mode.' : ''}
                    </p>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#059669,#0ea5e9);border-radius:8px;">
                    <a href="${projectUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">Open Project →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #334155;text-align:center;">
              <p style="margin:0;color:#475569;font-size:12px;">© ${new Date().getFullYear()} DevFlow · You received this because ${inviterName} added you to a project.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

module.exports = projectInviteTemplate;
