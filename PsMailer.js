const child_process = require('child_process');

var PsMailer= module.exports = function PsMailer(server){
	this.server=server;
}

PsMailer.prototype.server="";

PsMailer.prototype.sendMail = function(from,to,title,body,onDone){
	var cp = child_process.spawn('powershell.exe',[
		"-c",
		"$body=[system.console]::in.readtoend(); Send-MailMessage -body $body -to '"+
		to.replace(/'/g,"''").replace(/"/g,'""')+"' -Subject '"+
		title.replace(/'/g,"''").replace(/"/g,'""')+"' -smtpserver '"+
		this.server.replace(/'/g,"''").replace(/"/g,'""')+"' -from '"+
		from.replace(/'/g,"''").replace(/"/g,'""')+"'"
	],{maxBuffer: 1024*1024*1024*32});
	
	cp.on('close',onDone);
	
	cp.stdin.write(body);
	cp.stdin.end();
};