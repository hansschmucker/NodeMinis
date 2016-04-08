var fs = require('fs');
var Uncacher = require('./uncache.js');

var Cron = module.exports = function Cron(){
	this.states={};
	this.onTick=this.onTick.bind(this);
	this.processTriggers=this.processTriggers.bind(this);
	this.processSingleTrigger=this.processSingleTrigger.bind(this);
};

Cron.prototype.states=null;
Cron.prototype.timer=null;
Cron.prototype.running=false;
Cron.prototype.sleep=45000;
Cron.prototype.triggerPath="./trigger/";
Cron.prototype.jobPath="./jobs/";


Cron.prototype.onTick = function(){
	fs.readdir(this.triggerPath,this.processTriggers);
};

Cron.prototype.processTriggers = function(err,files){
	for(var i=0;i<files.length;i++)
		if(files[i].substr(-3).toLowerCase()==".js")
			fs.readFile(this.triggerPath+files[i],this.processSingleTrigger);
};

Cron.prototype.parseTime=function(triggerTime){
	switch(triggerTime.length){
		case 2:
			var targetTime=new Date(
				now.getFullYear(),
				now.getMonth(),
				now.getDate(),
				now.getHours(),
				parseInt(triggerTime,10)
			);
			break;
		case 4:
			var targetTime=new Date(
				now.getFullYear(),
				now.getMonth(),
				now.getDate(),
				parseInt(triggerTime.substr(0,2),10),
				parseInt(triggerTime.substr(2,2),10)
			);
			break;
		case 6:
			var targetTime=new Date(
				now.getFullYear(),
				now.getMonth(),
				parseInt(triggerTime.substr(0,2),10),
				parseInt(triggerTime.substr(2,2),10),
				parseInt(triggerTime.substr(4,2),10)
			);
			break;
		case 8:
			var targetTime=new Date(
				now.getFullYear(),
				parseInt(triggerTime.substr(0,2),10)-1,
				parseInt(triggerTime.substr(2,2),10),
				parseInt(triggerTime.substr(4,2),10),
				parseInt(triggerTime.substr(6,2),10)
			);
			break;
		case 12:
			var targetTime=new Date(
				parseInt(triggerTime.substr(0,4),10),
				parseInt(triggerTime.substr(4,2),10)-1,
				parseInt(triggerTime.substr(6,2),10),
				parseInt(triggerTime.substr(8,2),10),
				parseInt(triggerTime.substr(10,2),10)
			);
			break;
		default:
			throw("Trigger format incorrect");
	}
	return targetTime;
}

Cron.prototype.processSingleTrigger = function(err,trigger){
	try{
		trigger=JSON.parse(trigger);
	}catch(e){
		console.error("Can't parse Trigger "+e);
		trigger=null;
	}
	
	for(var j=0;trigger && j<trigger.triggers.length;j++){
		var triggerTime=trigger.triggers[j].value;
		
		if(!this.states[trigger.job])
			this.states[trigger.job]={};
		if(!this.states[trigger.job][trigger.triggers[j].type+"|"+triggerTime])
			this.states[trigger.job][trigger.triggers[j].type+"|"+triggerTime]={};
		
		var triggerStates=this.states[trigger.job][trigger.triggers[j].type+"|"+triggerTime];
		
		var now=new Date();
				

		try{
			var targetTime=this.parseTime(triggerTime);
		}catch(e){
			console.error("Can't parse trigger time");
			targetTime=null;
		}
		
		if(!targetTime)
			return;
		
		var triggerTimeId=targetTime.getUTCFullYear()+("0"+targetTime.getUTCMonth()).slice(-2)+("0"+targetTime.getUTCDate()).slice(-2)+("0"+targetTime.getUTCHours()).slice(-2)+("0"+targetTime.getUTCMinutes()).slice(-2);

		//Trigger was already run for the current time padded value, so abort
		if(triggerStates[triggerTimeId])
			continue;
		
		//check if the requried timepoint has already passed. If not abort
		if(targetTime.getTime()>now.getTime())
			continue;
		
		//Don't try to catch up beyond more than three hours
		if((now.getTime()-targetTime.getTime())>10800000)
			continue;
		
		console.log(now.toISOString()+" Triggered "+trigger.job+" from trigger "+trigger.triggers[j].type+"|"+triggerTime+" with "+targetTime.toISOString());
		triggerStates[triggerTimeId]=true;
		
		Uncacher.uncache(this.jobPath+trigger.job+".js");
		var job=require(this.jobPath+trigger.job+".js");
		job.run();
	}
};


Cron.prototype.start = function(){
	if(this.running)
		return;
	
	this.timer=setInterval(this.onTick, this.sleep);
	this.running=true;
};

Cron.prototype.stop = function(){
	if(!this.running)
		return;
	
	this.clearInterval(this.timer);
	this.timer=null;
	this.running=false;
};
