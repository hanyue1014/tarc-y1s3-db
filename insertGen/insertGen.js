const { faker } = require("@faker-js/faker");
// after gen directly write to file d
const fs = require("fs");

// make life easier
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const digitFormat = (num, pad) => num.toString().padStart(pad, "0");
const twoDigitFormat = (num) => digitFormat(num, 2);
const dateFormat = (date) => `${date.getFullYear()}-${twoDigitFormat(date.getMonth() + 1)}-${twoDigitFormat(date.getDate())}`;
const timeFormat = (dateTime) => `${dateFormat(dateTime)} ${dateTime.getHours()}:${dateTime.getMinutes()}:${dateTime.getSeconds()}`;
// generates insert statements
const inserter = (tableName, obj) => {
  let insert = `INSERT INTO ${tableName}(`;
  const keys = Object.keys(obj);
  // comma as separator, ) VALUES () as last element to close
  keys.forEach((k, i) => insert += `${k}${i !== keys.length - 1 ? ',' : ') VALUES ('}`);
  // comma as separator, ); as last element to close
  // if value is 'NULL', nonid '' directly NULL to insert NULL data, all other values shud have '' except number
  // very nested and ugly ifkr, but time is a factor for this, i don't need to maintain this code
  keys.forEach((k, i) =>
    insert += `${obj[k] === 'NULL' ?
      'NULL' :
      `${typeof obj[k] === 'number' ? obj[k] : `'${obj[k]}'`}`
    }${i !== keys.length - 1 ? ',' : ');\n'}`);

  return insert;
}
// sequential date generator for most IDs
const useIDGen = ({ incrementRate, yearStart } = {}) => {
  // more controllable incrementing
  // change percentage to decrease increment rate
  const shudIncrement = () => Math.random() > (incrementRate || 0.9);

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
      if (dateData.dayIncremented >= 4) {
        dateData.dayIncremented = 0;
        dateData.day = 1;
        dateData.month++;
        if (dateData.month > 12) {
          dateData.year++;
          dateData.month = 1;
        }
      } else {
        dateData.dayIncremented++
        // generate a number between 1 and 15, increment date by that number
        dateData.day += random(1, 15);
        // max 31
        if ([1, 3, 5, 7, 8, 10, 12].includes(dateData.month)) {
          if (dateData.day >= 31) {
            dateData.day = 31;
            dateData.dayIncremented = 4;  // set 4, next time increment will directly increment month
          }
        } else if (dateData.month === 2) {
          if (dateData.day >= 28) {
            dateData.day = 28;
            dateData.dayIncremented = 4;
          }
        } else if (dateData.day >= 30) {
          dateData.day = 30;
          dateData.dayIncremented = 4;
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
const randomDateGreaterThanID = (id) => {
  // parse the ID
  const year = id.substring(0, 2);
  const month = id.substring(2, 4);
  const day = id.substring(4, 6);

  const newDate = randomDateGreater(`${month}/${day}/${year}`, { max: 4 });
  return newDate;
}
// generates a date greater date given by 1 to 14 hours
const randomDateGreaterHour = (date) => {
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
    incrementRate: 0.67,
  });
  for (let i = 0; i < 100; i++) {
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
for (let i = 0; i < facilityReserved.length; i++) {
  let facilityReservedItem = {
    FacilityReservedID: facilityReserved[i].FacilityReservedID,
    FacilityID: "",
  }
  for (let j = 0; j < random(0, facilities.length - 1); j++) {
    let facilityReservedItemClone = {
      ...facilityReservedItem,
      FacilityID: facilities[random(0, facilities.length - 1)].FacilityID
    };
    facilityReservedList.push(facilityReservedItemClone);
    // HACK: COMMENT ME
    fs.writeFileSync(
      "./insertSqls/03-InsertFacilityReservedList.txt",
      inserter("FacilityReservedList", facilityReservedItemClone),
      { flag: 'a' }
    );
  }
}

// Reservation
console.log("Generating Reservations...");
// save reservation data for later use
const reservations = [];
for (let u = 0; u < 3; u++) {
  const newReservationID = useIDGen({
    yearStart: u,
    incrementRate: 0.67,
  });
  for (let i = 0; i < 100; i++) {
    const ReservationID = newReservationID();
    const StartDate = randomDateGreaterThanID(ReservationID);
    const EndDate = randomDateGreater(StartDate);
    let reservation = {
      ReservationID,
      CustID: customers[random(0, customers.length - 1)].CustID,
      StartDate: dateFormat(StartDate),
      EndDate: dateFormat(EndDate),
      Notes: "",
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
  let lastIdxRoom = random(0, rooms.length - 1);
  for (let i = 0; i < random(2, 5); i++) {
    const shouldGtPackage = Math.random() > 0.5;

    // generate new idx if the room has repeated
    let newIdx = random(0, rooms.length - 1);
    while (newIdx === lastIdxRoom) {
      newIdx = random(0, rooms.length - 1);
    }
    // update for next iteration
    lastIdxRoom = newIdx;
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
let currPaymentID = 1;
// every facility reservation
facilityReserved.forEach(fr => {
  // get only the same facility reserved id (can get price)
  let faci = facilityReservedList.filter(frl => fr.FacilityReservedID === frl.FacilityReservedID);
  const shouldPromo = Math.random() > 0.5;
  const randomPromoIdx = random(0, promoCodes.length - 1);
  // very confirm every only got one key
  let randomPromo = Object.keys(promoCodes[randomPromoIdx])[0];
  // console.log(faci)
  let Amount = faci.reduce((acc, cur) => {
    acc += facilities.find(f => f.FacilityID === cur.FacilityID).price;
    return acc;
  }, 0);
  Amount = Amount * (shouldPromo ? 1 - promoCodes[randomPromoIdx][randomPromo] : 1);
  // console.log(totalPrice);
  let payment = {
    PaymentID: `F${digitFormat(currPaymentID++, 9)}`,
    PromoCode: shouldPromo ? randomPromo : "NULL",
    ReservationID: "NULL",
    FacilityReservedID: fr.FacilityReservedID,
    PaymentType: paymentTypes[random(0, paymentTypes.length - 1)],
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
reservations.forEach(r => {
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
    acc += rto[rt];

    // calculate price based on package id
    acc *= roomPackages.find(rp => rp.PackageID === cur.PackageID).PackagePrice

    return acc;
  }, 0);
  const shouldPromo = Math.random() > 0.5;

  let randomPromoIdx = random(0, promoCodes.length - 1);
  // very confirm every only got one key
  let randomPromo = Object.keys(promoCodes[randomPromoIdx])[0];

  Amount = Amount * (shouldPromo ? 1 - promoCodes[randomPromoIdx][randomPromo] : 1);
  // console.log(totalPrice);
  let payment = {
    PaymentID: `R${digitFormat(currPaymentID++, 9)}`,
    PromoCode: shouldPromo ? randomPromo : "NULL",
    ReservationID: r.ReservationID,
    FacilityReservedID: "NULL",
    PaymentType: paymentTypes[random(0, paymentTypes.length - 1)],
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

// Check In Out
console.log("Generating Check In Out Records...");
const checkInOut = [];
reservations.forEach(r => {
  let checkIn = {
    ReservationID: r.ReservationID,
    CheckInOutType: "CHECKIN",
    CheckInOutDateTime: timeFormat(randomDateGreaterHour(r.StartDate)),
  };
  let checkOut = {
    ReservationID: r.ReservationID,
    CheckInOutType: "CHECKOUT",
    CheckInOutDateTime: timeFormat(randomDateGreaterHour(r.EndDate)),
  };

  checkInOut.push(checkIn, checkOut);
  // HACK: UNCOMMENT ME
  fs.writeFileSync(
    "./insertSqls/11-InsertCheckInOut.txt",
    `${inserter("CheckInOut", checkIn)}${inserter("CheckInOut", checkOut)}`,
    { flag: 'a' }
  );
});

// Cancellation
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
// HACK: get from payments since everything can directly get from thr, include price as well
const cancelled = faker.helpers.arrayElements(reservations, 50);

let currentCancel = 1
cancelled.forEach(c => {
  let cancel = {
    CancelID: `C${digitFormat(currentCancel++, 10)}`,
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

// Refund
console.log("Generating Refunds...");
const refunds = [];
const appliedRefunds = faker.helpers.arrayElements(cancellation, 40);
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
