const express = require('express')
const fs = require('fs')
const path = require('path')
const app = express()
const port = 3000
const pathToFile = path.join(__dirname, 'db.json')

const cache = {

}

async function readFile(){
    try{
        let data = await fs.promises.readFile(pathToFile, 'utf-8')
        return JSON.parse(data)
    }
    catch(err){
        console.log(err)
    }
}

async function readFileWithDelay(){
    await new Promise((resolve,reject)=>{setTimeout(resolve, 1500)})
    let products = await readFile()
    return products
}

app.get('/products', async (req, res) => {
    try{
        let key = req.url;
        let value = cache[key];
        if (value) 
            return res.json(value);
        let products = await readFileWithDelay();
        cache[key] = products;
        console.log(products)
        return res.json(products)
    }
    catch(err){
        console.log(err)
    }
})

app.get('/products/:id', async (req, res) => {
    try{
        let products = await readFileWithDelay();
        let product = products.find(p => p.id === parseInt(req.params.id))
        if(product){
            res.json(product)
        }
        else{
            res.status(404).send('Product not found')
        }
    }
    catch(err){
        console.log(err)
    }
})    
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})