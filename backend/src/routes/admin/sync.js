const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const { queues } = require('../../config/queue');

const router = express.Router();

router.post('/match/:id', asyncHandler(async (req, res) => {
  const job = await queues.matchSync.add({ matchId: req.params.id, manual: true });
  res.status(202).json({ jobId: job.id });
}));

module.exports = router;
