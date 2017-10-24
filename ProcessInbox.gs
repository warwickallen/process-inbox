/* ProcessInbox.coffee [b503d03893f5ab1b6a0b2d63e6fe3efebcb68d75]
notification_text = 'IMPORTANT MAIL NOTIFICATION'
notified = []   # Remember which threads we have alreadly sent notification messages for.
__ = labels = {}
t_id = null

log = (msg) ->
  console.log msg

wait = ->
  Utilities.sleep 250
  Utilities.sleep 250 while (new Date()).getSeconds() % 10
  true

getLabel = (name) ->
  labels[name] ?= wait() and GmailApp.getUserLabelByName(name) ? throw "Label '#{name}' doesn't exist"

address = ->
  __[address] ?= Session.getActiveUser().getEmail()

sendMail = (subject, body) ->
  wait() and MailApp.sendEmail address(), subject, body


### Actions ###

addLabel = (t, label_name) ->
  log t_id + "adding label '#{label_name}'"
  getLabel(label_name).addToThread t

remLabel = (t, label_name) ->
  log t_id + "removing label '#{label_name}'"
  getLabel(label_name).removeFromThread t

notify = (t) ->
  return if notified.some (n) -> n is t  # Only notify once for each round.
  notified.push t
  log t_id + 'notifying'
  sendMail notification_text + ' ' + t.getLastMessageDate(), t.getFirstMessageSubject() + t_id
  addLabel t, 'notification/notified'

archiveOldNotification = (t) ->
  thread = wait() and GmailApp.getThreadById t.getMessages()[0].getPlainBody().match(/\[([0-9a-f]{16})\]/)[1]
  unless thread.isInInbox() && thread.isUnread() && thread.getLabels().some((label) -> label is 'notification/yes')
    log t_id + "archiving notification for [#{thread.getId()}] " + thread.getFirstMessageSubject()
    t.moveToArchive()

archive = (t) ->
  log t_id + 'archiving'
  t.moveToArchive()


### Filters ###

olderThan = (period) ->
  throw "Unrecognised period '#{period}'" unless match = /(\d+)min/.exec(period)
  (t) -> t.getLastMessageDate() < new Date(new Date() - 6e4*match[1])


### The Worker ###

processMail = (rules) ->
  log "PROCESS MAIL [#$SHA#]"
  for rule in rules
    log rule.query
    i = 0
    while (threads = wait() and GmailApp.search rule.query, i, 100)? and threads.length
      log("  Loaded threads #{i} to #{i += threads.length}")
      for thread in threads
        t_id = "    [#{thread.getId()}] "
        if rule.filter? and not rule.filter thread
          log t_id + 'skipping'
        else
          log t_id + thread.getFirstMessageSubject()
          rule.action(thread)
  null


### Entry Points ###

processHighPriorityRules = ->
  log 'High Priority'
  processMail [
    {
      query:  "in:(notification/yes)  subject:\"#{notification_text}\""
      action: (t) -> remLabel t, 'notification/yes'
    }, {
      query:  'in:(inbox unread notification/yes) older_than:3h'
      action: (t) -> addLabel t, 'notification/expired'
    }, {
      query:  'in:(notification/yes)  older_than:3h'
      action: (t) -> remLabel t, 'notification/yes'
    }, {
      query:  'in:(notification/maybe  development)'
      action: (t) -> addLabel t, 'notification/no'
    }, {
      query:  'in:(notification/maybe -notification/no)'
      action: (t) -> remLabel t, 'notification/maybe';\
                     addLabel t, 'notification/yes'
    }, {
      query:  'in:(notification/maybe  notification/no)'
      action: (t) -> remLabel t, 'notification/maybe'
    }, {
      query:  'in:(inbox unread notification/yes)'
      filter: olderThan '10min'
      action: notify
    }
  ]

processLowPriorityRules = ->
  log 'Low Priority'
  processMail [
    {
      query:  "in:(inbox) subject:\"#{notification_text}\""
      filter: olderThan '2min'
      action: archiveOldNotification
    }, {
      query:  'in:(inbox  monitoring -production)   from:raygun'
      action: archive
    }, {
      query:  'in:(inbox  monitoring) from:raygun'
      filter: olderThan '10min'
      action: archive
    }, {
      query:  'in:(inbox  sns)'
      filter: olderThan '5min'
      action: archive
    }, {
      query:  'in:(inbox  development)'
      filter: olderThan '20min'
      action: archive
    }, {
      query:  'in:(inbox  promotions)               older_than:4h'
      action: archive
    }, {
      query:  'in:(inbox  security-notice)          older_than:6h'
      action: archive
    }, {
      query:  'in:(inbox  personal)                 older_than:8h'
      action: archive
    }, {
      query:  'in:(inbox  monitoring)               older_than:24h'
      action: archive
    }, {
      query:  'in:(inbox  confluence)               older_than:28h'
      action: archive
    }, {
      query:  'in:(inbox  globaldairytrade)         older_than:32h'
      action: archive
    }, {
      query:  'in:(inbox  alphacert)                older_than:32h'
      action: archive
    }, {
      query:  'in:(inbox  code)                     older_than:36h'
      action: archive
    }, {
      query:  'in:(inbox  calendar)                 older_than:40h'
      action: archive
    }, {
      query:  'in:(inbox  technical-reference)      older_than:40h'
      action: archive
    }, {
      query:  'in:(inbox  updates)                  older_than:40h'
      action: archive
    }, {
      query:  'in:(inbox  ticket-management)        older_than:48h'
      action: archive
    }
  ]
*/

