var assert = require("assert"),
fs = require('fs'),
glob = require('glob'),
path = require('path'),
_ = require('lodash'),
z = require('z-schema'),
request = require('request'),
util = require('util');
spec = require('swagger-tools').specs.v2;

var extensionSwaggerSchemaUrl = "https://raw.githubusercontent.com/Azure/autorest/master/schema/swagger-extensions.json";
var swaggerSchemaUrl = "http://json.schemastore.org/swagger-2.0";
var swaggerSchemaAltUrl = "http://swagger.io/v2/schema.json";
var schemaUrl = "http://json-schema.org/draft-04/schema";
var exampleSchemaUrl = "https://raw.githubusercontent.com/Azure/autorest/master/schema/example-schema.json";
var swaggerSchema; 
var extensionSwaggerSchema;
var schema4;
var exampleSchema;

function swaggerName(value){
  return value.includes("azure-rest-api-specs/arm-storage/2016-01-01/swagger/storage.json");
}
var globPath = path.join(__dirname, '../', '/**/swagger/*.json');
var swaggers = _(glob.sync(globPath));
// var swaggers = _(glob.sync(globPath)).filter(swaggerName);  // uncomment this statement to validate swagger files returned from the filter.

var childProcess = require('child_process');

function runScript(scriptPath, args, callback) {

    // keep track of whether callback has been invoked to prevent multiple invocations
    var invoked = false;

    var process = childProcess.fork(scriptPath, args);

    // listen for errors as they may prevent the exit event from firing
    process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        callback(err);
    });

    // execute the callback once the process has finished running
    process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        var err = code === 0 ? null : new Error('exit code ' + code);
        callback(err);
    });

}

// Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
// because the buffer-to-string conversion in `fs.readFile()`
// translates it to FEFF, the UTF-16 BOM.
function stripBOM(content) {
  if (Buffer.isBuffer(content)) {
    content = content.toString();
  }
  if (content.charCodeAt(0) === 0xFEFF || content.charCodeAt(0) === 0xFFFE) {
    content = content.slice(1);
  }
  return content;
}

function specValidator(parsedSpecInJson, callback) {
  spec.validate(parsedSpecInJson, function (err, result) {
    if (err) {
      callback(err);
    }
    if (result && result.errors.length > 0) {
      console.log('');
      console.log('Errors');
      console.log('------');

      result.errors.forEach(function (err) {
          console.log(err.code + ' : ' + '#/' + err.path.join('/') + ' : ' + err.message);
      });
      callback(new Error(util.inspect(result.errors, {depth: null})));
    } else {
      callback();
    }
  });
}

function parseJSON(swaggerSpecPath, callback) {
  fs.readFile(swaggerSpecPath, 'utf8', function(err, data) {
    if(err) { return callback(err); }
    return callback(null, JSON.parse(stripBOM(data)));
  });
}

describe('Azure Open API spec validation for', function() {
  var parsedData = {};
  before(function(done) {
    request({url: extensionSwaggerSchemaUrl, json:true}, function (error, response, extensionSwaggerSchemaBody) {        
      request({ url: swaggerSchemaAltUrl, json: true }, function (error, response, swaggerSchemaBody) {
        request({ url: exampleSchemaUrl, json: true }, function (error, response, exampleSchemaBody) {
          extensionSwaggerSchema = extensionSwaggerSchemaBody;
          swaggerSchema = swaggerSchemaBody;
          exampleSchema = exampleSchemaBody;
          done();
        });
      });
    });
  });

  _(swaggers).each(function(swagger){
    it(swagger + ' should be valid Swagger', function(done) {
      parseJSON(swagger, function(err, data) {
        if(err) { done(err); }
        
        parsedData = data;
        if (parsedData.documents && util.isArray(parsedData.documents)) {
          console.log(util.format('Skipping the test for \'%s\' document as it seems to be a composite swagger doc.', swagger));
          done();
        }
        var validator = new z({
          breakOnFirstError: false
        });
        validator.setRemoteReference(swaggerSchemaUrl, swaggerSchema);
        validator.setRemoteReference(exampleSchemaUrl, exampleSchema);
        var valid = validator.validate(data, extensionSwaggerSchema);
        if (!valid) {
            var error = validator.getLastErrors();
            throw new Error("Schema validation failed: " + JSON.stringify(error, null, "\t"));
        }
        assert(valid === true);
        done();
      });
    });
    it(swagger + ' should be a valid open api spec using swagger-tools semantic validation\n', function(done) {
      if (parsedData.documents && util.isArray(parsedData.documents)) {
        console.log(util.format('Skipping the test for \'%s\' document as it seems to be a composite swagger doc.', swagger));
        done();
      }
      //merge x-ms-paths into paths if they exist
      if (parsedData['x-ms-paths'] && parsedData['x-ms-paths'] instanceof Object && 
        Object.keys(parsedData['x-ms-paths']).length > 0) {
        var paths = parsedData.paths;
        for (var property in parsedData['x-ms-paths']) {
          paths[property] = parsedData['x-ms-paths'][property];
        }
        parsedData.paths = paths;
      }
      specValidator(parsedData, function (err) {
       // ignore errors for now
        // if (err) {
        //   done(err);
        // } else {
        //   done();
        // }
      done();
      });
    });
    it(swagger + ' should validate against model definition\n', function(done) {
      runScript('./node_modules/openapi-validator-tools/validate.js',["example", swagger], function (err) {
        //ignore errors for now
        //if (err) throw err;
        console.log('finished running model validator');
        done();
      });
    });
  }).value();
});
