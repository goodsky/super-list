const Router = require('express')

const logger = require('../utils/logger')
const groceryDb = require('../models/grocery')

const router = Router()

// GET /api/groceries
router.get('/', async (request, response) => {
    const { claims } = request
    if (!claims) {
        response.status(401).json({ error: 'user is not authenticated' })
        return
    }

    const groceries = await groceryDb.getGroceryItems()

    logger.info('Read groceries count', groceries.length)
    response.status(200).json(groceries)
})

// POST /api/groceries
router.post('/', async (request, response) => {
    const { claims } = request
    if (!claims) {
        response.status(401).json({ error: 'user is not authenticated' })
        return
    }

    if (!claims.isAdmin) {
        response.status(403).json({ error: 'user cannot add groceries' })
        return
    }

    const { name, aliases, sections, units } = request.body
    if (!name || !Array.isArray(aliases) || !Array.isArray(sections)) {
        response.status(400).json({ error: 'invalid input' })
        return
    }

    const grocery = {
        name,
        aliases,
        sections,
        units,
    }

    const addedGrocery = await groceryDb.addGroceryItem(grocery)
    response.status(200).json(addedGrocery)
})

module.exports = router
