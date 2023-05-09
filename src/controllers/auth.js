const bcrypt = require("bcryptjs");
const User = require("../models/user");
const jwt = require("../utils/jwt");
const axios = require("axios");

const registrer = async (req, res) => {
    const { firstname, lastname, email, password, departamento, municipio} = req.body;

    if (!email) return res.status(400).send({ msg: "El email es requerido" });
    if (!password)
    return res.status(400).send({ msg: "La contraseña es requerido" });

    const salt = bcrypt.genSaltSync(10);
    const hashPassword = bcrypt.hashSync(password, salt);

    const response = await axios.get("https://www.datos.gov.co/resource/xdk5-pm3f.json");
    const data = response.data;
    const dataDepartamento = data.find(data =>{ return data.departamento === departamento});
    console.log(dataDepartamento);
    console.log("Municipio :" +municipio);
    const dataMunicipio = data.find(data =>{return data.municipio === municipio});
    console.log(dataMunicipio);

    const user = new User({
    firstname,
    lastname,
    email: email.toLowerCase(),
    role: "user",
    active: false,
    password: hashPassword,
    departamento : dataDepartamento.departamento,
    municipio: dataMunicipio.municipio
    });

    try {
    const userStorage = await user.save();
    res.status(201).send(userStorage);
    } catch (error) {
    res.status(400).send({ msg: "Error al crear el usuario" });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
    if (!email || !password) {
        throw new Error("El email y la contraseña son requeridos");
    }
    const emailLowerCase = email.toLowerCase();
    const userStore = await User.findOne({ email: emailLowerCase }).exec()
    if (!userStore) {
        throw new Error("El usuario no existe");
    }
    const check = await bcrypt.compare(password, userStore.password)
    if (!check) {
        throw new Error("Contraseña incorrecta");
    }
    if (!userStore.active) {
        throw new Error("Usuario no autorizado o no activo");
    }
    res.status (200).send({
        access: jwt.createAccessToken (userStore),
        refresh: jwt.createRefreshToken (userStore),
    });
    } catch (error){
        res.status (400).send({ msg: error.message });
    }
}

const refreshAccessToken = (req, res) => {
  const { token } = req.body;
  if (!token) res.status(400).send({ msg: "Token requerido" });
  const { user_id } = jwt.decoded(token);
  User.findOne({ _id: user_id }, (error, userStorage) => {
    if (error) {
      res.status(500).send({ msg: "Error del servidor" });
    } else {
      res.status(200).send({
        accesToken: jwt.createAccessToken(userStorage),
      });
    }
  });
};

module.exports = {
  registrer,
  login,
  refreshAccessToken,
};