// Generated by CoffeeScript 1.9.3
var __, notified, t_id, labels, notification_text;

notification_text = 'IMPORTANT MAIL NOTIFICATION';

notified = [];

__ = labels = {};

t_id = null;

function log(msg) {
  return console.log(msg);
};

function wait() {
  Utilities.sleep(250);
  while ((new Date()).getSeconds() % 10) {
    Utilities.sleep(250);
  }
  return true;
};

function getLabel(name) {
  var ref;
  return labels[name] != null ? labels[name] : labels[name] = (function() {
    if ((ref = wait() && GmailApp.getUserLabelByName(name)) != null) {
      return ref;
    } else {
      throw "Label '" + name + "' doesn't exist";
    }
  })();
};

function address() {
  return __[address] != null ? __[address] : __[address] = Session.getActiveUser().getEmail();
};

function sendMail(subject, body) {
  return wait() && MailApp.sendEmail(address(), subject, body);
};


/* Actions */

function addLabel(t, label_name) {
  log(t_id + ("adding label '" + label_name + "'"));
  return getLabel(label_name).addToThread(t);
};

function remLabel(t, label_name) {
  log(t_id + ("removing label '" + label_name + "'"));
  return getLabel(label_name).removeFromThread(t);
};

function notify(t) {
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

function archiveOldNotification(t) {
  var thread;
  thread = wait() && GmailApp.getThreadById(t.getMessages()[0].getPlainBody().match(/\[([0-9a-f]{16})\]/)[1]);
  if (!(thread.isInInbox() && thread.isUnread() && thread.getLabels().some(function(label) {
    return label === 'notification/yes';
  }))) {
    log(t_id + ("archiving notification for [" + (thread.getId()) + "] ") + thread.getFirstMessageSubject());
    return t.moveToArchive();
  }
};

function archive(t) {
  log(t_id + 'archiving');
  return t.moveToArchive();
};


/* Filters */

function olderThan(period) {
  var match;
  if (!(match = /(\d+)min/.exec(period))) {
    throw "Unrecognised period '" + period + "'";
  }
  return function(t) {
    return t.getLastMessageDate() < new Date(new Date() - 6e4 * match[1]);
  };
};


/* The Worker */

function processMail(rules) {
  var i, j, k, len, len1, rule, thread, threads;
  log("PROCESS MAIL [b503d03893f5ab1b6a0b2d63e6fe3efebcb68d75]");
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

function processHighPriorityRules() {
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

function processLowPriorityRules() {
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