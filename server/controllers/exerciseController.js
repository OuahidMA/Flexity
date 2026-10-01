const Exercise = require('../modules/exercise');

const getExercises = async (_req, res, next) => {
  try {
    const exercises = await Exercise.find({}).sort({ name: 1 }).lean();
    res.json(exercises);
  } catch (error) {
    next(error);
  }
};

module.exports = { getExercises };