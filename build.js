var stealTools = require("steal-tools");
var fs = require('fs-extra');

stealTools.export({
  	steal: {
  		config: __dirname + "/package.json!npm"
  	},
  	outputs: {
  		"+cjs": {},
  		"+amd": {},
  		"+global-js": {}
  	}
  })
  .then(function() {
    return new Promise(function(resolve, reject){
      fs.copy('src/observable-objects.js', 'dist/es6/async-transform.js', function (err, data) {
        if (err) {
          reject(err);
        }
        resolve(data);
      });
    });
  })
  .catch(function(e){

  	setTimeout(function(){
  		throw e;
  	},1);

  });
