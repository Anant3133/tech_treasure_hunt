const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findTeamByName, createTeam } = require('../services/firestore.service');
const { TeamModel } = require('../models/Team.model');

const registerValidations = [
  body('teamName').notEmpty().withMessage('teamName is required'),
  body('password').isLength({ min: 6 }).withMessage('password min length 6'),
  body('role').optional().isIn(['participant', 'admin']).withMessage('invalid role'),
  body('adminInviteKey').optional().isString(),
];

async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { teamName, password, role: requestedRole, adminInviteKey } = req.body;
  const existing = await findTeamByName(teamName);
  if (existing) {
    return res.status(409).json({ message: 'Team name already taken' });
  }
  const hashed = await bcrypt.hash(password, 10);
  let role = 'participant';
  if (requestedRole === 'admin') {
    if (!process.env.ADMIN_INVITE_KEY || adminInviteKey !== process.env.ADMIN_INVITE_KEY) {
      return res.status(403).json({ message: 'Invalid admin invite key' });
    }
    role = 'admin';
  }

  const team = new TeamModel({
    teamName,
    password: hashed,
    currentQuestion: 1,
    lastCorrectAnswerTimestamp: null,
    finishTime: null,
    role,
  });
  const created = await createTeam(team);
  const token = jwt.sign({ teamId: created.id, teamName: created.teamName, role: created.role || role }, process.env.JWT_SECRET, {
    expiresIn: '12h',
  });
  return res.status(201).json({ token });
}

const loginValidations = [
  body('teamName').notEmpty(),
  body('password').notEmpty(),
];

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { teamName, password } = req.body;
  const team = await findTeamByName(teamName);
  if (!team) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const match = await bcrypt.compare(password, team.password);
  if (!match) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ teamId: team.id, teamName: team.teamName, role: team.role || 'participant' }, process.env.JWT_SECRET, {
    expiresIn: '12h',
  });
  return res.json({ token });
}

module.exports = { register, registerValidations, login, loginValidations };


