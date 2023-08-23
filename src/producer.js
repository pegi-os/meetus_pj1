import { Kafka } from "kafkajs";


const kafka = new Kafka({
    clientId: 'my-app',
    brokers: ["34.239.254.238:9092","54.210.109.96:9092","54.167.94.239:9092"]
  })
  
  
  const producer = kafka.producer()
  
  const initKafka = async () => {
    await producer.connect()
  }
  
  app.post('/events/:event',  (req, res) => {
     producer.send({
      topic: 'quickstart-events',
      messages: [
        { value: req.params.event },
      ],
    })
    res.send('successfully stored event : '+ req.params.event + '\n')
  })
  
  app.listen(4000, async  () => {
    console.log(`kafka app listening on 4000`);
  })
  
  initKafka();