const { faker } = require("@faker-js/faker");
// after gen directly write to file d
const fs = require("fs");

// make life easier
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const digitFormat = (num, pad) => num.toString().padStart(pad, "0");
const twoDigitFormat = (num) => digitFormat(num, 2);
const dateFormat = (date) => `TO_DATE('${date.getFullYear()}-${twoDigitFormat(date.getMonth() + 1)}-${twoDigitFormat(date.getDate())}', 'YYYY-MM-DD')`;
const timeFormat = (dateTime) => {
  // console.log(dateTime)
  return `TO_TIMESTAMP('${dateTime.getFullYear()}-${twoDigitFormat(dateTime.getMonth() + 1)}-${twoDigitFormat(dateTime.getDate())} ${twoDigitFormat(dateTime.getHours())}:${twoDigitFormat(dateTime.getMinutes())}:${twoDigitFormat(dateTime.getSeconds())}', 'YY-MM-DD HH24:MI:SS')`
};
const dateToIDFormat = (date) => `${twoDigitFormat(date.getFullYear().toString().substring(2, 4))}${twoDigitFormat(date.getMonth() + 1)}${twoDigitFormat(date.getDate())}`;
const daysBetweenDates = (date1, date2) => Math.ceil((date2.getTime() - date1.getTime()) / 1000 / 60 / 60 / 24);
// generates insert statements
const inserter = (tableName, obj) => {
  let insert = `INSERT INTO ${tableName}(`;
  const keys = Object.keys(obj);
  // comma as separator, ) VALUES () as last element to close
  keys.forEach((k, i) => insert += `${k}${i !== keys.length - 1 ? ',' : ') VALUES ('}`);
  // comma as separator, ); as last element to close
  // if value is 'NULL', nonid '' directly NULL to insert NULL data, all other values shud have '' except number
  // very nested and ugly ifkr, but time is a factor for this, i don't need to maintain this code
  // yes oracle uses double single quote to fking escape a single quote
  keys.forEach((k, i) =>
    insert += `${obj[k] === 'NULL' ?
      'NULL' :
      `${typeof obj[k] === 'number' ? obj[k] : obj[k].startsWith("TO_") ? obj[k] : `'${obj[k].replace("'", "''")}'`}`
    }${i !== keys.length - 1 ? ',' : ');\n'}`);

  return insert;
}
// sequential date generator for most IDs
const useIDGen = ({ incrementRate, yearStart } = {}) => {
  // more controllable incrementing
  // change percentage to decrease increment rate
  let shudIncrement = () => Math.random() > (incrementRate || 0.8);

  const dateData = {
    year: 20 + (yearStart || 0),
    month: 01,
    day: 01,
    row: 01,

    // counts
    dayIncremented: 0,
  }
  const newID = () => {
    let generated = `${dateData.year}${twoDigitFormat(dateData.month)}${twoDigitFormat(dateData.day)}${digitFormat(dateData.row++, 4)}`;
    if (shudIncrement()) {
      dateData.row = 1;  // new date d, reset ID
      if (dateData.dayIncremented >= 10) {
        dateData.dayIncremented = 0;
        dateData.day = 1;
        dateData.month++;
        if (dateData.month > 12) {
          dateData.year++;
          dateData.month = 1;
        }
      } else {
        dateData.dayIncremented++
        // generate a number between 1 and 3, increment date by that number
        dateData.day += random(1, 3);
        // max 31
        if ([1, 3, 5, 7, 8, 10, 12].includes(dateData.month)) {
          if (dateData.day >= 31) {
            dateData.day = 31;
            dateData.dayIncremented = 10;  // set 4, next time increment will directly increment month
          }
          if (dateData.month === 10) {
            shudIncrement = () => Math.random() > 0.95; // if month is 10 means next month is 11, shud have more customer per day
          }
        } else if (dateData.month === 2) {
          if (dateData.day >= 28) {
            dateData.day = 28;
            dateData.dayIncremented = 10;
          }
        } else if (dateData.day >= 30) {
          dateData.day = 30;
          dateData.dayIncremented = 10;
          if (dateData.month === 11) {
            // if month is 11 d means next month is 12, shud have more more more customer per day
            shudIncrement = () => Math.random() > 0.99;
          }
        }
      }
    }

    return generated;
  }

  return newID;
}
// used to generate random date greater than a specified date
// result will be a date greater than the date passed in by at least min but at most max days
const randomDateGreater = (date, { min, max } = {}) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + random(min || 0, max || 4))
  return newDate;
}
// used to generate random date greater than a date in ID
// assumes id has the format of YYMMDDXXXX (YY = year, MM = month, DD = day, XXXX = id)
const randomDateGreaterThanID = (id, {max} = {}) => {
  // parse the ID
  const year = id.substring(0, 2);
  const month = id.substring(2, 4);
  const day = id.substring(4, 6);

  const newDate = randomDateGreater(`${month}/${day}/${year}`, { max: max !== undefined ? max : 4 });
  return newDate;
}
// generates a date greater date given by 1 to 14 hours
const randomDateGreaterHour = (date) => {
  // console.log(date);
  const newDate = new Date(date);

  newDate.setHours(newDate.getHours() + random(1, 14));
  return newDate;
}

