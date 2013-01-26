var fs = require('fs');
var Buffer = require('buffer').Buffer;
var constants = require('constants');
var size = 0;
var encoded = '';
var fileName = '';
var wavFileName = '';
var base64FileName = '';

if(process.argv.length != 3){
	console.log("you didn't specify the name of the file to encode.");
	return;
}
else{
	fileName = process.argv[2];
	wavFileName = fileName + '.wav';
	base64FileName = fileName + '.js'
}

fs.lstat(wavFileName, function(err, stats) {
	size = stats.size;
});

fs.open(wavFileName, 'r', function(status, fd) {
    if (status) {
        console.log(status.message);
        return;
    }
    var buffer = new Buffer(size);
    fs.read(fd, buffer, 0, size, 0, function(err, num) {
        encoded = buffer.toString('base64', 0, num);
        encoded = 'var ' + fileName + ' = "' + encoded + '";';
	    fs.writeFile(base64FileName, encoded, function(err) {
		    if(err) {
		        console.log(err);
		    } else {
		        console.log("The file was saved!");
		    }
		}); 


    });


});