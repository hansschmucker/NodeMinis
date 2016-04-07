var ChainInstance=function(callbacks,scope){
	this.chain=callbacks;
	this.n=this.n.bind(this);
	this.scope = scope||null;
};

ChainInstance.prototype.chain = null;
ChainInstance.prototype.position = -1;
ChainInstance.prototype.scope = null;
ChainInstance.prototype.n = function(){
	this.position++;
	
	if(this.position<this.chain.length){
		var args=Array.prototype.slice.call(arguments);
		args.splice(0,0,this.n);
		this.chain[this.position].apply(this.scope,args);
	}
};

module.exports=function chain(){
	var callbacks=Array.prototype.slice.call(arguments);
	
	return function(){
		var instance=new ChainInstance(callbacks);
		instance.n.apply(null,Array.prototype.slice.call(arguments));
	};
}