// customer
// array to store generated customers, may need to use it in other tables
const customers = [];
const newCustID = useIDGen();

// util function help generate IC
const randomDateCode = () => {
  const today = new Date();

  const start = new Date();
  start.setFullYear(start.getFullYear() - 99);
  const generated = new Date(
    start.getTime() + Math.random() * (today.getTime() - start.getTime())
  );

  let code = "";
  code += generated.getFullYear().toString().substring(2);
  code += twoDigitFormat(generated.getMonth() + 1);
  code += twoDigitFormat(generated.getDate());
  return code;
}

const randomBirthplace = () => {
  const validCodes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  const idx = random(1, validCodes.length - 1);
  return twoDigitFormat(validCodes[idx]);
}

const randomSpecialNumber = () => {
  let code = '';
  for (let i = 0; i < 4; i += 1) {
    code += random(0, 9);
  }

  return code;
}

const newIC = () => {
  return `${randomDateCode()}${randomBirthplace()}${randomSpecialNumber()}`;
}

const passportGenerator = () => {
  const upperAlpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowerAlpha = "abcdefghijklmnopqrstuvwxyz";

  // only plan generate for 3 countries (1 - SG, 2 - UK, 3 - China)
  const country = random(1, 3);
  let passport = '';
  switch (country) {
    case 1:
      // SG Passport Regex: [A-Za-z][0-9]{7}[A-Za-z]
      passport += Math.random() > 0.5 ? upperAlpha[random(0, upperAlpha.length - 1)] : lowerAlpha[random(0, lowerAlpha.length - 1)];
      for (let i = 0; i < 7; i++) {
        passport += random(0, 9);
      }
      passport += Math.random() > 0.5 ? upperAlpha[random(0, upperAlpha.length - 1)] : lowerAlpha[random(0, lowerAlpha.length - 1)];
      break;
    case 2:
      // China Passport Regex: [A-Z][0-9]{8,9}
      passport += upperAlpha[random(0, upperAlpha.length - 1)]
      for (let i = 0; i < 8 + (Math.random() > 0.5 ? 1 : 0); i++) {
        passport += random(0, 9);
      }
      break;
    case 3:
      // UK Passport Regex: \d{9}
      for (let i = 0; i < 9; i++) {
        passport += random(0, 9);
      }
      break;
  }

  return passport;
}

// generate customers
const cs = ['Wong', 'Wang', 'Ong', 'Bong', 'Teng', 'Li', 'Lee', 'Lie', 'Chen', 'Chan', 'Chun', 'Chin', 'Tan', 'Huang', 'Ooi', 'Ng', 'Zhang', 'Cheung', 'Chang', 'Teo', 'Teoh', 'Chong'];
console.log("Generating Customers...");
for (let u = 0; u < 3; u++) {
  const newCustID = useIDGen({incrementRate: 0.725, yearStart: u})
  for (let i = 0; i < 100; i++) {
    // chinese surnames
    const isForeigner = Math.random() > 0.5;
    const isMarried = Math.random() > 0.4;
    const firstName = faker.name.firstName();
    const lastName = !isForeigner ? cs[random(0, cs.length - 1)] : faker.name.lastName();
    const customer = {
      CustID: newCustID(),
      CustIdenNo: isForeigner ? passportGenerator() : newIC(),
      CustName: `${firstName} ${lastName}`,
      CustAge: random(18, 75),
      CustPhone: faker.phone.number('01########'),
      CustEmail: faker.internet.email(firstName, lastName),
      CustType: isForeigner ? 'FOREIGNER' : 'MALAYSIAN',
      MaritalStatus: isMarried ? 'MARRIED' : 'SINGLE',
    };
    customers.push(customer);
    // HACK: COMMENT ME
    fs.writeFileSync(
      "./insertSqls/00-InsertCustomer.txt",
      inserter("Customer", customer),
      { flag: 'a' }
    );
  }
}

