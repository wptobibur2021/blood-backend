const { MongoClient } = require('mongodb');
const express = require('express')
require('dotenv').config()
const app = express()
const cors = require('cors')
const bcrypt = require('bcrypt')
const multer  = require('multer')
const helmet = require("helmet");
app.use(helmet());
app.use(cors())
app.use(express.json())

// Backend Server Start Prot
const port = process.env.PORT || 8000
// ID No Find
const objectId = require('mongodb').ObjectId

// Database Info
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@blood.1bv5k.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function database (){
    try{
        await client.connect();
        const database = client.db('blood')
        const donorCollection = database.collection("donner")
        const volunteerCollection = database.collection('volunteer')
        /**
        * ======================================
        *   Post API Declaration Below
        * ======================================
        **/
        // AddDonors Volunteer or Registration
        app.post('/api/add-volunteer', async (req,res)=>{
            const salt = await bcrypt.genSalt(10);
            const hashedPass = await bcrypt.hash(req.body.password, salt)
            //console.log('Hash Password: ', hashedPass)
            const volunteerData = {
                name: req.body.name,
                password: hashedPass,
                mobile: req.body.mobile,
                address: req.body.address,
                email: req.body.email,
                role: 0,
                img: req.body.photo
            }
            const result = await volunteerCollection.insertOne(volunteerData)
            await res.status(200).json(result)
        })

        // Login Volunteer
        app.post('/api/login', async (req,res)=>{
            try {
                const user = await volunteerCollection.findOne({email: req.body.email})
                !user && await res.status(400).json('User not found')
                const validPass = await bcrypt.compare(req.body.password, user.password)
                !validPass && await res.status(400).json('Wrong Password')
                const {password, ...others} = user._doc
                //await res.json(user)
                await res.status(200).json(others)
            }catch (e) {
                res.status(500).json(e)
            }
        })

        // API Add Donors
        app.post('/api/add-donner', async (req,res)=>{
            try {
                const newData = req.body
                const result = await donorCollection.insertOne(newData)
                await res.status(200).json(result)
                console.log('New Data: ', newData)
            }catch (e) {
                console.log(e)
            }

        })

        /**
         * ================================
         *  File Upload API
         * ================================
         **/
        // Volunteer Photo Upload

        const storage = multer.diskStorage({
            destination: (req,file, cb) =>{
                cb(null, 'public/images')
            },
            filename: (req,file, cb)=>{
                cb(null, req.body.name)
            }
        })
        const photoUpload = multer({storage});
        app.post('/api/photoUpload', photoUpload.any("file"),(req,res)=>{
            try{
                return res.status(200).json("File Upload Successfully")
            }catch (e) {
                console.log(e)
            }
        })

    /**
     * =====================================
     *  GET API DECLARATION BELOW
     * =====================================
     * **/
    // GET ALL DONORS
    app.get('/api/get-donors', async (req,res)=>{
        const allDonors = await donorCollection.find({})
        const result = await allDonors.toArray()
        await res.status(200).json(result)
    })
    // QUERY WITH BLOOD GROUP
    app.get('/api/query/get-donors', async (req,res)=>{
        const group = req.query.group
        const query = {group: group}
        let result = []
        if(group !== undefined){
            result = await donorCollection.find(query).toArray()
        }else{
            result = await donorCollection.find({}).toArray()
        }
        await res.status(200).json(result)
    })
    // Volunteer Wise DONORS FIND OUT
        app.get('/api/my-donors-list/:id', async (req,res)=>{
            const id = req.params.id
            const query = {userId: id}
            console.log("Query: ", query)
            const result = await donorCollection.find(query).toArray()
            console.log("result: ", result)
            await res.status(200).json(result)

        })
    /**
     * =====================================
     *  DELETE API DECLARATION BELOW
     * =====================================
     * **/
    // Delete Donor
        app.delete('/api/delete-donor/:id', async (req,res)=>{
            const id = req.params.id
            const query = {_id: objectId(id)}
            console.log('Query: ', query)
            const result = await donorCollection.deleteOne(query)
            await res.status(200).json(result)
        })
    }finally {}
}
database().catch(console.dir);

// Root Get API
app.get('/', async (req, res)=>{
    await res.send('Backend Server ok')
})
app.listen(port, () =>{
    console.log(`'Backend Server Start at http://localhost:${port}`)
})