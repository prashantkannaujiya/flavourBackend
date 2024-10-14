var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var cors = require("cors");
var MongoClient = require("mongodb").MongoClient;
var url =
  "mongodb+srv://Prashant_Kannaujiya:Rajan$9935@cluster0.aweosln.mongodb.net/?retryWrites=true&w=majority";
var jwt = require("jsonwebtoken");

const { ObjectId } = require('mongodb');
const path = require("path");
const PORT = process.env.PORT || 2100;
app.set("views", "./views");
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// app.use(express.static(path.join(__dirname, "./hello.html")));
var db;
const crypto = require("crypto");
const config = {
  RAZOR_PAY_KEY_ID: "rzp_test_8oQDdFey4L4tDC",
  RAZOR_PAY_KEY_SECRET: "Xa0L38Tgc9EtfJYAuefCD90n",
};
const Razorpay = require("razorpay");
const instance = new Razorpay({
  key_id: config.RAZOR_PAY_KEY_ID,
  key_secret: config.RAZOR_PAY_KEY_SECRET,
});
const category = [];
(() => {
  fetch("https://www.themealdb.com/api/json/v1/1/list.php?c=list")
    .then((res) => res.json())
    .then((data) => {
      data.meals.forEach((a) => {
        category.push(a.strCategory);
      });
    });
})();

const client = new MongoClient(url);
db = client.db("flavour");
var d = [];
const seedDB = async () => {
  var i = 0;

  await db.collection("taste").deleteMany({});
  let y = [];
  for (i = 0; i < category.length; i++) {
    d.push(
      fetch(
        "https://www.themealdb.com/api/json/v1/1/filter.php?c=" + category[i]
      ).then((res) => res.json())
    );
  }
  Promise.all(d).then(async (data) => {
    for (var i = 0; i < category.length; i++) {
      for (var j = 0; j < data[i].meals.length; j++) {
        data[i].meals[j].category = category[i];
        data[i].meals[j].price = Math.floor(Math.random() * 200);
      }
      y.push(data[i].meals);
    }
    // console.log(y)
    const p = y.flat(1); //merge all nested arrays into a single array

    await db.collection("taste").insertMany(p);
  });
};
(async () => {
  // const p = await seedDB();
  //const w=
  //console.log(w)
})();

app.get('/',(req,res)=>{
  // res.send('<h1>Hi!! , server is on</h1>')
  res.sendFile(__dirname+'/home.html')
})
app.get("/fetch/:cat/:price", async (req, res) => {
  const category = req.params.cat;
  console.log(typeof category);
  const price = req.params.price;
  console.log(price);
  if (price != "-1") {
    if (price == 0) {
      db.collection("taste")
        .find({
          $and: [{ price: { $gte: 0, $lte: 50 } }, { category: category }],
        })
        .toArray()
        .then((data) => {
          res.send(data);
        })
        .catch((e) => console.log(e));
    } else if (price == 50) {
      db.collection("taste")
        .find({
          $and: [{ price: { $gte: 50, $lte: 100 } }, { category: category }],
        })
        .toArray()
        .then((data) => {
          res.send(data);
        })
        .catch((e) => console.log(e));
    } else {
      db.collection("taste")
        .find({ $and: [{ price: { $gte: 100 } }, { category: category }] })
        .toArray()
        .then((data) => {
          res.send(data);
        })
        .catch((e) => console.log(e));
    }
  } else {
    db.collection("taste")
      .find({ category: category })
      .toArray()
      .then((data) => {
        res.send(data);
      })
      .catch((e) => console.log(e));
  }
  //const p=await seedDB();
  //console.log(p)
  //res.send(p)
});

