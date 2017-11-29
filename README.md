1. Create the following Gmail labels:
   - Notifications/yes
   - Notifications/maybe
   - Notifications/no
   - Notifications/notified
   - Notifications/expired

1. Set up Gmail filters to assign "Notifications/maybe" and "Notifications/no" labels to incoming mail.

1. Install CoffeeScript version 1.9.3.

1. Edit the rules in the Coffee Script file to suit your needs.

1. Convert the Coffee Script to a Google Script file by running `./compile` then paste the Google Script file into a Google Apps Script project.

1. Create triggers for the `processHighPriorityRules` and `processLowPriorityRules` functions.