// Facility (this jiu nonid generator le ba, just list the facility id here, in case other generator need use)
const facilities = [
  {
    "FacilityID": "HAL1",
    "price": 8888.88,
  },
  {
    "FacilityID": "HAL2",
    "price": 4599.00,
  },
  {
    "FacilityID": "HAL3",
    "price": 2399.00,
  },
  {
    "FacilityID": "MTR1",
    "price": 280.00,
  },
  {
    "FacilityID": "MTR2",
    "price": 280.00,
  },
  {
    "FacilityID": "MTR3",
    "price": 280.00,
  },
  {
    "FacilityID": "BAC1",
    "price": 400.00,
  },
  {
    "FacilityID": "RES1",
    "price": 500.00,
  },
  {
    "FacilityID": "SPA1",
    "price": 700.00,
  },
  {
    "FacilityID": "GYM1",
    "price": 680.00,
  }
]

// FacilityReserved
// store generated for future reference
const facilityReserved = [];
console.log("Generating Facility Reserved...");
for (let u = 0; u < 3; u++) {
  const newFacilityReservedID = useIDGen({
    yearStart: u,
    incrementRate: 0.825,
  });
  for (let i = 0; i < 1000; i++) {
    const FacilityReservedID = newFacilityReservedID();
    const ReservedStartDate = randomDateGreaterThanID(FacilityReservedID);
    const ReservedEndDate = randomDateGreater(ReservedStartDate, { min: 2, max: 7 });
    const facility = {
      FacilityReservedID,
      CustID: customers[random(0, customers.length - 1)].CustID,
      ReservedStartDate: dateFormat(ReservedStartDate),
      ReservedEndDate: dateFormat(ReservedEndDate),
    };

    facilityReserved.push(facility);
    // HACK: COMMENT ME
    fs.writeFileSync(
      "./insertSqls/02-InsertFacilityReserved.txt",
      inserter("FacilityReserved", facility),
      { flag: 'a' }
    );
  }
}

// FacilityReservedList
// based on concept it seems like all facility reserved id shud be included
// so for every facility reserved id, generate a random facility id with it
// technically just assign all facility id to all facility reserved id for now cuz only have 10 facility and 100 facility reserved, and we need 1k for associative
console.log("Generating Facility Reserved List...");
const facilityReservedList = [];

facilityReserved.forEach(fr => {
  let facilityReservedItem = {
    FacilityReservedID: fr.FacilityReservedID,
    FacilityID: "",
  }
  let previousFacilityIdx = [random(0, facilities.length - 1)];
  // one ppl maximum reserve 4 facility in one reservation
  for (let j = 0; j < random(1, 4); j++) {
    let newIdx = random(0, facilities.length - 1);
    while (previousFacilityIdx.includes(newIdx))
      newIdx = random(0, facilities.length - 1);
    
    previousFacilityIdx.push(newIdx);
    let facilityReservedItemClone = {
      ...facilityReservedItem,
      FacilityID: facilities[newIdx].FacilityID,
    };
    facilityReservedList.push(facilityReservedItemClone);
    // HACK: COMMENT ME
    fs.writeFileSync(
      "./insertSqls/03-InsertFacilityReservedList.txt",
      inserter("FacilityReservedList", facilityReservedItemClone),
      { flag: 'a' }
    );
  }
})

