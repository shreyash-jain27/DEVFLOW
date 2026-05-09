
const passwordResetTemplate = (name, resetUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#dc2626,#9333ea);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">🔐 Password Reset Request</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 16px;color:#f1f5f9;font-size:16px;font-weight:600;">Hi ${name},</p>
              <p style="margin:0 0 20px;color:#94a3b8;font-size:15px;line-height:1.7;">
                We received a request to reset the password for your DevFlow account.
                Click the button below to create a new password.
              </p>
              <!-- Warning box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background-color:#1c0a00;border-left:3px solid #f97316;border-radius:0 8px 8px 0;padding:14px 18px;">
                    <p style="margin:0;color:#fdba74;font-size:13px;">
                      ⏱ This link expires in <strong>1 hour</strong>.
                      If you didn't request this, you can safely ignore this email — your password will not change.
                    </p>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#dc2626,#9333ea);border-radius:8px;">
                    <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">Reset My Password →</a>
                  </td>
                </tr>
              </table>
              <!-- Fallback URL -->
              <p style="margin:0 0 8px;color:#64748b;font-size:12px;">Or copy and paste this URL into your browser:</p>
              <p style="margin:0;color:#818cf8;font-size:12px;word-break:break-all;">${resetUrl}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #334155;text-align:center;">
              <p style="margin:0;color:#475569;font-size:12px;">© ${new Date().getFullYear()} DevFlow · This is an automated security email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

module.exports = passwordResetTemplate;
