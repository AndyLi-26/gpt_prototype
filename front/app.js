const express = require('express')
const path = require('path')
const https=require('https')
//const cors = require('cors')
const fs = require('fs')

const app = express()
const port = 80;

//const file=fs.readFileSync('./B254E8E54A7E5A04E79256C8C06E65C9.txt')
const key=fs.readFileSync('./private.key')
const cert=fs.readFileSync('./certificate.crt')

//app.use(cors())

const cred={
	key,
	cert
}

app.use(express.static(path.join(__dirname, 'public')));

/*
app.get('/.well-known/pki-validation/B254E8E54A7E5A04E79256C8C06E65C9.txt',(req,res)=>{
res.sendFile('/home/ubuntu/gpt_prototype/B254E8E54A7E5A04E79256C8C06E65C9.txt')
})
*/









app.use(function(req, res) {
  res.status(400);
  return res.send(`404 Error: Resource not found`);
});

app.listen(port, () => {
  console.log(`App listening  on port ${port}`);
})

const httpsServer=https.createServer(cred,app)
httpsServer.listen(443)