// Reservation
console.log("Generating Reservations...");
const possibleNotes = ["I would like to request a quiet room away from any noise from the street.", "Could I have a room with a bathtub instead of just a shower?", "I have a preference for firm pillows, please provide them in the room.", "I am allergic to feathers, please ensure there are no feather pillows or blankets in the room.", "I am traveling with a group and would like our rooms to be located close together.", "I would like a room with a balcony or terrace.", "I require a refrigerator in the room to store medication.", "Could you please arrange for a taxi to pick me up from the airport?", "I am a light sleeper, please provide earplugs in the room.", "I am celebrating my wedding anniversary, could you provide a bottle of champagne in the room?", "I would like to request an extra blanket for the bed.", "Could you please provide an iron and ironing board in the room?", "I would like to request a room with a sofa or comfortable seating area.", "I am traveling with a baby, could you provide a crib in the room?", "I have a preference for a room with lots of natural light.", "I am allergic to scented products, please ensure that no scented cleaning products are used in the room.", "I would like to request a room with a mini-fridge to store snacks and drinks.", "Could you provide an extra set of towels in the room?", "I am a frequent traveler and would appreciate an upgrade to a higher room category if available.", "I am attending a conference and require a late-night room service option."]
// save reservation data for later use
const reservations = [];
for (let u = 0; u < 3; u++) {
  const newReservationID = useIDGen({
    yearStart: u,
    incrementRate: 0.825,
  });
  for (let i = 0; i < 1000; i++) {
    const ReservationID = newReservationID();
    const StartDate = randomDateGreaterThanID(ReservationID);
    const EndDate = randomDateGreater(StartDate, { min: 1 });
    const shouldHaveNotes = Math.random() > 0.7;
    let reservation = {
      ReservationID,
      CustID: customers[random(0, customers.length - 1)].CustID,
      StartDate: dateFormat(StartDate),
      EndDate: dateFormat(EndDate),
      Notes: shouldHaveNotes ? possibleNotes[random(0, possibleNotes.length - 1)] : "NULL",
    };
    reservations.push(reservation);
    // HACK: COMMENT ME
    fs.writeFileSync(
      "./insertSqls/04-InsertReservation.txt",
      inserter("Reservation", reservation),
      { flag: 'a' }
    );
  }
}

// RoomType
// kaki write the insert then ka come back add the RoomType to the list
const roomTypes = [
  {
    "SIN": 120.00
  },
  {
    "DOU": 239.00
  },
  {
    "TRI": 350.00
  },
  {
    "FAM": 400
  },
  {
    "STU": 600
  },
  {
    "SUI": 800
  },
  {
    "PRE": 5500
  },
  {
    "CON": 750
  },
  {
    "ACC": 300
  },
  {
    "VIL": 1000
  }
]

// Room
console.log("Generating Rooms...");
const rooms = [];
// help reduce lines of code, generates room, push it, writes to file
const generateRoom = (floor, num, type) => {
  let room = {
    // RoomID format (FFXX) FF: Floor number, XX: Room number
    RoomNum: `${twoDigitFormat(floor)}${twoDigitFormat(num)}`,
    RoomType: type,
  };
  rooms.push(room);
  // HACK: COMMENT ME
  fs.writeFileSync(
    "./insertSqls/06-InsertRoom.txt",
    inserter("Room", room),
    { flag: 'a' }
  );
}
// floor 0     VILLA (Not in building) (5 rooms)
for (let i = 1; i <= 5; i++) {
  generateRoom(0, i, "VIL");
}
// floor 1     ACCESSIBLE (30 room per floor)
for (let i = 1; i <= 30; i++) {
  generateRoom(1, i, "ACC");
}
// floor 2 - 4 SINGLE (40 room per floor)
for (let i = 2; i <= 4; i++) {
  for (let j = 1; j <= 40; j++) {
    generateRoom(i, j, "SIN");
  }
}
// floor 5 - 7 DOUBLE (20 room per floor)
for (let i = 5; i <= 7; i++) {
  for (let j = 1; j <= 20; j++) {
    generateRoom(i, j, "DOU");
  }
}
// floor 8     TRIPLE (16 room)
for (let i = 1; i <= 16; i++) {
  generateRoom(8, i, "TRI");
}
// floor 9 - 10 FAMILY (10 room per floor)
for (let i = 9; i <= 10; i++) {
  for (let j = 1; j <= 10; j++) {
    generateRoom(i, j, "FAM");
  }
}
// floor 11    STUDIO (8 room per floor)
for (let i = 1; i <= 8; i++) {
  generateRoom(11, i, "STU");
}
// floor 12    SUITE  (5 room per floor)
for (let i = 1; i <= 5; i++) {
  generateRoom(12, i, "SUI");
}
// floor 13    PRESIDENT (whole floor)
generateRoom(13, 1, "PRE");
// floor 14    CONNECTED (5 room per floor (each room = 2 family room connected))
for (let i = 1; i <= 5; i++) {
  generateRoom(14, i, "CON");
}

