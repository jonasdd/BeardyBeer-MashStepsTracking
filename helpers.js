var logZone = $("#log");
function logToUser(){
	console.log_(arguments);
	for(var i in arguments){
	  logZone.append("<p>"+arguments[i]+"</p>")
	}
}
console.log_=console.log;
console.log=logToUser;