var fs = require('fs');
var chain=require('./chain.js');

module.exports=function Copier(){};

module.exports.sync=chain(
	(n,src,dst) => {
		n.file0=src;
		n.file1=dst;
		fs.stat(n.file0, n);
	},
	(n, err,stat0) => {
		n.stat0=stat0;
		if(err)
			console.error("Can't stat source");
		else
			fs.stat(n.file1,n);
	},
	(n,dStatErr,stat1) => {
		n.stat1=stat1;
		n.dStatErr=dStatErr;
		if(dStatErr || Math.round(n.stat0.mtime.getTime()/30000)!=Math.round(n.stat1.mtime.getTime()/30000)){
			var reader = fs.createReadStream(n.file0);
			var writer = fs.createWriteStream(n.file1+".temp");
			
			var pipeHandled=false;
			reader.on("error",(err)=>{
				if(!pipeHandled){
					pipeHandled=true;
					n(err);
				}
			});
			writer.on("error",(err)=>{
				if(!pipeHandled){
					pipeHandled=true;
					n(err);
				}
			});
			writer.on("close",()=>{
				if(!pipeHandled){
					pipeHandled=true;
					n();
				}
			});
			reader.pipe(writer);
		}
	},
	(n,err) => {
		if(n.pipeHandled)
			return;
		
		n.pipeHandled=true;
		if(!n.dStatErr)
			console.log("Time original vs destination: "+Math.round((n.stat0||{}).mtime.getTime()/1000)+" "+Math.round((n.stat1||{}).mtime.getTime()/1000));
		console.log("Date changed. File copied with result: "+(err||"OK"));
		if(!err)
			fs.unlink(n.file1,n);
		else if(n.dStatErr)
			n();
	},
	(n,err) => {
		if(!err)
			fs.rename(n.file1+".temp",n.file1,n);
		else
			console.error("Can't rename temp "+err);
	},
	(n,err) => {
		fs.utimes(n.file1,n.stat0.mtime,n.stat0.atime,n);
	},
	(n,err) => {
		if(err)
			console.error("Can't change file time "+err);
		else
			console.error("File updated");
	}
);