// RoomPackage
// for now only 4 packages
const roomPackages = [
  {
    PackageID: "A",
    PackageDesc: "Just an ordinary room, without that added goodies",
    PackagePrice: 1
  },
  {
    PackageID: "B",
    PackageDesc: "A package that allows you to enjoy the delicious breakfast with only 10% add on",
    PackagePrice: 1.1,
  },
  {
    PackageID: "C",
    PackageDesc: "A package with all the goodies of Package B (breakfast) with an additional lunch by adding on 15%",
    PackagePrice: 1.15,
  },
  {
    PackageID: "D",
    PackageDesc: "A package with the most complete goodies, including breakfast, lunch and dinner, by just adding on 20%",
    PackagePrice: 1.20,
  },
  {
    PackageID: "E",
    PackageDesc: "A package that allows you to enjoy your travel! Free transportation service provided by the hotel (vehicle is different based on room type) for an add on of 25%",
    PackagePrice: 1.25,
  },
  {
    PackageID: "F",
    PackageDesc: "A package that gives you an additional discount when you visit the local attractions! Just add on a 20% to enjoy up to 50% discount on entry ticket prices!",
    PackagePrice: 1.20,
  },
  {
    PackageID: "G",
    PackageDesc: "A package that gives you an additional bed and necessities allowing you to accomodate one more person in your room, with an add on of 10% only.",
    PackagePrice: 1.10,
  }, 
  {
    PackageID: "H",
    PackageDesc: "A package that works best especially when you want to celebrate! Add on a 20% to have the room decorated with celebration atmospheres!",
    PackagePrice: 1.20,
  },
  {
    PackageID: "I",
    PackageDesc: "A package that includes us hiring a professional local guide for you! Just add on 15%.",
    PackagePrice: 1.15,
  },
  {
    PackageID: "J",
    PackageDesc: "A package that makes you feel like a king! Enjoy private tours and get VIP treatments such as a personal concierge or luxury car service, all by adding on 40%",
    PackagePrice: 1.40,
  }
];
// ReservedRoom
console.log("Generating Reserved Room...");
const reservedRooms = [];
reservations.forEach(r => {
  let reservedRoom = {
    ReservationID: r.ReservationID,
    RoomNum: "",
    PackageID: "A",
  };
  let lastIdxRoom = [random(0, rooms.length - 1)];
  for (let i = 0; i < random(1, 5); i++) {
    const shouldGtPackage = Math.random() > 0.5;

    // generate new idx if the room has repeated
    let newIdx = random(0, rooms.length - 1);
    while (lastIdxRoom.includes(newIdx)) {
      newIdx = random(0, rooms.length - 1);
    }
    // update for next iteration
    lastIdxRoom.push(newIdx);
    let reservedRoomClone = {
      ...reservedRoom,
      RoomNum: rooms[newIdx].RoomNum,
      PackageID: shouldGtPackage ? roomPackages[random(1, roomPackages.length - 1)].PackageID : "A",
    };

    reservedRooms.push(reservedRoomClone);
    // HACK: COMMENT ME
    fs.writeFileSync(
      "./insertSqls/08-InsertReservedRoom.txt",
      inserter("ReservedRoom", reservedRoomClone),
      { flag: 'a' }
    );
  }
});

// Promo
const promoCodes = [
  {
    "YTDISC": 0.1
  },
  {
    "FBDISC": 0.2
  },
  {
    "TTDISC": 0.1
  },
  {
    "IGDISC": 0.2
  },
  {
    "WSDISC": 0.25
  },
  {
    "BNDISC": 0.1
  },
  {
    "TG1234": 0.2
  },
  {
    "TG4231": 0.3
  },
  {
    "TG5678": 0.3
  },
  {
    "TG8765": 0.35
  }
]

