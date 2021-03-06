const strftime = require('strftime')
const days = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'];


function OsmSchedule(scheduleResponse, messages) {
  this.days = scheduleResponse.days
  this.displayHours = translateSchedule(this.days)
  this.nextTransition = nextTransitionTime(scheduleResponse.seconds_before_next_transition, scheduleResponse.next_transition_datetime)
  this.status = scheduleStatus(scheduleResponse, messages)
}


function scheduleStatus(scheduleResponse, timeMessages) {
  if(!scheduleResponse) {
    return {msg : '', color : '#fff'}
  }
  if(scheduleResponse.status === 'closed') {
    return {msg : timeMessages.closed.msg, color : timeMessages.closed.color}
  } else if(scheduleResponse.status === 'open') {
    return {msg : timeMessages.open.msg, color : timeMessages.open.color}
  }

  return {msg : '', color : '#fff'}
}

function nextTransitionTime(seconds, nextTransitionDate) {
  if(seconds < 12 * 60 * 60) {
    let nextTransition = new Date(nextTransitionDate)
    return strftime(i18nDate.timeFormat, nextTransition)
  }
  return false
}

function translateSchedule(days) {
  if(days) {
    return days.map((day) => {
      return {dayName : getDay(day.dayofweek % 7), opening : day.opening_hours}
    })
  } else {
    return []
  }
}

export default OsmSchedule
