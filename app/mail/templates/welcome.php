<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Larnr</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: white; margin: 0 auto; max-width: 600px; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #1a73e8; color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0; font-size: 24px;">Welcome to Larnr!</h2>
            </div>
            <div style="padding: 20px; color: #333;">
                <p>Hello <strong>{$name}</strong>,</p>
                <p>Welcome to Larnr, the platform for connecting students with tutors. We're excited to have you on board!</p>
                <p>You can now <a href="{$loginUrl}" style="color: #1a73e8;">log in</a> to your account and start exploring tutors or booking lessons.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{$loginUrl}" style="background-color: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 16px;">Get Started</a>
                </div>
            </div>
            <div style="background-color: #fafafa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                <p>This is an automated message from Larnr. Please do not reply to this email.</p>
            </div>
        </div>
    </div>
</body>
</html>