chrome.runtime.sendMessage({action: "remove-events", events: window.localStorage.getItem("qla_events")});
window.localStorage.setItem("qla_events",[])