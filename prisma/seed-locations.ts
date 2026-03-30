import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INDIAN_STATES_DISTRICTS = [
    {
        state: "Andhra Pradesh",
        code: "AP",
        districts: [
            "Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool",
            "Prakasam", "Srikakulam", "Sri Potti Sriramulu Nellore", "Visakhapatnam",
            "Vizianagaram", "West Godavari", "YSR District, Kadapa"
        ]
    },
    {
        state: "Arunachal Pradesh",
        code: "AR",
        districts: [
            "Tawang", "West Kameng", "East Kameng", "Papum Pare", "Kurung Kumey",
            "Kra Daadi", "Lower Subansiri", "Upper Subansiri", "West Siang", "East Siang",
            "Siang", "Upper Siang", "Lower Siang", "Lower Dibang Valley", "Dibang Valley",
            "Anjaw", "Lohit", "Namsai", "Changlang", "Tirap", "Longding"
        ]
    },
    {
        state: "Assam",
        code: "AS",
        districts: [
            "Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo",
            "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao",
            "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup",
            "Kamrup Metropolitan", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur",
            "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur",
            "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"
        ]
    },
    {
        state: "Bihar",
        code: "BR",
        districts: [
            "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur",
            "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad",
            "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura",
            "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia",
            "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar",
            "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"
        ]
    },
    {
        state: "Chhattisgarh",
        code: "CG",
        districts: [
            "Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur",
            "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Janjgir-Champa",
            "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund",
            "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma",
            "Surajpur", "Surguja"
        ]
    },
    {
        state: "Goa",
        code: "GA",
        districts: ["North Goa", "South Goa"]
    },
    {
        state: "Gujarat",
        code: "GJ",
        districts: [
            "Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch",
            "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka",
            "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch",
            "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal",
            "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar",
            "Tapi", "Vadodara", "Valsad"
        ]
    },
    {
        state: "Haryana",
        code: "HR",
        districts: [
            "Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram",
            "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh",
            "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa",
            "Sonipat", "Yamunanagar"
        ]
    },
    {
        state: "Himachal Pradesh",
        code: "HP",
        districts: [
            "Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu",
            "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"
        ]
    },
    {
        state: "Jharkhand",
        code: "JH",
        districts: [
            "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum",
            "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti",
            "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi",
            "Sahibganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"
        ]
    },
    {
        state: "Karnataka",
        code: "KA",
        districts: [
            "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban",
            "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga",
            "Dakshina Kannada", "Davangere", "Dharwad", "Gadag", "Hassan", "Haveri",
            "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur",
            "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada",
            "Vijayapura", "Yadgir"
        ]
    },
    {
        state: "Kerala",
        code: "KL",
        districts: [
            "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasargod", "Kollam",
            "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta",
            "Thiruvananthapuram", "Thrissur", "Wayanad"
        ]
    },
    {
        state: "Madhya Pradesh",
        code: "MP",
        districts: [
            "Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani",
            "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara",
            "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda",
            "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa",
            "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch",
            "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna",
            "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi",
            "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"
        ]
    },
    {
        state: "Maharashtra",
        code: "MH",
        districts: [
            "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara",
            "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli",
            "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban",
            "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar",
            "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg",
            "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"
        ]
    },
    {
        state: "Manipur",
        code: "MN",
        districts: [
            "Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West",
            "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl",
            "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"
        ]
    },
    {
        state: "Meghalaya",
        code: "ML",
        districts: [
            "East Garo Hills", "East Jaintia Hills", "East Khasi Hills",
            "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills",
            "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills",
            "West Khasi Hills"
        ]
    },
    {
        state: "Mizoram",
        code: "MZ",
        districts: [
            "Aizawl", "Champhai", "Kolasib", "Lawngtlai", "Lunglei", "Mamit",
            "Saiha", "Serchhip"
        ]
    },
    {
        state: "Nagaland",
        code: "NL",
        districts: [
            "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon",
            "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto"
        ]
    },
    {
        state: "Odisha",
        code: "OD",
        districts: [
            "Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh",
            "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur",
            "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar",
            "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh",
            "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"
        ]
    },
    {
        state: "Punjab",
        code: "PB",
        districts: [
            "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib",
            "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar",
            "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Nawanshahr",
            "Pathankot", "Patiala", "Rupnagar", "Sahibzada Ajit Singh Nagar",
            "Sangrur", "Tarn Taran"
        ]
    },
    {
        state: "Rajasthan",
        code: "RJ",
        districts: [
            "Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara",
            "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur",
            "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu",
            "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand",
            "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"
        ]
    },
    {
        state: "Sikkim",
        code: "SK",
        districts: ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"]
    },
    {
        state: "Tamil Nadu",
        code: "TN",
        districts: [
            "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
            "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram",
            "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
            "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
            "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur",
            "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur",
            "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore",
            "Viluppuram", "Virudhunagar"
        ]
    },
    {
        state: "Telangana",
        code: "TS",
        districts: [
            "Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon",
            "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar",
            "Khammam", "Kumuram Bheem", "Mahabubabad", "Mahabubnagar", "Mancherial",
            "Medak", "Medchal", "Nagarkurnool", "Nalgonda", "Nirmal", "Nizamabad",
            "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet",
            "Suryapet", "Vikarabad", "Wanaparthy", "Warangal (Rural)", "Warangal (Urban)",
            "Yadadri Bhuvanagiri"
        ]
    },
    {
        state: "Tripura",
        code: "TR",
        districts: [
            "Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala",
            "South Tripura", "Unakoti", "West Tripura"
        ]
    },
    {
        state: "Uttar Pradesh",
        code: "UP",
        districts: [
            "Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya",
            "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur",
            "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun",
            "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah",
            "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad",
            "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras",
            "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar",
            "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow",
            "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur",
            "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj",
            "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar",
            "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur",
            "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"
        ]
    },
    {
        state: "Uttarakhand",
        code: "UK",
        districts: [
            "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar",
            "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal",
            "Udham Singh Nagar", "Uttarkashi"
        ]
    },
    {
        state: "West Bengal",
        code: "WB",
        districts: [
            "Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur",
            "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong",
            "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas",
            "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur",
            "Purulia", "South 24 Parganas", "Uttar Dinajpur"
        ]
    },
    {
        state: "Andaman and Nicobar Islands",
        code: "AN",
        districts: ["Nicobar", "North and Middle Andaman", "South Andaman"]
    },
    {
        state: "Chandigarh",
        code: "CH",
        districts: ["Chandigarh"]
    },
    {
        state: "Dadra and Nagar Haveli and Daman and Diu",
        code: "DN",
        districts: ["Dadra and Nagar Haveli", "Daman", "Diu"]
    },
    {
        state: "Delhi",
        code: "DL",
        districts: [
            "Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi",
            "North West Delhi", "Shahdara", "South Delhi", "South East Delhi",
            "South West Delhi", "West Delhi"
        ]
    },
    {
        state: "Jammu and Kashmir",
        code: "JK",
        districts: [
            "Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal",
            "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama",
            "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"
        ]
    },
    {
        state: "Ladakh",
        code: "LA",
        districts: ["Kargil", "Leh"]
    },
    {
        state: "Lakshadweep",
        code: "LD",
        districts: ["Lakshadweep"]
    },
    {
        state: "Puducherry",
        code: "PY",
        districts: ["Karaikal", "Mahe", "Puducherry", "Yanam"]
    }
];