app.post("/register", (req, res) => {
  db.collection("user")
    .find({ username: req.body.username })
    .toArray()
    .then((data) => {
      console.log(data);
      if (data.length != 0) {
        res.send({ message: "already registered" });
      } else {
        db.collection("user")
          .insertOne(req.body)
          .then(async (data) => {
            console.log(data);
            const y = await db
              .collection("cart")
              .insertOne({ userid: data.insertedId });
            console.log(y);
            res.send({ message: "registered" });
          })
          .catch((e) => console.log(e));
      }
    })
    .catch((e) => console.log(e));
});

app.post("/login", (req, res) => {
  console.log(req.body);
  db.collection("user")
    .find({ username: req.body.username })
    .toArray()
    .then(async (data) => {
      console.log(data);
      if (data.length == 0) {
        res.send({ message: "kindly register" });
      } else {
        if (data[0].password == req.body.password) {
          let p = JSON.stringify(data[0]);
          p = JSON.parse(p);
          const token = jwt.sign(p._id, "Vishnu");
          res.send({ message: "success", user: data[0], token });
        } else {
          res.send({ message: "Invalid credentials" });
        }
      }
    });
});

app.get("/auth/:token", (req, res) => {
  var tken = req.params.token;
  console.log(tken);
  try {
    var ds = jwt.verify(req.params.token, "Vishnu");
    res.send({ message: "approved", data: ds });
  } catch (err) {
    console.log(err);
    res.send({ message: "failed" });
  }
});
app.get("/addToCart/:product/:user/", async (req, res) => {
  console.log(typeof req.params.product);
  const id =new ObjectId(req.params.product);
  const userid = req.params.user;
const quantity=req.params.quantity;
  console.log(typeof id);
  console.log(userid);



  db.collection("cart")
    .find({
      $and: [
        { userid: new ObjectId(userid) },
        { 'product._id': id },
      ],
    })
    .toArray()
    .then(async (data) => {
      console.log(data)
      console.log("check cart of user");
      if (data.length != 0) {
        res.send({ message: "duplicate" });
      } else {
        db.collection("taste")
          .findOne({ _id: new ObjectId(id) })
          .then(async (dish) => {
            console.log(dish);
dish.quantity=1;
            console.log("item not already present, so trying to insert it");
            //console.log(typeof(data))
            const k = await db
              .collection("cart")
              .findOneAndUpdate(
                { userid: new ObjectId(userid) },
                { $push: { product: dish } }
              );
            res.send({ message: "done" });
            console.log(k);
          });
      }
      /* const k=await db.collection('cart').findOne({$and:[{userid:ObjectId(userid)},{'product._id':ObjectId(id)}]})
  console.log('item query')
   console.log(k)*/
    })
    .catch((e) => console.log(e));
  /*
db.collection('taste').find({_id:ObjectId(id)}).toArray().then(async(data)=>{
  console.log(data)
const p=await db.collection('cart').update({userid:ObjectId(userid)},{$push:{product:data[0]}});
console.log(p)
res.send({message:'success'})
}).catch(e=>console.log(e))*/
});

app.get('/cartupdate/:productid/:userid/:quantity',(req,res)=>{
  const product = new ObjectId(req.params.productid);
  const user = req.params.userid;
  const quantity = parseInt(req.params.quantity)
  console.log(product)
  console.log(typeof(user))
  console.log(quantity)
  db.collection("cart").updateMany(
    { 
      $and: [
        { userid: new ObjectId(user) },
        { 'product._id': product }
      ]
    },
    { 
      $set: { 'product.$.quantity': quantity }
    }
  )
  .then(data => {
    res.send(data);
    console.log(data);
  })
  .catch(err => {
    console.error("Error updating documents:", err);
    res.status(500).send("Error updating documents");
  });
  
  // db.collection("cart").updateMany({
  //   userid:new ObjectId(userid) ,
  //   "product._id":new ObjectId(id) 
  // },{$set:{"product.$.quantity":quantity}}).then((data)=>{
  //   res.send(data)

  // }).catch(e=>{console.log(e)})
})

