var fs = require('fs');
var chain=require('./chain.js');

module.exports=function Copier(){};

module.exports.sync=chain(
	//Stat src
	($,src,dst) => {
		$.file0=src;
		$.file1=dst;
		fs.stat($.file0, $);
	},
	//Stat dst
	($,err,stat0) => {
		$.stat0=stat0;
		if(err)
			console.error("Can't stat source");
		else
			fs.stat($.file1,$);
	},
	//Copy to temp if mismatch by 30 seconds
	($,dStatErr,stat1) => {
		$.stat1=stat1;
		$.dStatErr=dStatErr;
		if(dStatErr || Math.round($.stat0.mtime.getTime()/30000)!=Math.round($.stat1.mtime.getTime()/30000)){
			var reader = fs.createReadStream($.file0);
			var writer = fs.createWriteStream($.file1+".temp");
			
			$.pipeHandled=false;
			reader.on("error",$);
			writer.on("error",$);
			writer.on("close",()=>{
				$();
			});
			reader.pipe(writer);
		}
	},
	//Delete dst
	($,err) => {
		if($.pipeHandled)
			return;
		
		$.pipeHandled=true;
		if(!$.dStatErr)
			console.log("Time original vs destination: "+Math.round(($.stat0||{}).mtime.getTime()/1000)+" "+Math.round(($.stat1||{}).mtime.getTime()/1000));
		console.log("Date changed. File copied with result: "+(err||"OK"));
		if(!err)
			fs.unlink($.file1,$);
		else if($.dStatErr)
			$();
	},
	//Rename tmp to dst
	($,err) => {
		if(!err)
			fs.rename($.file1+".temp",$.file1,$);
		else
			console.error("Can't rename temp "+err);
	},
	//Set last modified and access time on dst to src
	($,err) => {
		fs.utimes($.file1,$.stat0.mtime,$.stat0.atime,$);
	},
	//Done.
	($,err) => {
		if(err)
			console.error("Can't change file time "+err);
		else
			console.error("File updated");
	}
);