const db = require('../database/db')

// Keeps the 1.5s artificial latency from the original app on every DB read,
// which is exactly what makes the cache worthwhile.
async function delay(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms))
}

async function getAllProducts() {
    await delay(1500)
    return db.readAll()
}

async function getProductById(id) {
    await delay(1500)
    return db.findById(id)
}

async function createProduct(productData) {
    return db.insert(productData)
}

async function updateProduct(id, changes) {
    return db.update(id, changes)
}

async function deleteProduct(id) {
    return db.remove(id)
}

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
}
