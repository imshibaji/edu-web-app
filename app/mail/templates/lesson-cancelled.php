<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lesson Cancelled - Larnr</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px;">
        <div style="background-color: white; margin: 0 auto; max-width: 600px; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #e82424; color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0; font-size: 24px;">Lesson Cancelled</h2>
            </div>
            <div style="padding: 20px; color: #333;">
                <p>Hello <strong>{$name}</strong>,</p>
                <p>Your lesson has been cancelled.</p>
                <ul>
                    <li><strong>Tutor:</strong> {$tutorName}</li>
                    <li><strong>Student:</strong> {$studentName}</li>
                    <li><strong>Reason:</strong> {$cancellationReason}</li>
                </ul>
                <p>If you wish to reschedule, please contact the other party or book a new lesson.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{$dashboardUrl}" style="background-color: #e82424; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-size: 16px;">View Details</a>
                </div>
            </div>
            <div style="background-color: #fafafa; padding: 15px; text-align: center; font-size: 12px; color: #666;">
                <p>This is an automated message from Larnr. Please do not reply to this email.</p>
            </div>
        </div>
    </div>
</body>
</html>