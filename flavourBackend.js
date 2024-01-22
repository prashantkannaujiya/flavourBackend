var express=require('express');
var app=express();
var bodyParser=require('body-parser');
var cors=require('cors');
var MongoClient=require('mongodb').MongoClient;
var url="mongodb://127.0.0.1:27017/";  
var jwt=require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { ObjectID } = require('bson');

app.set('views','./views');
app.use(cors());
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
var db;
const category=['bbqs','best-foods','breads','burgers','chocolates','desserts','drinks','fried-chicken','ice-cream','pizzas','sandwiches','sausages','steaks','our-foods'];

const client = new MongoClient(url);
db=client.db('flavour');
var d=[];
const seedDB=async()=>
{var i=0;
 
      await db.collection('taste').deleteMany({});
      for( i=0;i<category.length;i++)
      {
        d.push( fetch('https://adorable-bat-fatigues.cyclic.app/'+category[i]).then(res=>res.json()))
      }
  Promise.all(d).then(async(data)=>{
    
    for(var i=0;i<category.length;i++)
    {
        for(var j=0;j<data[i].length;j++)
        {
            data[i][j].category=category[i];
        }
    }
   console.log(data)
const p=data.flat(1); //merge all nested arrays into a single array

await db.collection('taste').insertMany(p);

  })
 
}
(async()=>{
    const p=await seedDB();
   //const w= 
    //console.log(w)
    
})()

app.get('/fetch/:cat/:price',async(req,res)=>{
    const category=req.params.cat;
    console.log(typeof(category))
    const price=req.params.price;
    console.log(price)
    if(price!='-1')
    {
if(price==0)
{
  db.collection('taste').find({$and:[{price:{$gte:0,$lte:50}},{category:category}]}).toArray().then((data)=>{
    res.send(data);
}).catch(e=>console.log(e));
}
else if(price==50)
{
  db.collection('taste').find({$and:[{price:{$gte:50,$lte:100}},{category:category}]}).toArray().then((data)=>{
    res.send(data);
}).catch(e=>console.log(e));
}
else
{
  db.collection('taste').find({$and:[{price:{$gte:100}},{category:category}]}).toArray().then((data)=>{
    res.send(data);
}).catch(e=>console.log(e));
}
    }
    else
    {
  db.collection('taste').find({category:category}).toArray().then((data)=>{
        res.send(data);
    }).catch(e=>console.log(e));
  }
  //const p=await seedDB();
  //console.log(p)
  //res.send(p)
})

app.post('/register',(req,res)=>{
  db.collection('user').find({username:req.body.username}).toArray().then((data)=>{
    console.log(data)
    if(data.length!=0)
    {
      
      res.send({message:'already registered'})
    }
    else
    {
db.collection('user').insertOne(req.body).then(async(data)=>{
  console.log(data)
const y=await db.collection('cart').insertOne({userid:data.insertedId});
 console.log(y)
  res.send({message:'registered'})}).catch(e=>console.log(e))
    }
  }).catch(e=>console.log(e))
})

app.post('/login',(req,res)=>{
 
  db.collection('user').find({username:req.body.username}).toArray().then(async(data)=>{
    console.log(data);
    if(data.length==0)
    {
      res.send({message:'kindly register'})
    }
    else
    {
      if(data[0].password==req.body.password)
      {
        
        res.send({message:'success',user:data[0]})
      }
      else
      {
        res.send({message:'Invalid credentials'})
      }
    }
  })
})

app.get('/addToCart/:product/:user',async(req,res)=>{
const id=req.params.product;
const userid=req.params.user;
console.log(typeof(id))
console.log(userid)

 /*db.collection('taste').findOne({_id:ObjectId(id)}).then((data)=>{
  console.log(data)
 })*/

db.collection('cart').find({$and:[{'userid':ObjectID(userid)},{'product._id':ObjectId(id)}]}).toArray().then(async(data)=>{
 // console.log(data)
  console.log('check cart of user')
  if(data.length!=0)
  {
    res.send({message:'duplicate'});
  }
  else
  {
    db.collection('taste').findOne({'_id':ObjectID(id)})
    .then(async(dish)=>{
     // console.log(dish);
      console.log('item not already present, so trying to insert it')
     //console.log(typeof(data))
    const k= await db.collection('cart').findOneAndUpdate({'userid':ObjectID(userid)},{$push:{product:dish}})
    res.send({message:'done'})
     console.log(k)
    })
   
  
  }
 /* const k=await db.collection('cart').findOne({$and:[{userid:ObjectId(userid)},{'product._id':ObjectId(id)}]})
  console.log('item query')
   console.log(k)*/
}).catch(e=>console.log(e))
/*
db.collection('taste').find({_id:ObjectId(id)}).toArray().then(async(data)=>{
  console.log(data)
const p=await db.collection('cart').update({userid:ObjectId(userid)},{$push:{product:data[0]}});
console.log(p)
res.send({message:'success'})
}).catch(e=>console.log(e))*/
})

app.get('/cartProduct/:user',(req,res)=>{
const user=req.params.user;
db.collection('cart').find({userid:ObjectId(user)}).toArray().then((data)=>{
  console.log(data)
  res.send(data[0].product)
}).catch(e=>console.log(e))
})

app.get('/cartRemove/:user/:id',async(req,res)=>{
  console.log(typeof(req.params.id))
  
 db.collection('cart').update({userid:ObjectId(req.params.user)},{$pull:{product:{_id:ObjectId(req.params.id)}}}).then((data)=>{
  console.log(data)
  res.send({message:'cart-updated'})
 }).catch(e=>console.log(e))

})

app.get('/searchFood/:search',async(req,res)=>{
  const search=req.params.search;

  await db.collection('taste').createIndex({'category':'text','dsc':'text','id':'text','name':'text'})
  db.collection('taste').find({$text:{$search:search}}).toArray().then((data)=>{
    console.log(data)
    res.send(data)
  })
  .catch(e=>console.log(e))
})
app.listen(2100,()=>{console.log('server running')})
