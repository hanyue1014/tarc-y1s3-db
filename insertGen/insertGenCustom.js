const fs = require("fs")

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

const facility = [
  {
    FacilityID: "HAL1",
    FacilityDesc: "Hall 1: A hall that can be used to host up to 1000 people",
    StartTime: "08:00",
    EndTime: "23:00",
    FacilityPrice: 8888.88,
  },
  {
    FacilityID: "HAL2",
    FacilityDesc: "Hall 2: A hall that can be used to host up to 500 people",
    StartTime: "08:00",
    EndTime: "23:00",
    FacilityPrice: 4599.00,
  },
  {
    FacilityID: "HAL3",
    FacilityDesc: "Hall 3: A hall that can be used to host up to 100 people",
    StartTime: "08:00",
    EndTime: "23:00",
    FacilityPrice: 2399.00,
  },
  {
    FacilityID: "MTR1",
    FacilityDesc: "Meeting Room 1: A meeting room",
    StartTime: "10:00",
    EndTime: "21:00",
    FacilityPrice: 280.00,
  },
  {
    FacilityID: "MTR2",
    FacilityDesc: "Meeting Room 2: A meeting room",
    StartTime: "10:00",
    EndTime: "21:00",
    FacilityPrice: 280.00,
  },
  {
    FacilityID: "MTR3",
    FacilityDesc: "Meeting Room 3: A meeting room",
    StartTime: "10:00",
    EndTime: "21:00",
    FacilityPrice: 280.00,
  },
  {
    FacilityID: "BAC1",
    FacilityDesc: "Basketball Court: Play basketball under protection from rain and sun",
    StartTime: "08:00",
    EndTime: "22:00",
    FacilityPrice: 400.00,
  },
  {
    FacilityID: "RES1",
    FacilityDesc: "Restaurant: Book for functions like dinners",
    StartTime: "10:00",
    EndTime: "00:00",
    FacilityPrice: 500.00,
  },
  {
    FacilityID: "SPA1",
    FacilityDesc: "Spa: Especially useful if you want to host SPA parties",
    StartTime: "10:00",
    EndTIme: "21:00",
    FacilityPrice: 700.00,
  },
  {
    FacilityID: "GYM1",
    FacilityDesc: "GYM: Useful for gym workshops that teaches students for only a certain period",
    StartTime: "10:00",
    EndTIme: "00:00",
    FacilityPrice: 680.00,
  },
];
console.log("Generating Facility...");
facility.forEach(f => {
  fs.writeFileSync("./insertSqls/01-InsertFacility.txt", inserter("Facility", f), { flag: 'a' });
})

const roomTypes = [
  {
    RoomType: "SIN",
    RoomDesc: "Single Room: A room assigned to one person",
    RoomPrice: 120.00,
  },
  {
    RoomType: "DOU",
    RoomDesc: "Double Room: A room assigned to two people",
    RoomPrice: 239.00,
  },
  {
    RoomType: "TRI",
    RoomDesc: "Triple Room: A room that can accommodate three persons",
    RoomPrice: 350.00,
  },
  {
    RoomType: "FAM",
    RoomDesc: "Family Room: A room assigned to a family",
    RoomPrice: 400.00,
  },
  {
    roomType: "STU",
    roomDesc: "Studio: A room that has a small kitchenette with basic appliances",
    roomPrice: 600.00,
  },
  {
    roomType: "SUI",
    roomDesc: "Suite: A room that has one or more bedrooms and a seperate living area",
    roomPrice: 800.00,
  },
  {
    RoomType: "PRE",
    RoomDesc: "President Suite: A luxurious room that has one or more bedrooms and a spacisous living area, including a big balcony for beautiful views",
    RoomPrice: 5500.00,
  },
  {
    RoomType: "CON",
    RoomDesc: "Connected Room: A room that has an internal door that connects to another room (rented as pair)",
    RoomPrice: 750.00,
  },
  {
    RoomType: "ACC",
    RoomDesc: "Accessible Room: A room specially designed for guests with disabilities or special needs",
    RoomPrice: 300.00,
  },
  {
    RoomType: "VIL",
    RoomDesc: "Villa: A large and luxurious house-like structure that is detached from the main building",
    RoomPrice: 1000.00,
  }
];

console.log("Generating RoomType...");
roomTypes.forEach(rt => {
  fs.writeFileSync("./insertSqls/05-InsertRoomType.txt", inserter("RoomType", rt), { flag: 'a' });
})

const roomPackages = [
  {
    PackageID: "A",
    PackageDesc: "A package with only an ordinary room, without any added goodies. Enjoy the vanilla stay without any extra cost!",
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
]

console.log("Generating Room Package...");
roomPackages.forEach(rp => {
  fs.writeFileSync("./insertSqls/07-InsertRoomPackage.txt", inserter("RoomPackage", rp), { flag: 'a' });
});

const promo = [
  {
    PromoCode: "YTDISC",
    PromoPercent: 0.1,
    PromoPlatform: "YOUTUBE",
    PromoDesc: "Advertisement placed on YouTube"
  },
  {
    PromoCode: "FBDISC",
    PromoPercent: 0.2,
    PromoPlatform: "FACEBOOK",
    PromoDesc: "Advertisement placed on Facebook"
  },
  {
    PromoCode: "TTDISC",
    PromoPercent: 0.1,
    PromoPlatform: "TWITTER",
    PromoDesc: "Advertisement placed on Twitter"
  },
  {
    PromoCode: "IGDISC",
    PromoPercent: 0.2,
    PromoPlatform: "INSTAGRAM",
    PromoDesc: "Advertisement placed on Instagram"
  },
  {
    PromoCode: "WSDISC",
    PromoPercent: 0.25,
    PromoPlatform: "WEBSITE",
    PromoDesc: "Advertisement placed on websites (using google ads)"
  },
  {
    PromoCode: "BNDISC",
    PromoPercent: 0.1,
    PromoPlatform: "BANNER",
    PromoDesc: "Advertisement placed on banners by the roadside"
  },
  {
    PromoCode: "TG1234",
    PromoPercent: 0.2,
    PromoPlatform: "THANKSGIVING",
    PromoDesc: "Appreciation for frequent customers"
  },
  {
    PromoCode: "TG4231",
    PromoPercent: 0.3,
    PromoPlatform: "THANKSGIVING",
    PromoDesc: "Chinese New Year Discount"
  },
  {
    PromoCode: "TG5678",
    PromoPercent: 0.3,
    PromoPlatform: "THANKSGIVING",
    PromoDesc: "Hari Raya Discount"
  },
  {
    PromoCode: "TG8765",
    PromoPercent: 0.35,
    PromoPlatform: "THANKSGIVING",
    PromoDesc: "Launch new website easter egg"
  }
];

console.log("Generating Promo...");
promo.forEach(p => {
  fs.writeFileSync("./insertSqls/09-InsertPromo.txt", inserter("Promo", p), { flag: 'a' });
})
