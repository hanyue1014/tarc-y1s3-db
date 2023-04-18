const fs = require("fs");

let createTableFile = fs.readFileSync("./CreateTables.txt");
let creates = String(createTableFile).split("\r\n\r\n");  // windows eh \n is \r\n eh haizz

creates.forEach((create, i) => {
  fs.writeFileSync(
    `./${i.toString().padStart(2, "0")}-${
      // this substring shud retrieve the file name (table name)
      create.substring(
        create.indexOf("CREATE TABLE") + 13,
        create.indexOf(" (", create.indexOf("CREATE TABLE"))
      )
    }.txt`, create);
});