app.get("/allcart", (req, res) => {
  db.collection("cart")
    .aggregate([
      { $unwind: "$product" },
      {
        $project: {
          _id: 1,
          userid: 1,
          productid: "$product._id",
          producttag: "$product.id",
          productname: "$product.name",
          price: "$product.price",
        },
      },
    ])
    .toArray()
    .then((data) => {
      res.send(data);
    })
    .catch((e) => {
      console.log(e);
    });
});
app.get("/cartProduct/:user", (req, res) => {
  const user = req.params.user;
  db.collection("cart")
    .find({ userid: new ObjectId(user) })
    .toArray()
    .then((data) => {
      console.log(data);
      if (data[0].hasOwnProperty("product")) {
        res.send(data[0].product);
      } else {
        res.send([]);
      }
    })
    .catch((e) => console.log(e));
});

app.get("/cartRemove/:user/:id", async (req, res) => {
  db.collection("cart")
    .findOneAndUpdate(
      { userid: new ObjectId(req.params.user) },
      { $pull: { product: { _id: new ObjectId(req.params.id) } } }
    )
    .then((data) => {
      console.log(data);
      res.send({ message: "cart-updated" });
    })
    .catch((e) => console.log(e));
});

app.get("/searchFood/:search", async (req, res) => {
  const search = req.params.search;

  await db
    .collection("taste")
    .createIndex({ category: "text", strMeal: "text" });
  db.collection("taste")
    .find({ $text: { $search: search } })
    .toArray()
    .then((data) => {
      console.log(data);
      res.send(data);
    })
    .catch((e) => console.log(e));
});

app.post("/success", (req, res) => {
  console.log("req recieved in order");
  try {
    // getting the details back from our font-end
    const {
      orderCreationId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = req.body;
    console.log(req.body);
    if(Object.keys(req.body).length==0){res.send('Payment failed')}
    else{ // Creating our own digest
      // The format should be like this:
      // digest = hmac_sha256(orderCreationId + "|" + razorpayPaymentId, secret);
      const shasum = crypto.createHmac("sha256", config.RAZOR_PAY_KEY_SECRET);
  
      shasum.update(`${orderCreationId}|${razorpayPaymentId}`);
  
      const digest = shasum.digest("hex");
  
      // comaparing our digest with the actual signature
      if (digest !== razorpaySignature)
        return res.status(400).json({ msg: "Transaction not legit!" });
  
      // THE PAYMENT IS LEGIT & VERIFIED
      // YOU CAN SAVE THE DETAILS IN YOUR DATABASE IF YOU WANT
  
      res.json({
        msg: "success",
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
      });}
   
  } catch (error) {
    res.status(500).send(error);
  }
});

//   console.log("request recieved to capture");

//   const formdata = new FormData();
//   formdata.append("amount", "10");
//   formdata.append("currency", "INR");
//   console.log(formdata)
//   const requestOptions = {
//     method: "POST",
//     body: formdata,
//     redirect: "follow"
//   };
//   let url='https://'+config.RAZOR_PAY_KEY_ID+':'+config.RAZOR_PAY_KEY_SECRET+'@api.razorpay.com/v1/payments/'+req.params.paymentId+'/capture'
//   console.log(url)
//   fetch(url,
//     requestOptions
//     )
//     .then(res=>res.json())
//     .then(data=>{
//       console.log(data)
//     })
//     .catch(e=>{
//       console.log(e)
//     })

//   // console.log("Status:", response.statusCode);
//   // console.log("Headers:", JSON.stringify(response.headers));
//   // console.log("Response:", body);
//   // return res.status(200).json(body);
// });

// const fetch = require('node-fetch'); // Ensure you have node-fetch installed

app.get("/order", async (req, res) => {
  // do a validation

  try {
    const options = {
      amount: 50000, // amount in smallest currency unit
      currency: "INR",
      receipt: "receipt_order_74394",
    };

    const order = await instance.orders.create(options);

    if (!order) return res.status(500).send("Some error occured");

    res.json(order);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(PORT, () => {
  console.log("server running");
});
module.exports = app