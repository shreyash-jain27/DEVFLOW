
const PRIORITY_COLORS = {
  low:      { bg: '#052e16', text: '#4ade80', label: 'Low' },
  medium:   { bg: '#1c1917', text: '#fbbf24', label: 'Medium' },
  high:     { bg: '#1c0a00', text: '#f97316', label: 'High' },
  critical: { bg: '#1c0606', text: '#f87171', label: 'Critical' },
};

const taskAssignedTemplate = (task, assignerName, taskUrl = '#') => {
  const priority = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
  const dueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'No due date set';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>New Task Assigned</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#0ea5e9,#6366f1);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">📋 New Task Assigned</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Assigned by ${assignerName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="margin:0 0 6px;color:#f1f5f9;font-size:20px;font-weight:600;">${task.title}</h2>
              ${task.description
                ? `<p style="margin:0 0 24px;color:#94a3b8;font-size:14px;line-height:1.7;">${task.description}</p>`
                : '<p style="margin:0 0 24px;color:#475569;font-size:14px;font-style:italic;">No description provided.</p>'
              }
              <!-- Meta grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td width="50%" style="padding-right:8px;">
                    <div style="background-color:#0f172a;border-radius:8px;padding:14px;">
                      <p style="margin:0 0 4px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Priority</p>
                      <span style="background-color:${priority.bg};color:${priority.text};font-size:13px;font-weight:600;padding:2px 10px;border-radius:20px;">${priority.label}</span>
                    </div>
                  </td>
                  <td width="50%" style="padding-left:8px;">
                    <div style="background-color:#0f172a;border-radius:8px;padding:14px;">
                      <p style="margin:0 0 4px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Due Date</p>
                      <p style="margin:0;color:#e2e8f0;font-size:13px;font-weight:600;">${dueDate}</p>
                    </div>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:8px;">
                    <a href="${taskUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">View Task →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #334155;text-align:center;">
              <p style="margin:0;color:#475569;font-size:12px;">© ${new Date().getFullYear()} DevFlow</p>
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

module.exports = taskAssignedTemplate;
