const SerialPort = require('serialport')
const dataSchema = require('./schema1.json');
const Delimiter = require('@serialport/parser-delimiter')

//Opening a Port
var serialPort = new SerialPort('COM3', {
    baudRate : 115200,
    autoOpen:false
});
serialPort.open(function (err) {
    if(err){
        console.log(':',err);
        return;
    }
    console.log('打开:',serialPort.isOpen);
});

let delimiterBuff = Buffer.from([0xA5,0x5A]);
const parser = serialPort.pipe(new Delimiter({ delimiter: delimiterBuff }));

let senddata = {},parseOrNot=false;
parser.on('data', function(data){
    // console.log(`帧头1: ${data.slice(0,1).toString("hex")}`);
    // console.log(`帧头2: ${data.slice(1,2).toString("hex")}`);
    // console.log(data.byteLength);
    if(data.byteLength===68){
        parseOrNot=true;
    }
    else if(data.byteLength>68){
        data = data.slice(0,68);
        parseOrNot=true;
    }
    else{
        parseOrNot=false;
    }
    if(parseOrNot){
        let step = 0;
        console.log('---------');
        console.log(new Date().toISOString())
        dataSchema.map((element,index) => {
            let value;
            let scale = element.scale?element.scale:1;
            if(element.type==='int'){
                value = data.readInt32LE(step);
                step+=4;
            }
            else if(element.type==='int2'){
                value = data.readInt16LE(step);
                step+=2;
            }
            else if(element.type==='uint2'){
                value = data.readUInt16LE(step);
                step+=2;
            }
            else if(element.type==='uint'){
                value = data.readUInt32LE(step);
                step+=4;
            }
            else if(element.type=='float'){
                value = data.readFloatLE(step);
                step+=4;
            }
            senddata[element.name] = value/scale;
            // return {
            //     name:element.name,
            //     value:value
            // }
            console.log(`${element.name}: ${value/scale}`);
            // console.log(`step: ${step}`);
        });
    }
});