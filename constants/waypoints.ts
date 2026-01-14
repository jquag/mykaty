// Service provider: 'state' = Missouri State Parks, 'community' = local businesses
export type ServiceProvider = 'state' | 'community' | null;

export interface TrailheadServices {
  foodGrocery: ServiceProvider;
  restaurant: ServiceProvider;
  parking: ServiceProvider;
  bikeShop: ServiceProvider;
  bikeRental: ServiceProvider;
  lodging: ServiceProvider;
  phone: ServiceProvider;
  water: ServiceProvider;
  camping: ServiceProvider;
  restroom: ServiceProvider;
  bikeService: ServiceProvider;
  bikeWorkStation: ServiceProvider;
  shuttleService: ServiceProvider;
}

export interface TrailheadContact {
  name: string;
  phone: string;
}

export interface Waypoint {
  lat: number;
  lng: number;
  name: string;
  services?: TrailheadServices;
  contact?: TrailheadContact;
  notes?: string;
}

// Note: Trailheads with modern restrooms/water are winterized Nov 1 - April 1
// (restrooms closed, water turned off)
// Source: Missouri State Parks Trail Services Grid

export const waypoints: Waypoint[] = [
  // East to West (Machens to Clinton)
  {
    lat: 38.90344,
    lng: -90.33138,
    name: "Machens",
    services: {
      foodGrocery: null,
      restaurant: null,
      parking: null,
      bikeShop: null,
      bikeRental: null,
      lodging: null,
      phone: null,
      water: null,
      camping: null,
      restroom: "state",
      bikeService: null,
      bikeWorkStation: null,
      shuttleService: null
    },
    notes: "No vehicle access available"
  },
  {
    lat: 38.87370,
    lng: -90.37178,
    name: "Black Walnut",
    services: {
      foodGrocery: null,
      restaurant: null,
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: null,
      phone: null,
      water: null,
      camping: null,
      restroom: null,
      bikeService: null,
      bikeWorkStation: "community",
      shuttleService: null
    }
  },
  {
    lat: 38.77313,
    lng: -90.48389,
    name: "St. Charles",
    services: {
      foodGrocery: "community",
      restaurant: "community",
      parking: "state",
      bikeShop: "community",
      bikeRental: "community",
      lodging: "community",
      phone: "community",
      water: "state",
      camping: "state",
      restroom: "state",
      bikeService: "community",
      bikeWorkStation: "community",
      shuttleService: "community"
    },
    contact: {
      name: "St. Charles Convention & Visitors Bureau",
      phone: "800-366-2427"
    }
  },
  {
    lat: 38.71562,
    lng: -90.56697,
    name: "Greens Bottom",
    services: {
      foodGrocery: "community",
      restaurant: "community",
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: "community",
      phone: "community",
      water: "state",
      camping: null,
      restroom: "state",
      bikeService: null,
      bikeWorkStation: null,
      shuttleService: null
    }
  },
  {
    lat: 38.66023,
    lng: -90.74395,
    name: "Weldon Spring",
    services: {
      foodGrocery: null,
      restaurant: null,
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: null,
      phone: null,
      water: "state",
      camping: null,
      restroom: "state",
      bikeService: null,
      bikeWorkStation: "community",
      shuttleService: null
    }
  },
  {
    lat: 38.62991,
    lng: -90.77970,
    name: "Defiance",
    services: {
      foodGrocery: "community",
      restaurant: "community",
      parking: "state",
      bikeShop: "community",
      bikeRental: "community",
      lodging: "community",
      phone: "community",
      water: "state",
      camping: "state",
      restroom: "state",
      bikeService: "community",
      bikeWorkStation: "community",
      shuttleService: "community"
    },
    contact: {
      name: "Defiance Merchant's Association",
      phone: "314-223-3423"
    }
  },
  {
    lat: 38.60863,
    lng: -90.79485,
    name: "Matson",
    services: {
      foodGrocery: null,
      restaurant: "community",
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: "community",
      phone: "community",
      water: "state",
      camping: "state",
      restroom: "state",
      bikeService: null,
      bikeWorkStation: null,
      shuttleService: null
    },
    contact: {
      name: "Klondike Park",
      phone: "636-949-7535"
    },
    notes: "Services located approximately 2 miles west of Matson"
  },
  {
    lat: 38.56990,
    lng: -90.88107,
    name: "Augusta",
    services: {
      foodGrocery: "community",
      restaurant: "community",
      parking: "state",
      bikeShop: "community",
      bikeRental: "community",
      lodging: "community",
      phone: "community",
      water: "state",
      camping: null,
      restroom: "state",
      bikeService: "community",
      bikeWorkStation: null,
      shuttleService: "community"
    },
    contact: {
      name: "Augusta Chamber of Commerce",
      phone: "636-228-4005"
    }
  },
  {
    lat: 38.60287,
    lng: -90.99919,
    name: "Dutzow",
    services: {
      foodGrocery: "community",
      restaurant: "community",
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: null,
      phone: null,
      water: "state",
      camping: null,
      restroom: "state",
      bikeService: null,
      bikeWorkStation: null,
      shuttleService: null
    }
  },
  {
    lat: 38.62718,
    lng: -91.06079,
    name: "Marthasville",
    services: {
      foodGrocery: "community",
      restaurant: "community",
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: "community",
      phone: "community",
      water: "state",
      camping: null,
      restroom: "state",
      bikeService: null,
      bikeWorkStation: "community",
      shuttleService: null
    },
    contact: {
      name: "Marthasville Chamber of Commerce",
      phone: "636-433-5242"
    }
  },
  {
    lat: 38.64332,
    lng: -91.18792,
    name: "Treloar",
    services: {
      foodGrocery: null,
      restaurant: null,
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: null,
      phone: null,
      water: "state",
      camping: null,
      restroom: "state",
      bikeService: null,
      bikeWorkStation: null,
      shuttleService: null
    }
  },
  {
    lat: 38.73393,
    lng: -91.44438,
    name: "McKittrick",
    services: {
      foodGrocery: "community",
      restaurant: "community",
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: "community",
      phone: "community",
      water: "state",
      camping: null,
      restroom: "state",
      bikeService: null,
      bikeWorkStation: "community",
      shuttleService: null
    }
  },
  {
    lat: 38.71904,
    lng: -91.51598,
    name: "Rhineland",
    services: {
      foodGrocery: "community",
      restaurant: "community",
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: "community",
      phone: "community",
      water: "state",
      camping: null,
      restroom: "state",
      bikeService: null,
      bikeWorkStation: null,
      shuttleService: null
    }
  },
  {
    lat: 38.70563,
    lng: -91.62286,
    name: "Bluffton",
    services: {
      foodGrocery: null,
      restaurant: null,
      parking: null,
      bikeShop: "community",
      bikeRental: null,
      lodging: null,
      phone: null,
      water: "state",
      camping: "state",
      restroom: "state",
      bikeService: "community",
      bikeWorkStation: "community",
      shuttleService: null
    }
  },
  {
    lat: 38.70961,
    lng: -91.71667,
    name: "Portland",
    services: {
      foodGrocery: "community",
      restaurant: "community",
      parking: null,
      bikeShop: null,
      bikeRental: null,
      lodging: null,
      phone: null,
      water: "state",
      camping: null,
      restroom: "state",
      bikeService: null,
      bikeWorkStation: null,
      shuttleService: null
    },
    contact: {
      name: "Kingdom of Callaway Chamber of Commerce",
      phone: "800-257-3554"
    }
  },
  {
    lat: 38.70373,
    lng: -91.81646,
    name: "Steedman",
    services: {
      foodGrocery: null,
      restaurant: null,
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: null,
      phone: null,
      water: null,
      camping: null,
      restroom: null,
      bikeService: null,
      bikeWorkStation: null,
      shuttleService: null
    },
    contact: {
      name: "Kingdom of Callaway Chamber of Commerce",
      phone: "800-257-3554"
    }
  },
  {
    lat: 38.67472,
    lng: -91.87063,
    name: "Mokane",
    services: {
      foodGrocery: "community",
      restaurant: "community",
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: null,
      phone: "community",
      water: "state",
      camping: "state",
      restroom: "state",
      bikeService: null,
      bikeWorkStation: null,
      shuttleService: null
    },
    contact: {
      name: "Kingdom of Callaway Chamber of Commerce",
      phone: "800-257-3554"
    }
  },
  {
    lat: 38.62103,
    lng: -91.95904,
    name: "Tebbetts",
    services: {
      foodGrocery: null,
      restaurant: "community",
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: "community",
      phone: null,
      water: "state",
      camping: null,
      restroom: "state",
      bikeService: null,
      bikeWorkStation: null,
      shuttleService: null
    },
    contact: {
      name: "Kingdom of Callaway Chamber of Commerce",
      phone: "800-257-3554"
    }
  },
  {
    lat: 38.60592,
    lng: -92.16225,
    name: "North Jefferson",
    services: {
      foodGrocery: "community",
      restaurant: "community",
      parking: null,
      bikeShop: null,
      bikeRental: null,
      lodging: null,
      phone: null,
      water: "state",
      camping: "state",
      restroom: "state",
      bikeService: null,
      bikeWorkStation: "community",
      shuttleService: null
    },
    contact: {
      name: "Jefferson City Convention & Visitors Bureau",
      phone: "800-769-4183"
    }
  },
  {
    lat: 38.66058,
    lng: -92.25828,
    name: "Claysville",
    services: {
      foodGrocery: null,
      restaurant: null,
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: null,
      phone: null,
      water: null,
      camping: null,
      restroom: null,
      bikeService: null,
      bikeWorkStation: null,
      shuttleService: null
    }
  },
  {
    lat: 38.69433,
    lng: -92.30989,
    name: "Hartsburg",
    services: {
      foodGrocery: null,
      restaurant: "community",
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: "community",
      phone: "community",
      water: "state",
      camping: "state",
      restroom: "state",
      bikeService: null,
      bikeWorkStation: "community",
      shuttleService: null
    }
  },
  {
    lat: 38.73544,
    lng: -92.35869,
    name: "Wilton",
    services: {
      foodGrocery: "community",
      restaurant: null,
      parking: null,
      bikeShop: null,
      bikeRental: null,
      lodging: null,
      phone: null,
      water: null,
      camping: null,
      restroom: "state",
      bikeService: null,
      bikeWorkStation: null,
      shuttleService: null
    }
  },
  {
    lat: 38.80287,
    lng: -92.37716,
    name: "Easley",
    services: {
      foodGrocery: "community",
      restaurant: "community",
      parking: "state",
      bikeShop: "community",
      bikeRental: "community",
      lodging: null,
      phone: null,
      water: "state",
      camping: "state",
      restroom: "state",
      bikeService: "community",
      bikeWorkStation: "community",
      shuttleService: null
    },
    contact: {
      name: "",
      phone: "573-657-2544"
    },
    notes: "Services located approximately 1 mile west of Easley"
  },
  {
    lat: 38.83743,
    lng: -92.40574,
    name: "Providence",
    services: {
      foodGrocery: null,
      restaurant: null,
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: null,
      phone: null,
      water: "state",
      camping: null,
      restroom: "state",
      bikeService: null,
      bikeWorkStation: null,
      shuttleService: null
    }
  },
  {
    lat: 38.88744,
    lng: -92.44641,
    name: "McBaine",
    services: {
      foodGrocery: null,
      restaurant: null,
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: null,
      phone: null,
      water: "state",
      camping: null,
      restroom: "state",
      bikeService: null,
      bikeWorkStation: null,
      shuttleService: null
    }
  },
  {
    lat: 38.91065,
    lng: -92.47374,
    name: "Huntsdale",
    services: {
      foodGrocery: "community",
      restaurant: null,
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: "community",
      phone: "community",
      water: "state",
      camping: null,
      restroom: "state",
      bikeService: "community",
      bikeWorkStation: null,
      shuttleService: null
    }
  },
  {
    lat: 38.97745,
    lng: -92.56093,
    name: "Rocheport",
    services: {
      foodGrocery: "community",
      restaurant: "community",
      parking: "state",
      bikeShop: "community",
      bikeRental: "community",
      lodging: "community",
      phone: "community",
      water: "state",
      camping: null,
      restroom: "state",
      bikeService: "community",
      bikeWorkStation: null,
      shuttleService: "community"
    },
    contact: {
      name: "Rocheport Information",
      phone: "573-698-3245"
    }
  },
  {
    lat: 39.01246,
    lng: -92.73563,
    name: "New Franklin",
    services: {
      foodGrocery: "community",
      restaurant: "community",
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: "community",
      phone: "community",
      water: "state",
      camping: "state",
      restroom: "state",
      bikeService: null,
      bikeWorkStation: "community",
      shuttleService: null
    },
    contact: {
      name: "New Franklin City Hall",
      phone: "660-848-2288"
    }
  },
  {
    lat: 38.97371,
    lng: -92.74902,
    name: "Boonville",
    services: {
      foodGrocery: "community",
      restaurant: "community",
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: "community",
      phone: "community",
      water: "state",
      camping: "state",
      restroom: "state",
      bikeService: "community",
      bikeWorkStation: "community",
      shuttleService: null
    },
    contact: {
      name: "Boonville Chamber of Commerce",
      phone: "660-882-2721"
    }
  },
  {
    lat: 38.87567,
    lng: -92.91246,
    name: "Pilot Grove",
    services: {
      foodGrocery: "community",
      restaurant: "community",
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: "community",
      phone: "community",
      water: "state",
      camping: "state",
      restroom: "state",
      bikeService: null,
      bikeWorkStation: "community",
      shuttleService: null
    },
    contact: {
      name: "Pilot Grove Information",
      phone: "660-834-4300"
    }
  },
  {
    lat: 38.76235,
    lng: -93.04100,
    name: "Clifton City",
    services: {
      foodGrocery: null,
      restaurant: null,
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: null,
      phone: null,
      water: null,
      camping: null,
      restroom: "state",
      bikeService: null,
      bikeWorkStation: null,
      shuttleService: null
    }
  },
  {
    lat: 38.70742,
    lng: -93.22109,
    name: "Sedalia",
    services: {
      foodGrocery: "community",
      restaurant: "community",
      parking: "state",
      bikeShop: "community",
      bikeRental: "community",
      lodging: "community",
      phone: "community",
      water: "state",
      camping: "state",
      restroom: "state",
      bikeService: "community",
      bikeWorkStation: "community",
      shuttleService: "community"
    },
    contact: {
      name: "Sedalia Convention & Visitors Bureau",
      phone: "800-827-5295"
    }
  },
  {
    lat: 38.61938,
    lng: -93.41001,
    name: "Green Ridge",
    services: {
      foodGrocery: "community",
      restaurant: null,
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: null,
      phone: null,
      water: "state",
      camping: null,
      restroom: "state",
      bikeService: null,
      bikeWorkStation: "community",
      shuttleService: null
    },
    contact: {
      name: "Green Ridge City Hall",
      phone: "660-527-3541"
    }
  },
  {
    lat: 38.53556,
    lng: -93.52502,
    name: "Windsor",
    services: {
      foodGrocery: "community",
      restaurant: "community",
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: "community",
      phone: "community",
      water: "state",
      camping: "state",
      restroom: "state",
      bikeService: null,
      bikeWorkStation: null,
      shuttleService: null
    },
    contact: {
      name: "Windsor Chamber of Commerce",
      phone: "660-647-2318"
    }
  },
  {
    lat: 38.46875,
    lng: -93.62352,
    name: "Calhoun",
    services: {
      foodGrocery: "community",
      restaurant: "community",
      parking: "state",
      bikeShop: null,
      bikeRental: null,
      lodging: "community",
      phone: "community",
      water: "state",
      camping: null,
      restroom: "state",
      bikeService: null,
      bikeWorkStation: null,
      shuttleService: null
    },
    contact: {
      name: "Calhoun City Hall",
      phone: "660-694-3634"
    }
  },
  {
    lat: 38.38450,
    lng: -93.75785,
    name: "Clinton",
    services: {
      foodGrocery: "community",
      restaurant: "community",
      parking: "community",
      bikeShop: null,
      bikeRental: null,
      lodging: "community",
      phone: "community",
      water: "state",
      camping: "state",
      restroom: "state",
      bikeService: "community",
      bikeWorkStation: "community",
      shuttleService: "community"
    },
    contact: {
      name: "Clinton Chamber of Commerce",
      phone: "800-222-5251"
    }
  }
];
