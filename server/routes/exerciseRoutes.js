const express = require('express');
const router = express.Router();
const { getExercises } = require('../controllers/exerciseController');

router.get('/', getExercises);
router.get('/library', getExercises);

module.exports = router;