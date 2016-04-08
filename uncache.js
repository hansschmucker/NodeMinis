/*
	Copyright Ben Barkay, as posted on
	http://stackoverflow.com/questions/9210542/node-js-require-cache-possible-to-invalidate/14801711#14801711
	under http://creativecommons.org/licenses/by-sa/2.5/ 
*/

var Uncacher= module.exports = function(){
};

Uncacher.uncache = function (moduleName) {
    Uncacher.searchCache(moduleName, function (mod) {
        delete require.cache[mod.id];
    });

    Object.keys(module.constructor._pathCache).forEach(function(cacheKey) {
        if (cacheKey.indexOf(moduleName)>0) {
            delete module.constructor._pathCache[cacheKey];
        }
    });
};


Uncacher.searchCache = function (moduleName, callback) {
    var mod = require.resolve(moduleName);

    if (mod && ((mod = require.cache[mod]) !== undefined)) {
        (function run(mod) {
            mod.children.forEach(function (child) {
                run(child);
            });

            callback(mod);
        })(mod);
    }
};
