//подключаемые библиотеки
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs= require('fs');
const http = require("http");
const multer  = require("multer");
const urlencodedParser = express.urlencoded({extended: false});
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require( 'bcrypt' );
const jsonParser = express.json();
// создаем соль для шифрования пароля
var salt = bcrypt.genSaltSync(10);
//замены ссылки на папку
app.use('/public', express.static('public'));
app.use('/report', express.static('report'));
app.use('/views', express.static('views'));

//подключение файла ejs
app.set('view engine', 'ejs');
const upload = multer({dest:"report"});
//указание папки и имени элемента в файле html для взятия файла
//app.use(multer({dest:"report"}).single("foto"));

//массив объектов, хранящий информацию о записях в БД
var dataRes= Array();

//основная функция, отвечающая за работу сервера
function createServer(){

//При переходе по данной ссылке прогружаются нужные страницы
  app.get("/main", function (request, response) {
      response.sendFile(__dirname + "/public/main.html");
  });
  app.get("/report", function (request, response) {
      response.sendFile(__dirname + "/public/report.html");
  });

  app.get("/message", function (request, response) {
      readMessage();
      response.render('\message', {dataRes:  dataRes});
  });
// Получение данных с форм
  app.post("/report", upload.single("foto"), function (request, response,next) {
      if(!request.body) return response.sendStatus(400);

            let login=request.body.login;
            let comment=request.body.comment;
            let foto=request.file;
            addMessage(login,comment,foto.filename);
      response.sendFile(__dirname + "/public/report.html");
        });

    app.post("/main", upload.single("file"), function (request, response,next) {
        if(!request.body) return response.sendStatus(400);
      //    console.log("подключение к базе установлено");
      let login=request.body.login;
      let password=request.body.password;
      let email=request.body.email;
      let number=request.body.number;
      let name=request.body.name;
      let file=request.file;
      addUser(login,password,email,number,name,file.filename);
      response.sendFile(__dirname + "/public/main.html");
  });
}
//добавление нового пользователя
function addUser(login,password,email,number,name,file){
  //шифрование пароля
  let SecurityPassword = bcrypt.hashSync(password, salt);
    //подключение к БД
    const db = new sqlite3.Database('base.db', sqlite3.OPEN_READWRITE, (err) =>
    {
        if(err)
            return console.error(err.message);
        console.log("подключение к базе установлено");
    } );
    //Выполнение запроса sql
    const sql=`INSERT INTO data (login,password,mail,number,name,file)
                VALUES(?,?,?,?,?,?)`;
    db.run(sql, [login,SecurityPassword,email,number,name,file], (err) =>{
        if (err)
            return console.error(err.message);
    console.log("Запрос выполнен");
    });

    db.close((err) =>{
        if(err)
        return console.error(err.message);
    });
}
//добавление данных сообщения в БД
function addMessage(login,comment,foto){

  const db = new sqlite3.Database('base.db', sqlite3.OPEN_READWRITE, (err) =>
  {
      if(err)
          return console.error(err.message);
      console.log("подключение к базе установлено");
  } );
  const sql=`INSERT INTO message (login,comment,foto)
              VALUES(?,?,?)`;
  db.run(sql, [login,comment,foto], (err) =>{
      if (err)
          return console.error(err.message);
  console.log("Запрос выполнен");
  });

  db.close((err) =>{
      if(err)
      return console.error(err.message);
  });
}
//Чтение данных сообщения из БД
function readMessage(){

  const db = new sqlite3.Database('base.db', sqlite3.OPEN_READONLY, (err) =>
  {
    if(err)
        return console.error(err.message);
    console.log("подключение к базе установлено");
  } );

  const sql=`SELECT * FROM message`;
  db.all(sql, [], (err,result) =>{
    if (err)
        return console.error(err.message);
  console.log("Запрос на прочтение данных выполнен");
//Получение всех записей из БД
  for(var i=0;i < result.length;i++)
  {
    //dataRes-глобальная переменная
    dataRes[i]=result[i];
  }

  });
  db.close((err) =>{
    if(err)
      return console.error(err.message);
  });


}
readMessage();//Считывание данных
createServer();//Основная функция, запуск всех страниц

//Запуск сервера
app.listen(3000, ()=>console.log("Сервер запущен..."));
