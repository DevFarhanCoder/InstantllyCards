// Global Postal Codes Database - Major cities and postal codes worldwide

type PostalCode = {
  code: string;
  city: string;
  area?: string;
  state: string;
  country: string;
};

export const POSTAL_CODES_DB: PostalCode[] = [
  // India - Mumbai with detailed areas
  { code: "400001", city: "Mumbai", area: "Fort", state: "Maharashtra", country: "India" },
  { code: "400002", city: "Mumbai", area: "Kalbadevi", state: "Maharashtra", country: "India" },
  { code: "400003", city: "Mumbai", area: "Masjid Bunder", state: "Maharashtra", country: "India" },
  { code: "400004", city: "Mumbai", area: "Girgaon", state: "Maharashtra", country: "India" },
  { code: "400005", city: "Mumbai", area: "Colaba", state: "Maharashtra", country: "India" },
  { code: "400006", city: "Mumbai", area: "Malabar Hill", state: "Maharashtra", country: "India" },
  { code: "400007", city: "Mumbai", area: "Grant Road", state: "Maharashtra", country: "India" },
  { code: "400008", city: "Mumbai", area: "Mumbai Central", state: "Maharashtra", country: "India" },
  { code: "400009", city: "Mumbai", area: "Mazgaon", state: "Maharashtra", country: "India" },
  { code: "400010", city: "Mumbai", area: "Mazgaon Dock", state: "Maharashtra", country: "India" },
  { code: "400011", city: "Mumbai", area: "Jacob Circle", state: "Maharashtra", country: "India" },
  { code: "400012", city: "Mumbai", area: "Lalbaug", state: "Maharashtra", country: "India" },
  { code: "400013", city: "Mumbai", area: "Delisle Road", state: "Maharashtra", country: "India" },
  { code: "400014", city: "Mumbai", area: "Dadar", state: "Maharashtra", country: "India" },
  { code: "400015", city: "Mumbai", area: "Sewri", state: "Maharashtra", country: "India" },
  { code: "400016", city: "Mumbai", area: "Mahim", state: "Maharashtra", country: "India" },
  { code: "400017", city: "Mumbai", area: "Dharavi", state: "Maharashtra", country: "India" },
  { code: "400018", city: "Mumbai", area: "Worli", state: "Maharashtra", country: "India" },
  { code: "400019", city: "Mumbai", area: "Matunga", state: "Maharashtra", country: "India" },
  { code: "400020", city: "Mumbai", area: "Church Gate", state: "Maharashtra", country: "India" },
  { code: "400021", city: "Mumbai", area: "Nariman Point", state: "Maharashtra", country: "India" },
  { code: "400022", city: "Mumbai", area: "Sion", state: "Maharashtra", country: "India" },
  { code: "400024", city: "Mumbai", area: "Kurla", state: "Maharashtra", country: "India" },
  { code: "400025", city: "Mumbai", area: "Parel", state: "Maharashtra", country: "India" },
  { code: "400026", city: "Mumbai", area: "Byculla", state: "Maharashtra", country: "India" },
  { code: "400028", city: "Mumbai", area: "Dadar", state: "Maharashtra", country: "India" },
  { code: "400030", city: "Mumbai", area: "Marine Lines", state: "Maharashtra", country: "India" },
  { code: "400031", city: "Mumbai", area: "Wadala", state: "Maharashtra", country: "India" },
  { code: "400034", city: "Mumbai", area: "Tardeo", state: "Maharashtra", country: "India" },
  { code: "400035", city: "Mumbai", area: "Haji Ali", state: "Maharashtra", country: "India" },
  { code: "400037", city: "Mumbai", area: "Antop Hill", state: "Maharashtra", country: "India" },
  { code: "400042", city: "Mumbai", area: "Bhandup", state: "Maharashtra", country: "India" },
  { code: "400043", city: "Mumbai", area: "Chunabhatti", state: "Maharashtra", country: "India" },
  { code: "400049", city: "Mumbai", area: "Bandra", state: "Maharashtra", country: "India" },
  { code: "400050", city: "Mumbai", area: "Bandra West", state: "Maharashtra", country: "India" },
  { code: "400051", city: "Mumbai", area: "Bandra East", state: "Maharashtra", country: "India" },
  { code: "400052", city: "Mumbai", area: "Khar", state: "Maharashtra", country: "India" },
  { code: "400053", city: "Mumbai", area: "Andheri East", state: "Maharashtra", country: "India" },
  { code: "400054", city: "Mumbai", area: "Santacruz West", state: "Maharashtra", country: "India" },
  { code: "400055", city: "Mumbai", area: "Santacruz East", state: "Maharashtra", country: "India" },
  { code: "400056", city: "Mumbai", area: "Vile Parle West", state: "Maharashtra", country: "India" },
  { code: "400057", city: "Mumbai", area: "Vile Parle East", state: "Maharashtra", country: "India" },
  { code: "400058", city: "Mumbai", area: "Andheri West", state: "Maharashtra", country: "India" },
  { code: "400059", city: "Mumbai", area: "Andheri East", state: "Maharashtra", country: "India" },
  { code: "400060", city: "Mumbai", area: "Jogeshwari West", state: "Maharashtra", country: "India" },
  { code: "400061", city: "Mumbai", area: "Goregaon West", state: "Maharashtra", country: "India" },
  { code: "400062", city: "Mumbai", area: "Goregaon East", state: "Maharashtra", country: "India" },
  { code: "400063", city: "Mumbai", area: "Malad West", state: "Maharashtra", country: "India" },
  { code: "400064", city: "Mumbai", area: "Malad East", state: "Maharashtra", country: "India" },
  { code: "400065", city: "Mumbai", area: "Goregaon", state: "Maharashtra", country: "India" },
  { code: "400066", city: "Mumbai", area: "Borivali West", state: "Maharashtra", country: "India" },
  { code: "400067", city: "Mumbai", area: "Kandivali West", state: "Maharashtra", country: "India" },
  { code: "400068", city: "Mumbai", area: "Dahisar East", state: "Maharashtra", country: "India" },
  { code: "400069", city: "Mumbai", area: "Andheri", state: "Maharashtra", country: "India" },
  { code: "400070", city: "Mumbai", area: "Kurla", state: "Maharashtra", country: "India" },
  { code: "400071", city: "Mumbai", area: "Chembur", state: "Maharashtra", country: "India" },
  { code: "400072", city: "Mumbai", area: "Kurla", state: "Maharashtra", country: "India" },
  { code: "400074", city: "Mumbai", area: "Ghatkopar West", state: "Maharashtra", country: "India" },
  { code: "400075", city: "Mumbai", area: "Nehru Nagar", state: "Maharashtra", country: "India" },
  { code: "400076", city: "Mumbai", area: "Powai", state: "Maharashtra", country: "India" },
  { code: "400077", city: "Mumbai", area: "Ghatkopar East", state: "Maharashtra", country: "India" },
  { code: "400078", city: "Mumbai", area: "Vikhroli", state: "Maharashtra", country: "India" },
  { code: "400079", city: "Mumbai", area: "Chembur", state: "Maharashtra", country: "India" },
  { code: "400080", city: "Mumbai", area: "Mulund East", state: "Maharashtra", country: "India" },
  { code: "400081", city: "Mumbai", area: "Mulund West", state: "Maharashtra", country: "India" },
  { code: "400082", city: "Mumbai", area: "Mulund Colony", state: "Maharashtra", country: "India" },
  { code: "400083", city: "Mumbai", area: "Ghatkopar", state: "Maharashtra", country: "India" },
  { code: "400084", city: "Mumbai", area: "Vikhroli", state: "Maharashtra", country: "India" },
  { code: "400085", city: "Mumbai", area: "Mulund", state: "Maharashtra", country: "India" },
  { code: "400086", city: "Mumbai", area: "Chembur", state: "Maharashtra", country: "India" },
  { code: "400087", city: "Mumbai", area: "Chunabhatti", state: "Maharashtra", country: "India" },
  { code: "400088", city: "Mumbai", area: "Trombay", state: "Maharashtra", country: "India" },
  { code: "400089", city: "Mumbai", area: "Chembur Naka", state: "Maharashtra", country: "India" },
  { code: "400090", city: "Mumbai", area: "Santacruz", state: "Maharashtra", country: "India" },
  { code: "400091", city: "Mumbai", area: "Borivali", state: "Maharashtra", country: "India" },
  { code: "400092", city: "Mumbai", area: "Borivali East", state: "Maharashtra", country: "India" },
  { code: "400093", city: "Mumbai", area: "Jogeshwari", state: "Maharashtra", country: "India" },
  { code: "400094", city: "Mumbai", area: "Dahisar", state: "Maharashtra", country: "India" },
  { code: "400095", city: "Mumbai", area: "Mira Road", state: "Maharashtra", country: "India" },
  { code: "400096", city: "Mumbai", area: "Kandivali East", state: "Maharashtra", country: "India" },
  { code: "400097", city: "Mumbai", area: "Malad", state: "Maharashtra", country: "India" },
  { code: "400098", city: "Mumbai", area: "Versova", state: "Maharashtra", country: "India" },
  { code: "400099", city: "Mumbai", area: "Juhu", state: "Maharashtra", country: "India" },
  { code: "400101", city: "Mumbai", area: "R/S Ward Zone 4", state: "Maharashtra", country: "India" },
  { code: "400102", city: "Mumbai", area: "Deonar", state: "Maharashtra", country: "India" },
  { code: "400103", city: "Mumbai", area: "Govandi", state: "Maharashtra", country: "India" },
  { code: "400104", city: "Mumbai", area: "Mankhurd", state: "Maharashtra", country: "India" },

  // Delhi with areas
  { code: "110001", city: "New Delhi", area: "Connaught Place", state: "Delhi", country: "India" },
  { code: "110002", city: "New Delhi", area: "Daryaganj", state: "Delhi", country: "India" },
  { code: "110003", city: "New Delhi", area: "Subzi Mandi", state: "Delhi", country: "India" },
  { code: "110005", city: "New Delhi", area: "Karol Bagh", state: "Delhi", country: "India" },
  { code: "110007", city: "New Delhi", area: "Kamla Nagar", state: "Delhi", country: "India" },
  { code: "110016", city: "New Delhi", area: "Lajpat Nagar", state: "Delhi", country: "India" },
  { code: "110017", city: "New Delhi", area: "Hauz Khas", state: "Delhi", country: "India" },
  { code: "110025", city: "New Delhi", area: "Greater Kailash", state: "Delhi", country: "India" },
  { code: "110029", city: "New Delhi", area: "Ashok Vihar", state: "Delhi", country: "India" },
  { code: "110032", city: "New Delhi", area: "Janakpuri", state: "Delhi", country: "India" },
  { code: "110035", city: "New Delhi", area: "Rohini", state: "Delhi", country: "India" },
  { code: "110037", city: "New Delhi", area: "Pitampura", state: "Delhi", country: "India" },
  { code: "110056", city: "New Delhi", area: "Dwarka", state: "Delhi", country: "India" },
  { code: "110062", city: "New Delhi", area: "Vasant Kunj", state: "Delhi", country: "India" },

  // Bangalore with areas
  { code: "560001", city: "Bangalore", area: "Bangalore GPO", state: "Karnataka", country: "India" },
  { code: "560004", city: "Bangalore", area: "Malleshwaram", state: "Karnataka", country: "India" },
  { code: "560005", city: "Bangalore", area: "Basavanagudi", state: "Karnataka", country: "India" },
  { code: "560010", city: "Bangalore", area: "Jayanagar", state: "Karnataka", country: "India" },
  { code: "560017", city: "Bangalore", area: "Sadashiva Nagar", state: "Karnataka", country: "India" },
  { code: "560018", city: "Bangalore", area: "Koramangala", state: "Karnataka", country: "India" },
  { code: "560019", city: "Bangalore", area: "Indiranagar", state: "Karnataka", country: "India" },
  { code: "560027", city: "Bangalore", area: "BTM Layout", state: "Karnataka", country: "India" },
  { code: "560029", city: "Bangalore", area: "Banashankari", state: "Karnataka", country: "India" },
  { code: "560040", city: "Bangalore", area: "JP Nagar", state: "Karnataka", country: "India" },
  { code: "560066", city: "Bangalore", area: "Yelahanka", state: "Karnataka", country: "India" },
  { code: "560095", city: "Bangalore", area: "Whitefield", state: "Karnataka", country: "India" },
  { code: "560100", city: "Bangalore", area: "Electronic City", state: "Karnataka", country: "India" },

  // USA - New York
  { code: "10001", city: "New York", area: "Chelsea", state: "NY", country: "USA" },
  { code: "10002", city: "New York", area: "Lower East Side", state: "NY", country: "USA" },
  { code: "10003", city: "New York", area: "East Village", state: "NY", country: "USA" },
  { code: "10004", city: "New York", area: "Financial District", state: "NY", country: "USA" },
  { code: "10005", city: "New York", area: "Wall Street", state: "NY", country: "USA" },
  { code: "10012", city: "New York", area: "SoHo", state: "NY", country: "USA" },
  { code: "10013", city: "New York", area: "Tribeca", state: "NY", country: "USA" },
  { code: "10014", city: "New York", area: "West Village", state: "NY", country: "USA" },
  { code: "10019", city: "New York", area: "Hell's Kitchen", state: "NY", country: "USA" },
  { code: "10021", city: "New York", area: "Upper East Side", state: "NY", country: "USA" },
  { code: "10023", city: "New York", area: "Upper West Side", state: "NY", country: "USA" },

  // USA - Los Angeles
  { code: "90001", city: "Los Angeles", area: "South LA", state: "CA", country: "USA" },
  { code: "90004", city: "Los Angeles", area: "Hancock Park", state: "CA", country: "USA" },
  { code: "90005", city: "Los Angeles", area: "Koreatown", state: "CA", country: "USA" },
  { code: "90012", city: "Los Angeles", area: "Chinatown", state: "CA", country: "USA" },
  { code: "90013", city: "Los Angeles", area: "Downtown LA", state: "CA", country: "USA" },
  { code: "90028", city: "Los Angeles", area: "Hollywood", state: "CA", country: "USA" },
  { code: "90046", city: "Los Angeles", area: "West Hollywood", state: "CA", country: "USA" },
  { code: "90210", city: "Beverly Hills", area: "Beverly Hills", state: "CA", country: "USA" },

  // UK - London
  { code: "SW1A", city: "London", area: "Westminster", state: "Greater London", country: "UK" },
  { code: "SW1X", city: "London", area: "Knightsbridge", state: "Greater London", country: "UK" },
  { code: "EC1A", city: "London", area: "City of London", state: "Greater London", country: "UK" },
  { code: "EC1M", city: "London", area: "Clerkenwell", state: "Greater London", country: "UK" },
  { code: "WC1A", city: "London", area: "Holborn", state: "Greater London", country: "UK" },
  { code: "WC1B", city: "London", area: "Bloomsbury", state: "Greater London", country: "UK" },
  { code: "WC2E", city: "London", area: "Strand", state: "Greater London", country: "UK" },
  { code: "WC2H", city: "London", area: "Leicester Square", state: "Greater London", country: "UK" },
  { code: "E1", city: "London", area: "Whitechapel", state: "Greater London", country: "UK" },
  { code: "N1", city: "London", area: "Islington", state: "Greater London", country: "UK" },
  { code: "NW1", city: "London", area: "Camden Town", state: "Greater London", country: "UK" },

  // Canada - Toronto
  { code: "M5H", city: "Toronto", area: "Financial District", state: "Ontario", country: "Canada" },
  { code: "M5J", city: "Toronto", area: "Union Station", state: "Ontario", country: "Canada" },
  { code: "M5R", city: "Toronto", area: "Yorkville", state: "Ontario", country: "Canada" },
  { code: "M5S", city: "Toronto", area: "University of Toronto", state: "Ontario", country: "Canada" },
  { code: "M5T", city: "Toronto", area: "Chinatown", state: "Ontario", country: "Canada" },
  { code: "M5V", city: "Toronto", area: "Entertainment District", state: "Ontario", country: "Canada" },
  { code: "M4W", city: "Toronto", area: "Rosedale", state: "Ontario", country: "Canada" },
  { code: "M4Y", city: "Toronto", area: "Church-Wellesley", state: "Ontario", country: "Canada" },
  { code: "M5A", city: "Toronto", area: "Harbourfront", state: "Ontario", country: "Canada" },
  { code: "M5B", city: "Toronto", area: "Garden District", state: "Ontario", country: "Canada" },
  { code: "M5C", city: "Toronto", area: "St. Lawrence", state: "Ontario", country: "Canada" },
  { code: "M5E", city: "Toronto", area: "Berczy Park", state: "Ontario", country: "Canada" },
  { code: "M5G", city: "Toronto", area: "Discovery District", state: "Ontario", country: "Canada" },
  { code: "M6G", city: "Toronto", area: "Christie Pits", state: "Ontario", country: "Canada" },
  { code: "M6H", city: "Toronto", area: "Dufferin Grove", state: "Ontario", country: "Canada" },
  { code: "M6J", city: "Toronto", area: "Little Portugal", state: "Ontario", country: "Canada" },
  { code: "M6K", city: "Toronto", area: "Parkdale", state: "Ontario", country: "Canada" },

  // Canada - Vancouver
  { code: "V5K", city: "Vancouver", area: "Downtown", state: "British Columbia", country: "Canada" },
  { code: "V6B", city: "Vancouver", area: "Yaletown", state: "British Columbia", country: "Canada" },
  { code: "V6C", city: "Vancouver", area: "Coal Harbour", state: "British Columbia", country: "Canada" },
  { code: "V6E", city: "Vancouver", area: "West End", state: "British Columbia", country: "Canada" },
  { code: "V6G", city: "Vancouver", area: "Kitsilano", state: "British Columbia", country: "Canada" },
  { code: "V6H", city: "Vancouver", area: "Fairview", state: "British Columbia", country: "Canada" },
  { code: "V6J", city: "Vancouver", area: "Shaughnessy", state: "British Columbia", country: "Canada" },
  { code: "V6K", city: "Vancouver", area: "Kerrisdale", state: "British Columbia", country: "Canada" },
  { code: "V6Z", city: "Vancouver", area: "False Creek", state: "British Columbia", country: "Canada" },

  // Canada - Montreal
  { code: "H2X", city: "Montreal", area: "Quartier des Spectacles", state: "Quebec", country: "Canada" },
  { code: "H2Y", city: "Montreal", area: "Old Montreal", state: "Quebec", country: "Canada" },
  { code: "H2Z", city: "Montreal", area: "Downtown Montreal", state: "Quebec", country: "Canada" },
  { code: "H3A", city: "Montreal", area: "Golden Square Mile", state: "Quebec", country: "Canada" },
  { code: "H3B", city: "Montreal", area: "Ville-Marie", state: "Quebec", country: "Canada" },
  { code: "H3G", city: "Montreal", area: "Westmount", state: "Quebec", country: "Canada" },
  { code: "H3H", city: "Montreal", area: "Notre-Dame-de-Grâce", state: "Quebec", country: "Canada" },

  // Australia - Sydney
  { code: "2000", city: "Sydney", area: "Sydney CBD", state: "NSW", country: "Australia" },
  { code: "2007", city: "Sydney", area: "Ultimo", state: "NSW", country: "Australia" },
  { code: "2009", city: "Sydney", area: "Pyrmont", state: "NSW", country: "Australia" },
  { code: "2010", city: "Sydney", area: "Surry Hills", state: "NSW", country: "Australia" },
  { code: "2011", city: "Sydney", area: "Potts Point", state: "NSW", country: "Australia" },
  { code: "2022", city: "Sydney", area: "Bondi Junction", state: "NSW", country: "Australia" },
  { code: "2026", city: "Sydney", area: "Bondi", state: "NSW", country: "Australia" },
  { code: "2030", city: "Sydney", area: "Vaucluse", state: "NSW", country: "Australia" },

  // Australia - Melbourne
  { code: "3000", city: "Melbourne", area: "Melbourne CBD", state: "VIC", country: "Australia" },
  { code: "3002", city: "Melbourne", area: "East Melbourne", state: "VIC", country: "Australia" },
  { code: "3003", city: "Melbourne", area: "West Melbourne", state: "VIC", country: "Australia" },
  { code: "3004", city: "Melbourne", area: "St Kilda Road", state: "VIC", country: "Australia" },
  { code: "3006", city: "Melbourne", area: "Southbank", state: "VIC", country: "Australia" },
  { code: "3031", city: "Melbourne", area: "Kensington", state: "VIC", country: "Australia" },
  { code: "3051", city: "Melbourne", area: "North Melbourne", state: "VIC", country: "Australia" },
  { code: "3053", city: "Melbourne", area: "Carlton", state: "VIC", country: "Australia" },
  { code: "3065", city: "Melbourne", area: "Fitzroy", state: "VIC", country: "Australia" },
  { code: "3141", city: "Melbourne", area: "South Yarra", state: "VIC", country: "Australia" },
  { code: "3181", city: "Melbourne", area: "Prahran", state: "VIC", country: "Australia" },

  // Australia - Brisbane
  { code: "4000", city: "Brisbane", area: "Brisbane CBD", state: "QLD", country: "Australia" },
  { code: "4006", city: "Brisbane", area: "Fortitude Valley", state: "QLD", country: "Australia" },
  { code: "4101", city: "Brisbane", area: "South Brisbane", state: "QLD", country: "Australia" },
  { code: "4102", city: "Brisbane", area: "Woolloongabba", state: "QLD", country: "Australia" },

  // Singapore
  { code: "018956", city: "Singapore", area: "Raffles Place", state: "Central", country: "Singapore" },
  { code: "048623", city: "Singapore", area: "Marina Bay", state: "Central", country: "Singapore" },
  { code: "068897", city: "Singapore", area: "Chinatown", state: "Central", country: "Singapore" },
  { code: "079903", city: "Singapore", area: "Orchard Road", state: "Central", country: "Singapore" },
  { code: "238801", city: "Singapore", area: "River Valley", state: "Central", country: "Singapore" },
  { code: "247933", city: "Singapore", area: "Bukit Timah", state: "Central", country: "Singapore" },
  { code: "469332", city: "Singapore", area: "Jurong", state: "West", country: "Singapore" },
  { code: "486038", city: "Singapore", area: "Bedok", state: "East", country: "Singapore" },
  { code: "498812", city: "Singapore", area: "Woodlands", state: "North", country: "Singapore" },

  // UAE - Dubai
  { code: "00000", city: "Dubai", area: "Downtown Dubai", state: "Dubai", country: "UAE" },
  { code: "4140", city: "Dubai", area: "Dubai Marina", state: "Dubai", country: "UAE" },
  { code: "75157", city: "Dubai", area: "Business Bay", state: "Dubai", country: "UAE" },
  { code: "337-1500", city: "Dubai", area: "Jumeirah", state: "Dubai", country: "UAE" },
  { code: "9770", city: "Dubai", area: "Deira", state: "Dubai", country: "UAE" },

  // UAE - Abu Dhabi
  { code: "00000", city: "Abu Dhabi", area: "Al Markaziyah", state: "Abu Dhabi", country: "UAE" },
  { code: "51133", city: "Abu Dhabi", area: "Corniche", state: "Abu Dhabi", country: "UAE" },

  // Germany - Berlin
  { code: "10115", city: "Berlin", area: "Mitte", state: "Berlin", country: "Germany" },
  { code: "10117", city: "Berlin", area: "Unter den Linden", state: "Berlin", country: "Germany" },
  { code: "10178", city: "Berlin", area: "Alexanderplatz", state: "Berlin", country: "Germany" },
  { code: "10243", city: "Berlin", area: "Friedrichshain", state: "Berlin", country: "Germany" },
  { code: "10245", city: "Berlin", area: "Simon-Dach-Straße", state: "Berlin", country: "Germany" },
  { code: "10437", city: "Berlin", area: "Prenzlauer Berg", state: "Berlin", country: "Germany" },
  { code: "10623", city: "Berlin", area: "Charlottenburg", state: "Berlin", country: "Germany" },

  // Germany - Munich
  { code: "80331", city: "Munich", area: "Altstadt", state: "Bavaria", country: "Germany" },
  { code: "80333", city: "Munich", area: "Maxvorstadt", state: "Bavaria", country: "Germany" },
  { code: "80469", city: "Munich", area: "Isarvorstadt", state: "Bavaria", country: "Germany" },
  { code: "80539", city: "Munich", area: "Lehel", state: "Bavaria", country: "Germany" },

  // France - Paris
  { code: "75001", city: "Paris", area: "Louvre", state: "Île-de-France", country: "France" },
  { code: "75002", city: "Paris", area: "Bourse", state: "Île-de-France", country: "France" },
  { code: "75003", city: "Paris", area: "Le Marais", state: "Île-de-France", country: "France" },
  { code: "75004", city: "Paris", area: "Hôtel de Ville", state: "Île-de-France", country: "France" },
  { code: "75005", city: "Paris", area: "Latin Quarter", state: "Île-de-France", country: "France" },
  { code: "75006", city: "Paris", area: "Saint-Germain", state: "Île-de-France", country: "France" },
  { code: "75007", city: "Paris", area: "Eiffel Tower", state: "Île-de-France", country: "France" },
  { code: "75008", city: "Paris", area: "Champs-Élysées", state: "Île-de-France", country: "France" },
  { code: "75016", city: "Paris", area: "Passy", state: "Île-de-France", country: "France" },

  // Japan - Tokyo
  { code: "100-0001", city: "Tokyo", area: "Chiyoda", state: "Tokyo", country: "Japan" },
  { code: "100-0005", city: "Tokyo", area: "Marunouchi", state: "Tokyo", country: "Japan" },
  { code: "105-0001", city: "Tokyo", area: "Toranomon", state: "Tokyo", country: "Japan" },
  { code: "106-0032", city: "Tokyo", area: "Roppongi", state: "Tokyo", country: "Japan" },
  { code: "150-0001", city: "Tokyo", area: "Shibuya", state: "Tokyo", country: "Japan" },
  { code: "151-0051", city: "Tokyo", area: "Sendagaya", state: "Tokyo", country: "Japan" },
  { code: "160-0022", city: "Tokyo", area: "Shinjuku", state: "Tokyo", country: "Japan" },
  { code: "110-0001", city: "Tokyo", area: "Asakusa", state: "Tokyo", country: "Japan" },

  // South Korea - Seoul
  { code: "04524", city: "Seoul", area: "Gangnam", state: "Seoul", country: "South Korea" },
  { code: "06000", city: "Seoul", area: "Gangnam-gu", state: "Seoul", country: "South Korea" },
  { code: "03000", city: "Seoul", area: "Jongno-gu", state: "Seoul", country: "South Korea" },
  { code: "04000", city: "Seoul", area: "Yongsan-gu", state: "Seoul", country: "South Korea" },
  { code: "07000", city: "Seoul", area: "Songpa-gu", state: "Seoul", country: "South Korea" },

  // China - Shanghai
  { code: "200001", city: "Shanghai", area: "Huangpu", state: "Shanghai", country: "China" },
  { code: "200002", city: "Shanghai", area: "The Bund", state: "Shanghai", country: "China" },
  { code: "200040", city: "Shanghai", area: "Pudong", state: "Shanghai", country: "China" },
  { code: "200120", city: "Shanghai", area: "Lujiazui", state: "Shanghai", country: "China" },

  // China - Beijing
  { code: "100000", city: "Beijing", area: "Dongcheng", state: "Beijing", country: "China" },
  { code: "100001", city: "Beijing", area: "Xicheng", state: "Beijing", country: "China" },
  { code: "100004", city: "Beijing", area: "Chaoyang", state: "Beijing", country: "China" },

  // Netherlands - Amsterdam
  { code: "1011", city: "Amsterdam", area: "Centrum", state: "North Holland", country: "Netherlands" },
  { code: "1012", city: "Amsterdam", area: "Grachtengordel", state: "North Holland", country: "Netherlands" },
  { code: "1017", city: "Amsterdam", area: "Museum Quarter", state: "North Holland", country: "Netherlands" },
  { code: "1071", city: "Amsterdam", area: "Zuid", state: "North Holland", country: "Netherlands" },

  // Spain - Madrid
  { code: "28001", city: "Madrid", area: "Centro", state: "Madrid", country: "Spain" },
  { code: "28004", city: "Madrid", area: "Salamanca", state: "Madrid", country: "Spain" },
  { code: "28013", city: "Madrid", area: "Centro-Sol", state: "Madrid", country: "Spain" },
  { code: "28014", city: "Madrid", area: "Huertas", state: "Madrid", country: "Spain" },

  // Spain - Barcelona
  { code: "08001", city: "Barcelona", area: "Ciutat Vella", state: "Catalonia", country: "Spain" },
  { code: "08002", city: "Barcelona", area: "Gothic Quarter", state: "Catalonia", country: "Spain" },
  { code: "08003", city: "Barcelona", area: "El Born", state: "Catalonia", country: "Spain" },
  { code: "08007", city: "Barcelona", area: "Eixample", state: "Catalonia", country: "Spain" },

  // Italy - Rome
  { code: "00184", city: "Rome", area: "Esquilino", state: "Lazio", country: "Italy" },
  { code: "00186", city: "Rome", area: "Centro Storico", state: "Lazio", country: "Italy" },
  { code: "00187", city: "Rome", area: "Trevi", state: "Lazio", country: "Italy" },

  // Brazil - São Paulo
  { code: "01310-100", city: "São Paulo", area: "Avenida Paulista", state: "São Paulo", country: "Brazil" },
  { code: "01310-200", city: "São Paulo", area: "Bela Vista", state: "São Paulo", country: "Brazil" },
  { code: "01414-001", city: "São Paulo", area: "Jardins", state: "São Paulo", country: "Brazil" },

  // Mexico - Mexico City
  { code: "06000", city: "Mexico City", area: "Centro Histórico", state: "CDMX", country: "Mexico" },
  { code: "06100", city: "Mexico City", area: "Roma Norte", state: "CDMX", country: "Mexico" },
  { code: "06700", city: "Mexico City", area: "Condesa", state: "CDMX", country: "Mexico" },

  // South Africa - Cape Town
  { code: "8001", city: "Cape Town", area: "City Centre", state: "Western Cape", country: "South Africa" },
  { code: "8005", city: "Cape Town", area: "Sea Point", state: "Western Cape", country: "South Africa" },
  { code: "7700", city: "Cape Town", area: "Newlands", state: "Western Cape", country: "South Africa" },

  // New Zealand - Auckland
  { code: "1010", city: "Auckland", area: "Auckland CBD", state: "Auckland", country: "New Zealand" },
  { code: "1011", city: "Auckland", area: "Britomart", state: "Auckland", country: "New Zealand" },
  { code: "1021", city: "Auckland", area: "Ponsonby", state: "Auckland", country: "New Zealand" },
];

export const searchPostalCodes = (query: string): PostalCode[] => {
  if (!query || query.length < 2) {
    return [];
  }

  const searchTerm = query.toLowerCase();
  
  return POSTAL_CODES_DB.filter((item) => {
    return (
      item.code.toLowerCase().includes(searchTerm) ||
      item.city.toLowerCase().includes(searchTerm) ||
      item.area?.toLowerCase().includes(searchTerm) ||
      item.state.toLowerCase().includes(searchTerm) ||
      item.country.toLowerCase().includes(searchTerm)
    );
  }).slice(0, 20); // Limit to 20 results
};
