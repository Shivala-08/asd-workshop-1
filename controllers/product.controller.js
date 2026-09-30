const productService = require('../services/product.service')
const cache = require('../middleware/cache')

async function getProducts(req, res) {
    const products = await productService.getAllProducts()
    res.json(products)
}

async function getProductById(req, res) {
    const product = await productService.getProductById(req.params.id)
    if (!product) {
        return res.status(404).json({ message: 'Product not found' })
    }
    res.json(product)
}

async function createProduct(req, res) {
    const product = await productService.createProduct(req.body)
    cache.clearCache()
    res.status(201).json(product)
}

async function updateProduct(req, res) {
    const product = await productService.updateProduct(req.params.id, req.body)
    if (!product) {
        return res.status(404).json({ message: 'Product not found' })
    }
    cache.clearCache()
    res.json(product)
}

async function deleteProduct(req, res) {
    const deleted = await productService.deleteProduct(req.params.id)
    if (!deleted) {
        return res.status(404).json({ message: 'Product not found' })
    }
    cache.clearCache()
    res.status(204).send()
}

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
}
