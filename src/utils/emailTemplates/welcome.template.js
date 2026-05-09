
const welcomeTemplate = (name) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to DevFlow</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.4);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:40px 40px 30px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">⚡ DevFlow</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">AI-Enhanced Task Management</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#f1f5f9;font-size:22px;font-weight:600;">Welcome aboard, ${name}! 🎉</h2>
              <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.7;">
                Your DevFlow account is ready. You can now create projects, manage tasks,
                and collaborate with your team — all powered by AI.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td style="background-color:#312e81;border-radius:8px;padding:14px 20px;">
                    <p style="margin:0;color:#a5b4fc;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">What you can do</p>
                    <ul style="margin:10px 0 0;padding-left:18px;color:#cbd5e1;font-size:14px;line-height:2;">
                      <li>Create and manage projects</li>
                      <li>Invite team members with role-based access</li>
                      <li>Let AI suggest task priorities and estimates</li>
                      <li>Attach files to tasks</li>
                    </ul>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.6;">
                If you have any questions, reply to this email anytime. We're happy to help.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #334155;text-align:center;">
              <p style="margin:0;color:#475569;font-size:12px;">
                © ${new Date().getFullYear()} DevFlow. You're receiving this because you created an account.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

module.exports = welcomeTemplate;
