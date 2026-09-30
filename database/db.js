const fs = require('fs')
const path = require('path')

const pathToFile = path.join(__dirname, '..', 'db.json')

async function readAll() {
    let data = await fs.promises.readFile(pathToFile, 'utf-8')
    return JSON.parse(data)
}

async function findById(id) {
    const products = await readAll()
    return products.find(p => p.id === parseInt(id, 10))
}

async function insert(product) {
    const products = await readAll()
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1
    const newProduct = { ...product, id: newId }
    products.push(newProduct)
    await writeAll(products)
    return newProduct
}

async function update(id, changes) {
    const products = await readAll()
    const index = products.findIndex(p => p.id === parseInt(id, 10))
    if (index === -1) return null

    products[index] = { ...products[index], ...changes, id: products[index].id }
    await writeAll(products)
    return products[index]
}

async function remove(id) {
    const data = await readAll()
    const filtered = data.filter(p => p.id !== parseInt(id, 10))
    if (filtered.length === data.length) return false

    await writeAll(filtered)
    return true
}

async function writeAll(products) {
    await fs.promises.writeFile(pathToFile, JSON.stringify(products, null, 2))
}

module.exports = {
    readAll,
    findById,
    insert,
    update,
    remove,
}
