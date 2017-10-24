// Generated by CoffeeScript 1.9.3
var __, addLabel, address, archive, archiveOldNotification, getLabel, labels, log, notification_text, notified, notify, olderThan, processHighPriorityRules, processLowPriorityRules, processMail, remLabel, sendMail, t_id, wait;

notification_text = 'IMPORTANT MAIL NOTIFICATION';

notified = [];

__ = labels = {};

t_id = null;

log = function(msg) {
  return console.log(msg);
};

wait = function() {
  Utilities.sleep(250);
  while ((new Date()).getSeconds() % 10) {
    Utilities.sleep(250);
  }
  return true;
};

getLabel = function(name) {
  var ref;
  return labels[name] != null ? labels[name] : labels[name] = (function() {
    if ((ref = wait() && GmailApp.getUserLabelByName(name)) != null) {
      return ref;
    } else {
      throw "Label '" + name + "' doesn't exist";
    }
  })();
};

address = function() {
  return __[address] != null ? __[address] : __[address] = Session.getActiveUser().getEmail();
};

sendMail = function(subject, body) {
  return wait() && MailApp.sendEmail(address(), subject, body);
};


/* Actions */

addLabel = function(t, label_name) {
  log(t_id + ("adding label '" + label_name + "'"));
  return getLabel(label_name).addToThread(t);
};

remLabel = function(t, label_name) {
  log(t_id + ("removing label '" + label_name + "'"));
  return getLabel(label_name).removeFromThread(t);
};

notify = function(t) {
  if (notified.some(function(n) {
    return n === t;
  })) {
    return;
  }
  notified.push(t);
  log(t_id + 'notifying');
  sendMail(notification_text + ' ' + t.getLastMessageDate(), t.getFirstMessageSubject() + t_id);
  return addLabel(t, 'notification/notified');
};

archiveOldNotification = function(t) {
  var thread;
  thread = wait() && GmailApp.getThreadById(t.getMessages()[0].getPlainBody().match(/\[([0-9a-f]{16})\]/)[1]);
  if (!(thread.isInInbox() && thread.isUnread() && thread.getLabels().some(function(label) {
    return label === 'notification/yes';
  }))) {
    log(t_id + ("archiving notification for [" + (thread.getId()) + "] ") + thread.getFirstMessageSubject());
    return t.moveToArchive();
  }
};

archive = function(t) {
  log(t_id + 'archiving');
  return t.moveToArchive();
};


/* Filters */

olderThan = function(period) {
  var match;
  if (!(match = /(\d+)min/.exec(period))) {
    throw "Unrecognised period '" + period + "'";
  }
  return function(t) {
    return t.getLastMessageDate() < new Date(new Date() - 6e4 * match[1]);
  };
};


/* The Worker */

processMail = function(rules) {
  var i, j, k, len, len1, rule, thread, threads;
  log("PROCESS MAIL [#$SHA#]");
  for (j = 0, len = rules.length; j < len; j++) {
    rule = rules[j];
    log(rule.query);
    i = 0;
    while (((threads = wait() && GmailApp.search(rule.query, i, 100)) != null) && threads.length) {
      log("  Loaded threads " + i + " to " + (i += threads.length));
      for (k = 0, len1 = threads.length; k < len1; k++) {
        thread = threads[k];
        t_id = "    [" + (thread.getId()) + "] ";
        if ((rule.filter != null) && !rule.filter(thread)) {
          log(t_id + 'skipping');
        } else {
          log(t_id + thread.getFirstMessageSubject());
          rule.action(thread);
        }
      }
    }
  }
  return null;
};


/* Entry Points */

processHighPriorityRules = function() {
  log('High Priority');
  return processMail([
    {
      query: "in:(notification/yes)  subject:\"" + notification_text + "\"",
      action: function(t) {
        return remLabel(t, 'notification/yes');
      }
    }, {
      query: 'in:(inbox unread notification/yes) older_than:3h',
      action: function(t) {
        return addLabel(t, 'notification/expired');
      }
    }, {
      query: 'in:(notification/yes)  older_than:3h',
      action: function(t) {
        return remLabel(t, 'notification/yes');
      }
    }, {
      query: 'in:(notification/maybe  development)',
      action: function(t) {
        return addLabel(t, 'notification/no');
      }
    }, {
      query: 'in:(notification/maybe -notification/no)',
      action: function(t) {
        remLabel(t, 'notification/maybe');
        return addLabel(t, 'notification/yes');
      }
    }, {
      query: 'in:(notification/maybe  notification/no)',
      action: function(t) {
        return remLabel(t, 'notification/maybe');
      }
    }, {
      query: 'in:(inbox unread notification/yes)',
      filter: olderThan('10min'),
      action: notify
    }
  ]);
};

processLowPriorityRules = function() {
  log('Low Priority');
  return processMail([
    {
      query: "in:(inbox) subject:\"" + notification_text + "\"",
      filter: olderThan('2min'),
      action: archiveOldNotification
    }, {
      query: 'in:(inbox  monitoring -production)   from:raygun',
      action: archive
    }, {
      query: 'in:(inbox  monitoring) from:raygun',
      filter: olderThan('10min'),
      action: archive
    }, {
      query: 'in:(inbox  sns)',
      filter: olderThan('5min'),
      action: archive
    }, {
      query: 'in:(inbox  development)',
      filter: olderThan('20min'),
      action: archive
    }, {
      query: 'in:(inbox  promotions)               older_than:4h',
      action: archive
    }, {
      query: 'in:(inbox  security-notice)          older_than:6h',
      action: archive
    }, {
      query: 'in:(inbox  personal)                 older_than:8h',
      action: archive
    }, {
      query: 'in:(inbox  monitoring)               older_than:24h',
      action: archive
    }, {
      query: 'in:(inbox  confluence)               older_than:28h',
      action: archive
    }, {
      query: 'in:(inbox  globaldairytrade)         older_than:32h',
      action: archive
    }, {
      query: 'in:(inbox  alphacert)                older_than:32h',
      action: archive
    }, {
      query: 'in:(inbox  code)                     older_than:36h',
      action: archive
    }, {
      query: 'in:(inbox  calendar)                 older_than:40h',
      action: archive
    }, {
      query: 'in:(inbox  technical-reference)      older_than:40h',
      action: archive
    }, {
      query: 'in:(inbox  updates)                  older_than:40h',
      action: archive
    }, {
      query: 'in:(inbox  ticket-management)        older_than:48h',
      action: archive
    }
  ]);
};