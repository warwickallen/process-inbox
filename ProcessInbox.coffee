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

currentTimeBetween = (start_time, end_time) ->
  setHours = (date, time) ->
    unless (match = /(\d?\d):(\d\d)(?::(\d\d))?/.exec(time))?
      throw "'#{time}' should be in the format 'hh:mm' or 'hh:mm:ss'"
    date.setHours match[1], match[2] ? 0, match[3] ? 0, 0
  () ->
    now = new Date()
    start = new Date now
    setHours start, start_time
    end = new Date now
    setHours end, end_time
    retval = if end > start then now >= start and now <= end else now >= start or now <= end
    log "#{now} is #{if retval then "" else "not "}in the range (#{start}, #{end})."
    retval


### The Worker ###

processMail = (rules) ->
  log "PROCESS MAIL [#$SHA#] #$COMPILE_TIME#"
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
      filter: (t) -> currentTimeBetween('9:00', '22:00')()  # Don't expire old messages outside of the notification time.
      action: (t) -> addLabel t, 'notification/expired'
    }, {
      query:  'in:(notification/yes)  older_than:3h'
      filter: (t) -> currentTimeBetween('9:00', '22:00')()  # Don't expire old messages outside of the notification time.
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
      query:  "in:(inbox unread notification/yes) -subject:\"#{notification_text}\""
      filter: (t) -> currentTimeBetween('6:00', '22:00')() and olderThan('3min')(t)
      action: notify
    }, {
      query:  "in:(inbox unread -notification/yes) from:(australiansuper.com OR australiansuper.net.au)"
      filter: (t) -> currentTimeBetween('18:00', '20:00')() # On-call for Australian Super between 6 and 8 pm.
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
      query:  'in:(inbox  auckland-council)         older_than:1h'
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