async function main() {
    console.log('Start seeding locations...');

    for (const stateData of INDIAN_STATES_DISTRICTS) {
        // 1. Upsert State
        const state = await prisma.state.upsert({
            where: { code: stateData.code },
            update: { name: stateData.state },
            create: {
                name: stateData.state,
                code: stateData.code,
            },
        });

        console.log(`Upserted State: ${state.name}`);

        // 2. Upsert Districts
        for (const districtName of stateData.districts) {
            // Create a unique code for the district: "{STATE_CODE}-{DISTRICT_NAME_UPPERCASE}"
            // Or just slugify it. The schema says `code` is a String and unique within (stateId, code).
            // We will generate a simple code like "SCODE-DNAME_PREFIX" or just name-slug.
            // Let's use first 3-4 letters or meaningful abbr.
            // But simplifying: code = districtName.toUpperCase().replace(/\s+/g, '').substring(0, 5)
            // Actually code for district might need to be unique per state.

            const districtCode = districtName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10);

            await prisma.district.upsert({
                where: {
                    stateId_code: {
                        stateId: state.id,
                        code: districtCode,
                    },
                },
                update: { name: districtName },
                create: {
                    name: districtName,
                    code: districtCode,
                    stateId: state.id,
                },
            });
        }
        console.log(` - Upserted ${stateData.districts.length} districts for ${state.name}`);
    }

    console.log('Seeding locations finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
