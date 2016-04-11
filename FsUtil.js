const child_process = require('child_process');

var FsUtil= module.exports = function FsUtil(){
}

FsUtil.prototype.diskFree = function(driveLetter,onDone){
	driveLetter=driveLetter.substr(0,1).toLowerCase();
	if(!(/^[a-z]$/.exec(driveLetter)))
		return;
	var cp = child_process.spawn('fsutil.exe',[
		"volume","diskfree",driveLetter+":"
	],{maxBuffer: 1024*1024*1024*32});
	var data="";
	cp.stdout.on("data",function(m){
		data+=m;
	});
	cp.on('close',function(){
		var src=data.replace(/\r/g,"").split("\n");
		var values=[];
		for(var i=0;i<src.length;i++){
			if(src[i].indexOf(":")>=0){
				var line=parseInt(src[i].split(":")[1].trim());
				if(! isNaN(line))
					values.push(line);
			}
		}
		if(values.length==3){
			var free=values[0];
			var total=values[1];
			onDone(free,total);
		}else{
			onDone();
		}
		
	});
};