// Payment
console.log("Generating Payments...");
const payments = [];
const paymentTypes = ["E-WALLET", "CASH", "CARD"]
let currPaymentID = 0;
let lastFacPaymentDate = null;
// every facility reservation
facilityReserved.forEach(fr => {
  // get only the same facility reserved id (can get price)
  let faci = facilityReservedList.filter(frl => fr.FacilityReservedID === frl.FacilityReservedID);
  const shouldPromo = Math.random() > 0.5;
  const totalDays = daysBetweenDates(
    new Date(
      fr.ReservedStartDate
        .replace(/[()]/g, "")
        .replace("TO_DATE", "")
        .replace(", 'YYYY-MM-DD'", "")
    ),
    new Date(
      fr.ReservedEndDate
        .replace(/[()]/g, "")
        .replace("TO_DATE", "")
        .replace(", 'YYYY-MM-DD'", "")
    ),
  );
  const randomPromoIdx = random(0, promoCodes.length - 1);
  // very confirm every only got one key
  let randomPromo = Object.keys(promoCodes[randomPromoIdx])[0];
  // console.log(faci)
  let Amount = faci.reduce((acc, cur) => {
    acc += facilities.find(f => f.FacilityID === cur.FacilityID).price * totalDays;
    return acc;
  }, 0);
  Amount = Amount * (shouldPromo ? 1 - promoCodes[randomPromoIdx][randomPromo] : 1);
  // console.log(totalPrice);
  let paymentDate = randomDateGreaterThanID(fr.FacilityReservedID, {max: 1});
  if (lastFacPaymentDate && lastFacPaymentDate < paymentDate) {
    currPaymentID = 1;  // will be at least second iter until this will be ran
    lastFacPaymentDate = paymentDate;
  } else {
    currPaymentID++;
    // init lastFacPaymentDate if not yet init
    if (!lastFacPaymentDate) {
      lastFacPaymentDate = paymentDate;
    }
    paymentDate = lastFacPaymentDate;
  }
  let payment = {
    PaymentID: `${dateToIDFormat(paymentDate)}${digitFormat(currPaymentID, 4)}`,
    PromoCode: shouldPromo ? randomPromo : "NULL",
    ReservationID: "NULL",
    FacilityReservedID: fr.FacilityReservedID,
    PaymentType: Amount > 7000 ? "CARD" : paymentTypes[random(0, paymentTypes.length - 1)],
    Amount,
  }
  payments.push(payment);
  // HACK: UNCOMMENT ME
  fs.writeFileSync(
    "./insertSqls/10-InsertPayment.txt",
    inserter("Payment", payment),
    { flag: 'a' }
  );
});
// console.log(payments)

// reset for room
currPaymentID = 1;
let lastResPaymentDate = null;
reservations.forEach(r => {
  const totalDays = daysBetweenDates(
    new Date(
      r.StartDate
        .replace(/[()]/g, "")
        .replace("TO_DATE", "")
        .replace(", 'YYYY-MM-DD'", "")
    ),
    new Date(
      r.EndDate
        .replace(/[()]/g, "")
        .replace("TO_DATE", "")
        .replace(", 'YYYY-MM-DD'", "")
    ),
  );
  // get only the same facility reserved id (can get price)
  let rid = reservedRooms.filter(rr => r.ReservationID === rr.ReservationID);
  // console.log(faci)
  let Amount = rid.reduce((acc, cur) => {
    let rt = rooms.find(ro => {
      // console.log(cur, ro);
      return cur.RoomNum === ro.RoomNum;
    }).RoomType;
    // console.log(rt)
    let rto = roomTypes.find(rtt => Object.keys(rtt)[0] === rt);

    // console.log(rto)
    // price of room of that room type
    // package increase
    let ppIncrease = roomPackages.find(rp => rp.PackageID === cur.PackageID).PackagePrice
    acc += rto[rt] * ppIncrease * totalDays;

    return acc;
  }, 0);
  const shouldPromo = Math.random() > 0.5;

  let randomPromoIdx = random(0, promoCodes.length - 1);
  // very confirm every only got one key
  let randomPromo = Object.keys(promoCodes[randomPromoIdx])[0];

  Amount = Amount * (shouldPromo ? 1 - promoCodes[randomPromoIdx][randomPromo] : 1);
  // console.log(totalPrice);
  let paymentDate = randomDateGreaterThanID(r.ReservationID, {max: 1});
  // fetch last payment id of the facility part (in case got that date)
  let lastIDOfDateO = payments.findLast(p => p.PaymentID.startsWith(dateToIDFormat(paymentDate)));
  if (lastResPaymentDate && lastResPaymentDate < paymentDate) {
    lastResPaymentDate = paymentDate;
    currPaymentID = parseInt(lastIDOfDateO?.PaymentID?.substring(6) || 0) + 1;
  } else {
    // init lastFacPaymentDate if not yet init
    if (!lastResPaymentDate) {
      lastResPaymentDate = paymentDate;
      currPaymentID = parseInt(lastIDOfDateO?.PaymentID?.substring(6) || 0) + 1;
    }
    paymentDate = lastResPaymentDate;
    lastIDOfDateO = payments.findLast(p => p.PaymentID.startsWith(dateToIDFormat(paymentDate)));
    currPaymentID = parseInt(lastIDOfDateO?.PaymentID?.substring(6) || 0) + 1;
  }
  let payment = {
    PaymentID: `${dateToIDFormat(paymentDate)}${digitFormat(currPaymentID, 4)}`,
    PromoCode: shouldPromo ? randomPromo : "NULL",
    ReservationID: r.ReservationID,
    FacilityReservedID: "NULL",
    PaymentType: Amount > 7000 ? "CARD" : paymentTypes[random(0, paymentTypes.length - 1)],
    Amount,
  }
  payments.push(payment);
  // HACK: UNCOMMENT ME
  fs.writeFileSync(
    "./insertSqls/10-InsertPayment.txt",
    inserter("Payment", payment),
    { flag: 'a' }
  );
});

