export interface ProjectInvitationEmailData {
    invitedUserEmail: string;
    invitedUserName: string;
    inviterName: string;
    projectName: string;
}

export function projectInvitationTemplate({
    invitedUserName,
    inviterName,
    projectName,
}: ProjectInvitationEmailData): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
      />

      <title>TaskFlow Invitation</title>

      <style>
        @font-face {
          font-family: 'FOMO';
          src: local('FOMO');
        }

        body {
          margin: 0;
          padding: 0;
          background: #f6f7f9;
          font-family:
            'FOMO',
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            'Segoe UI',
            sans-serif;
          color: #171717;
        }

        table {
          border-spacing: 0;
          border-collapse: collapse;
        }

        .wrapper {
          width: 100%;
          padding: 48px 16px;
        }

        .container {
          width: 100%;
          max-width: 560px;
          margin: 0 auto;
        }

        .brand {
          text-align: center;
          padding-bottom: 28px;
        }

        .logo {
          display: inline-block;
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -1px;
          color: #111111;
        }

        .logo-dot {
          color: #6366f1;
        }

        .card {
          background: #ffffff;
          border: 1px solid #e8e8ec;
          border-radius: 20px;
          overflow: hidden;
          box-shadow:
            0 10px 30px rgba(0, 0, 0, 0.05);
        }

        .header {
          padding: 42px 40px 30px;
          text-align: center;
        }

        .icon-wrapper {
          width: 64px;
          height: 64px;
          margin: 0 auto 22px;

          background: #eef2ff;
          border-radius: 18px;

          text-align: center;
          line-height: 64px;

          font-size: 28px;
        }

        .title {
          margin: 0;

          font-size: 28px;
          line-height: 36px;
          font-weight: 800;
          letter-spacing: -0.8px;

          color: #111111;
        }

        .subtitle {
          margin: 12px 0 0;

          font-size: 15px;
          line-height: 24px;

          color: #737373;
        }

        .content {
          padding: 0 40px 40px;
        }

        .invitation-box {
          padding: 22px;

          background: #f8f8fa;
          border: 1px solid #ededf0;
          border-radius: 14px;
        }

        .label {
          margin: 0 0 8px;

          font-size: 12px;
          line-height: 18px;

          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.6px;

          color: #8a8a8f;
        }

        .project-name {
          margin: 0;

          font-size: 20px;
          line-height: 28px;

          font-weight: 750;
          color: #111111;
        }

        .inviter {
          margin-top: 18px;

          font-size: 14px;
          line-height: 22px;

          color: #666666;
        }

        .inviter strong {
          color: #222222;
        }

        .button-wrapper {
          padding-top: 28px;
          text-align: center;
        }

        .button {
          display: inline-block;

          padding: 14px 28px;

          background: #6366f1;
          color: #ffffff !important;

          border-radius: 10px;

          font-size: 15px;
          line-height: 22px;

          font-weight: 700;
          text-decoration: none;

          box-shadow:
            0 6px 16px rgba(99, 102, 241, 0.25);
        }

        .note {
          margin: 24px 0 0;

          text-align: center;

          font-size: 13px;
          line-height: 20px;

          color: #8a8a8f;
        }

        .footer {
          padding: 24px 20px 0;

          text-align: center;

          font-size: 12px;
          line-height: 20px;

          color: #a0a0a5;
        }

        @media only screen and (max-width: 600px) {
          .wrapper {
            padding: 24px 12px;
          }

          .header {
            padding: 32px 24px 24px;
          }

          .content {
            padding: 0 24px 30px;
          }

          .title {
            font-size: 24px;
            line-height: 32px;
          }

          .button {
            display: block;
            width: auto;
          }
        }
      </style>
    </head>

    <body>

      <table
        role="presentation"
        width="100%"
        class="wrapper"
      >
        <tr>
          <td>

            <div class="container">

              <!-- Brand -->
              <div class="brand">
                <div class="logo">
                  TaskFlow<span class="logo-dot">.</span>
                </div>
              </div>

              <!-- Main Card -->
              <div class="card">

                <!-- Header -->
                <div class="header">

                  <div class="icon-wrapper">
                    ✨
                  </div>

                  <h1 class="title">
                    You're invited
                  </h1>

                  <p class="subtitle">
                    You've been invited to collaborate
                    on a project in TaskFlow.
                  </p>

                </div>

                <!-- Content -->
                <div class="content">

                  <div class="invitation-box">

                    <p class="label">
                      Project
                    </p>

                    <p class="project-name">
                      ${projectName}
                    </p>

                    <p class="inviter">
                      Invited by
                      <strong>
                        ${inviterName}
                      </strong>
                    </p>

                  </div>

                  <div class="button-wrapper">

                    <a
                      href="${process.env.APP_URL}/projects"
                      class="button"
                    >
                      Open TaskFlow
                    </a>

                  </div>

                  <p class="note">
                    Hi ${invitedUserName}, open TaskFlow
                    to review and respond to this invitation.
                  </p>

                </div>

              </div>

              <!-- Footer -->
              <div class="footer">

                <p>
                  This email was sent by TaskFlow.
                </p>

                <p>
                  © ${new Date().getFullYear()} TaskFlow
                </p>

              </div>

            </div>

          </td>
        </tr>
      </table>

    </body>
    </html>
  `;
}
