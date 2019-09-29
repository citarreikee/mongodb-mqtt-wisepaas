const express = require('express');
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());

//connect mongodb
const vcap_services = JSON.parse(process.env.VCAP_SERVICES);
const replicaSetName = vcap_services['mongodb'][0].credentials.replicaSetName;
const db = vcap_services['mongodb'][0].credentials.uri + '?replicaSet=' + replicaSetName;


//creat shema
mongoose.connect(db)
  .then(() => console.log('Connected to the MongoDB...'))
  .catch(err => console.log('Could not connect to MongoDB...', err));
  
  const machineSchema = new mongoose.Schema({
    DeviceInformation: {
      Name: String,
      Topology: String,
      IDNumber: Number,
      DrivingMode: String,
      ProductType: String,
    },
    ControlSystem: {
      IOPortStatus: Boolean,
      PowerStatus: Boolean,
      Current_Gcode: String,
      EmergencyStop: String,
    },
    AuxiliaryDevice: {
      CoolingStatus: Boolean,
      ExhaustStatus: Boolean,
      HydaulicStatus: Boolean,
      CuttingFluidStatus: Boolean,
      LubricationStatus: Boolean,
      ChipRemovalStatus: Boolean,
    },
    LinearShaftAxis: {
      LinearShaftAxis1: {
        Rate: Number,
        Status: Boolean,
        Speed: Number,
        Power: String,
        LoadCurrent: Number,
        CodePosition:Number,
        FeedbackPosition: Number
      },
      LinearShaftAxis2: {
        Rate: Number,
        Status: Boolean,
        Speed: Number,
        Power: String,
        LoadCurrent: Number,
        CodePosition:Number,
        FeedbackPosition: Number
      },
      LinearShaftAxis3: {
        Rate: Number,
        Status: Boolean,
        Speed: Number,
        Power: String,
        LoadCurrent: Number,
        CodePosition: Number,
        FeedbackPosition: Number
      }
    },
    SpindleAxis: {
      Rate: Number,
      Status: Boolean,
      Speed: Number,
      Power: String,
      LoadCurrent: Number,
      Temperature: Number
    },
    RotatingShaftAxis:{
      RotatingShaftAxis1: {
        Rate: Number,
        Status: Boolean,
        Speed: Number,
        Power: String,
        LoadCurrent: Number,
        CodePosition: Number,
        FeedbackPosition: Number
      },
      RotatingShaftAxis2: {
        Rate: Number,
        Status: Boolean,
        Speed: Number,
        Power: String,
        LoadCurrent: Number,
        CodePosition: Number,
        FeedbackPosition: Number
      }
    }
    

  });
  
//creat model
const machine = mongoose.model('machine', machineSchema);


//API
app.get('/', (req, res) => {
  res.send('Hello WISE-PaaS! Welcome!');
});

//PORT
const port = process.env.PORT || 3030;
const server = app.listen(port, () => console.log(`Listening on port ${port}...`));

// -- Get env variables for rabbitmq service
const vcapServices = JSON.parse(process.env.VCAP_SERVICES);
const mqttUri = vcapServices['p-rabbitmq'][0].credentials.protocols.mqtt.uri

const client = mqtt.connect(mqttUri);

// Subscribe
client.on('connect', (connack) => {
  client.subscribe('machine', (err, granted) => {
    if (err) console.log(err);

    console.log('@' + formatTime() + ' -- Subscribed to the topic: machine');
  });
}); 

// Receiving data
client.on('message', (topic, message, packet) => {
  let time = formatTime();
  console.log(`@${time} -- Got data from: ${topic}`);

  // insert machine  data sample
  var MachineInformation = message.toString();
  var Minfo = MachineInformation.split(",");

  const newmachine =  new machine({
    DeviceInformation:{Name: Number(Minfo[0])},
    SpindleAxis: {Speed: parseFloat (Minfo[1])},
    RotatingShaftAxis:{ RotatingShaftAxis2: {Rate: Number(Minfo[2])}}
  });
 
  // save
  newmachine.save(function(err){
    if(err){
      console.log(err);
    }else{
      console.log('saved');
    }
  });
});

// Return current formatted time
function formatTime() {
  const currentDate = new Date();
  return currentDate.getHours() + ':' + currentDate.getMinutes() + ':' + currentDate.getSeconds();
}