// console.log(payments.filter(p => p.PaymentID.startsWith("R")));

// Cancellation
// need generate cancellation before checkInOut so that cancellation eh no included in checkInOut
console.log("Generating Cancellation...");
const cancellation = [];
const cancellationReasons = [
  'Change of plans',
  'Illness or injury',
  'Financial issues',
  'Weather-related cancellations',
  'Work-related conflicts',
  'Double booking mistake',
  'Travel restrictions or visa issues',
  'Accommodation quality concerns',
  'Family emergencies',
  'Death or funeral'
];

const cancelled = faker.helpers.arrayElements(reservations, 500);

let currentCancel = 1
cancelled.forEach(c => {
  let cancel = {
    CancelID: `C${digitFormat(currentCancel++, 9)}`,
    ReservationID: c.ReservationID,
    CancelReason: cancellationReasons[random(0, cancellationReasons.length - 1)],
  };
  cancellation.push(cancel);
  // HACK: COMMENT ME
  fs.writeFileSync(
    "./insertSqls/12-InsertCancellation.txt",
    inserter("Cancellation", cancel),
    { flag: 'a' }
  );
});
// console.log(cancellation)

// Check In Out
console.log("Generating Check In Out Records...");
const checkInOut = [];
reservations.filter(r => cancellation.every(c => c.ReservationID !== r.ReservationID)).forEach(r => {
  let checkIn = {
    ReservationID: r.ReservationID,
    CheckInOutType: "CHECKIN",
    CheckInOutDateTime: timeFormat(randomDateGreaterHour(r.StartDate.replace(/[()]/g, "").replace("TO_DATE", "").replace(", 'YYYY-MM-DD'", ""))),
  };
  let checkOut = {
    ReservationID: r.ReservationID,
    CheckInOutType: "CHECKOUT",
    CheckInOutDateTime: timeFormat(randomDateGreaterHour(r.EndDate.replace(/[()]/g, "").replace("TO_DATE", "").replace(", 'YYYY-MM-DD'", ""))),
  };

  checkInOut.push(checkIn, checkOut);
  // HACK: UNCOMMENT ME
  fs.writeFileSync(
    "./insertSqls/11-InsertCheckInOut.txt",
    `${inserter("CheckInOut", checkIn)}${inserter("CheckInOut", checkOut)}`,
    { flag: 'a' }
  );
});


// Refund
console.log("Generating Refunds...");
const refunds = [];
const appliedRefunds = faker.helpers.arrayElements(cancellation, 350);
let currRefund = 1;
appliedRefunds.forEach(ar => {
  let paid = payments.find(p => p.ReservationID === ar.ReservationID);
  let refund = {
    RefundID: `RF${digitFormat(currRefund++, 8)}`,
    CancelID: ar.CancelID,
    RefundAmount: paid.Amount,
  }
  refunds.push(refund);
  // HACK: COMMENT ME
  fs.writeFileSync(
    "./insertSqls/13-InsertRefund.txt",
    inserter("Refund", refund),
    { flag: 'a' }
  );
});

// console.log(cancellation, refunds);
