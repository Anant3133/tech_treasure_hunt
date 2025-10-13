// DTO shapes as reference (runtime validation will be done via express-validator)

class RegisterTeamDto {
  constructor({ teamName, password }) {
    this.teamName = teamName;
    this.password = password;
  }
}

class LoginTeamDto {
  constructor({ teamName, password }) {
    this.teamName = teamName;
    this.password = password;
  }
}

module.exports = { RegisterTeamDto, LoginTeamDto };


